import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Exchange rates for currency conversion (hardcoded for demo, use API in production)
 */
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  CHF: 1.13,
};

/**
 * Data Transformer Service
 * Handles normalization, deduplication, and enrichment of property data
 */
export class DataTransformerService {
  /**
   * Remove duplicate listings based on ID and address similarity
   */
  public deduplicate(houses: UnifiedHouseModel[]): UnifiedHouseModel[] {
    const seen = new Map<string, UnifiedHouseModel>();
    const addressMap = new Map<string, UnifiedHouseModel>();

    for (const house of houses) {
      // Check for exact ID match
      if (seen.has(house.id)) {
        continue;
      }

      // Check for address similarity
      const addressKey = this.generateAddressKey(house);
      if (addressKey.length > 0 && addressMap.has(addressKey)) {
        // Found duplicate, merge them
        const existing = addressMap.get(addressKey);
        if (existing != null) {
          const merged = this.mergeDuplicates([existing, house]);
          addressMap.set(addressKey, merged);
          seen.set(merged.id, merged);
        }
        continue;
      }

      // New unique listing
      seen.set(house.id, house);
      if (addressKey.length > 0) {
        addressMap.set(addressKey, house);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Merge multiple duplicate listings into a single enriched listing
   */
  public mergeDuplicates(houses: UnifiedHouseModel[]): UnifiedHouseModel {
    if (houses.length === 0) {
      throw new Error('Cannot merge empty array of houses');
    }

    if (houses.length === 1) {
      return houses[0] as UnifiedHouseModel;
    }

    // Sort by extraction date (newest first)
    const sorted = [...houses].sort((a, b) => {
      return b.metadata.extractedAt.getTime() - a.metadata.extractedAt.getTime();
    });

    // Use newest as base
    const base = { ...sorted[0] } as UnifiedHouseModel;

    // Merge details from all sources
    const mergedDetails = { ...base.details };
    const mergedImages: UnifiedHouseModel['images'] = [...(base.images ?? [])];
    const mergedAmenities = new Set(base.amenities ?? []);

    for (const house of sorted.slice(1)) {
      // Merge details (prefer non-null values)
      if (house.details != null) {
        Object.assign(mergedDetails, {
          bedrooms: mergedDetails.bedrooms ?? house.details.bedrooms,
          bathrooms: mergedDetails.bathrooms ?? house.details.bathrooms,
          livingArea: mergedDetails.livingArea ?? house.details.livingArea,
          lotSize: mergedDetails.lotSize ?? house.details.lotSize,
          yearBuilt: mergedDetails.yearBuilt ?? house.details.yearBuilt,
          energyRating: mergedDetails.energyRating ?? house.details.energyRating,
          heatingType: mergedDetails.heatingType ?? house.details.heatingType,
          parkingSpaces: mergedDetails.parkingSpaces ?? house.details.parkingSpaces,
          floors: mergedDetails.floors ?? house.details.floors,
        });
      }

      // Merge images
      if (house.images != null) {
        mergedImages.push(...house.images);
      }

      // Merge amenities
      if (house.amenities != null) {
        house.amenities.forEach((a: string) => mergedAmenities.add(a));
      }
    }

    return {
      ...base,
      details: Object.keys(mergedDetails).length > 0 ? mergedDetails : undefined,
      images: mergedImages.length > 0 ? mergedImages : undefined,
      amenities: mergedAmenities.size > 0 ? Array.from(mergedAmenities) : undefined,
    };
  }

  /**
   * Normalize price to USD for consistent comparison
   */
  public normalizePriceToUSD(price: number, currency: string): number {
    const rate = EXCHANGE_RATES[currency];
    if (rate === undefined) {
      return price; // Unknown currency, assume 1:1
    }

    return price * rate;
  }

  /**
   * Calculate confidence score for a listing (0-1)
   */
  public calculateConfidence(house: UnifiedHouseModel): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (already present) - baseline
    score += 20;
    maxScore += 20;

    // Description
    maxScore += 10;
    if (house.description != null && house.description.length > 50) {
      score += 10;
    } else if (house.description != null) {
      score += 5;
    }

    // Location details
    maxScore += 15;
    if (house.location.address != null) score += 5;
    if (house.location.postalCode != null) score += 5;
    if (house.location.latitude != null && house.location.longitude != null) score += 5;

    // Property details
    maxScore += 20;
    if (house.details != null) {
      if (house.details.bedrooms != null) score += 4;
      if (house.details.bathrooms != null) score += 4;
      if (house.details.livingArea != null) score += 4;
      if (house.details.yearBuilt != null) score += 4;
      if (house.details.energyRating != null) score += 4;
    }

    // Media
    maxScore += 15;
    if (house.images != null && house.images.length > 0) {
      score += Math.min(house.images.length * 3, 15);
    }

    // Amenities
    maxScore += 10;
    if (house.amenities != null && house.amenities.length > 0) {
      score += Math.min(house.amenities.length * 2, 10);
    }

    // Contact information
    maxScore += 10;
    if (house.contact != null) {
      if (house.contact.phone != null) score += 5;
      if (house.contact.email != null) score += 5;
    }

    return score / maxScore;
  }

  /**
   * Enrich data with calculated fields and metadata
   */
  public enrichData(houses: UnifiedHouseModel[]): UnifiedHouseModel[] {
    return houses.map((house) => {
      // Calculate confidence score
      const confidence = this.calculateConfidence(house);

      // Calculate price per square meter if possible
      let pricePerSquareMeter: number | undefined;
      if (house.details?.livingArea != null && house.details.livingArea > 0) {
        const priceInUSD = this.normalizePriceToUSD(house.price, house.currency);
        pricePerSquareMeter = priceInUSD / house.details.livingArea;
      }

      return {
        ...house,
        pricePerSquareMeter,
        metadata: {
          ...house.metadata,
          confidence,
        },
      };
    });
  }

  /**
   * Generate a normalized address key for deduplication
   */
  private generateAddressKey(house: UnifiedHouseModel): string {
    const parts: string[] = [];

    if (house.location.address != null) {
      // Normalize address: lowercase, remove special chars, standardize
      const normalized = house.location.address
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/street/g, 'st')
        .replace(/avenue/g, 'ave')
        .replace(/\s+/g, '-');
      parts.push(normalized);
    }

    if (house.location.city != null) {
      parts.push(house.location.city.toLowerCase());
    }

    if (house.location.postalCode != null) {
      parts.push(house.location.postalCode);
    }

    return parts.join('|');
  }

  /**
   * Transform and enrich raw extracted data
   * This is the main entry point for the service
   */
  public transform(houses: UnifiedHouseModel[]): UnifiedHouseModel[] {
    // Step 1: Deduplicate
    const deduplicated = this.deduplicate(houses);

    // Step 2: Enrich with calculated fields
    const enriched = this.enrichData(deduplicated);

    // Step 3: Sort by confidence (highest first)
    return enriched.sort((a, b) => {
      const aConf = a.metadata.confidence ?? 0;
      const bConf = b.metadata.confidence ?? 0;
      return bConf - aConf;
    });
  }
}
