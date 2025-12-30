/**
 * Property Comparison Tool
 * Side-by-side comparison with intelligent insights
 */

import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Comparison result
 */
export interface PropertyComparison {
  properties: UnifiedHouseModel[];
  insights: ComparisonInsights;
  rankings: PropertyRankings;
  recommendations: string[];
  generatedAt: Date;
}

/**
 * Comparison insights
 */
export interface ComparisonInsights {
  priceAnalysis: {
    cheapest: string; // property ID
    mostExpensive: string;
    averagePrice: number;
    priceRange: number;
    bestValue: string; // Best price per sqm
  };
  locationAnalysis: {
    closestToCenter: string;
    mostDesirableArea: string;
    diversityScore: number; // 0-100, how diverse the locations are
  };
  sizeAnalysis: {
    largest: string;
    smallest: string;
    averageArea: number;
    mostRooms: string;
  };
  featuresAnalysis: {
    mostFeatures: string;
    uniqueFeatures: Map<string, string[]>; // property ID -> unique features
    commonFeatures: string[]; // Features all properties share
  };
  valueAnalysis: {
    bestOverall: string;
    bestForFamilies: string;
    bestForProfessionals: string;
    bestInvestment: string;
  };
}

/**
 * Property rankings
 */
export interface PropertyRankings {
  byPrice: string[]; // Property IDs sorted by price
  byArea: string[]; // Property IDs sorted by area
  byValue: string[]; // Property IDs sorted by price per sqm
  byRecency: string[]; // Property IDs sorted by listing date
  overall: string[]; // Property IDs sorted by overall score
}

/**
 * Comparison dimension
 */
export interface ComparisonDimension {
  name: string;
  properties: Map<string, ComparisonValue>;
  winner: string; // property ID with best value
  summary: string;
}

/**
 * Comparison value
 */
export interface ComparisonValue {
  value: any;
  displayValue: string;
  score: number; // 0-100, normalized score for this dimension
  highlight: 'best' | 'worst' | 'neutral';
}

/**
 * Comparison matrix (for tabular display)
 */
export interface ComparisonMatrix {
  dimensions: string[]; // Row headers
  properties: Map<string, Map<string, ComparisonValue>>; // property ID -> dimension -> value
}

/**
 * Property Comparison Tool
 */
export class PropertyComparisonTool {
  /**
   * Compare multiple properties
   */
  public compare(properties: UnifiedHouseModel[]): PropertyComparison {
    if (properties.length < 2) {
      throw new Error('Need at least 2 properties to compare');
    }

    if (properties.length > 10) {
      throw new Error('Can compare maximum 10 properties at once');
    }

    const insights = this.generateInsights(properties);
    const rankings = this.generateRankings(properties);
    const recommendations = this.generateRecommendations(properties, insights);

    return {
      properties,
      insights,
      rankings,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate comparison matrix for tabular display
   */
  public generateMatrix(properties: UnifiedHouseModel[]): ComparisonMatrix {
    const dimensions = [
      'Price',
      'Price per m²',
      'Area',
      'Rooms',
      'Type',
      'Location',
      'Listing Age',
      'Source Quality',
    ];

    const matrix = new Map<string, Map<string, ComparisonValue>>();

    for (const property of properties) {
      const propertyValues = new Map<string, ComparisonValue>();

      // Price
      propertyValues.set('Price', {
        value: property.price,
        displayValue: `€${property.price.toLocaleString()}`,
        score: this.normalizePriceScore(property.price, properties),
        highlight: this.isExtreme(property.price, properties.map((p) => p.price)),
      });

      // Price per sqm
      if (property.area != null && property.area > 0) {
        const pricePerSqm = property.price / property.area;
        const allPricesPerSqm = properties
          .filter((p) => p.area != null && p.area > 0)
          .map((p) => p.price / p.area!);

        propertyValues.set('Price per m²', {
          value: pricePerSqm,
          displayValue: `€${pricePerSqm.toFixed(2)}/m²`,
          score: this.normalizePriceScore(pricePerSqm, properties, true),
          highlight: this.isExtreme(pricePerSqm, allPricesPerSqm),
        });
      }

      // Area
      if (property.area != null) {
        propertyValues.set('Area', {
          value: property.area,
          displayValue: `${property.area} m²`,
          score: this.normalizeScore(property.area, properties.map((p) => p.area ?? 0)),
          highlight: this.isExtreme(property.area, properties.map((p) => p.area ?? 0)),
        });
      }

      // Rooms
      if (property.rooms != null) {
        propertyValues.set('Rooms', {
          value: property.rooms,
          displayValue: `${property.rooms}`,
          score: this.normalizeScore(property.rooms, properties.map((p) => p.rooms ?? 0)),
          highlight: this.isExtreme(property.rooms, properties.map((p) => p.rooms ?? 0)),
        });
      }

      // Type
      propertyValues.set('Type', {
        value: property.type,
        displayValue: property.type ?? 'Unknown',
        score: 50, // Neutral for categorical data
        highlight: 'neutral',
      });

      // Location
      propertyValues.set('Location', {
        value: property.location.city,
        displayValue: `${property.location.city ?? 'Unknown'}${property.location.country ? ', ' + property.location.country : ''}`,
        score: 50,
        highlight: 'neutral',
      });

      // Listing age
      const listingAge = this.getListingAge(property);
      propertyValues.set('Listing Age', {
        value: listingAge,
        displayValue: this.formatListingAge(listingAge),
        score: 100 - Math.min(100, (listingAge / 30) * 100), // Newer = better score
        highlight: listingAge < 7 ? 'best' : listingAge > 30 ? 'worst' : 'neutral',
      });

      // Source quality
      const confidence = property.metadata.confidence ?? 0.5;
      propertyValues.set('Source Quality', {
        value: confidence,
        displayValue: `${(confidence * 100).toFixed(0)}%`,
        score: confidence * 100,
        highlight: confidence > 0.8 ? 'best' : confidence < 0.5 ? 'worst' : 'neutral',
      });

      matrix.set(property.id, propertyValues);
    }

    return { dimensions, properties: matrix };
  }

  /**
   * Get comparison by specific dimension
   */
  public compareDimension(
    properties: UnifiedHouseModel[],
    dimension: string
  ): ComparisonDimension {
    const values = new Map<string, ComparisonValue>();

    for (const property of properties) {
      let value: any;
      let displayValue: string;

      switch (dimension.toLowerCase()) {
        case 'price':
          value = property.price;
          displayValue = `€${property.price.toLocaleString()}`;
          break;
        case 'area':
          value = property.area ?? 0;
          displayValue = property.area != null ? `${property.area} m²` : 'N/A';
          break;
        case 'rooms':
          value = property.rooms ?? 0;
          displayValue = property.rooms != null ? `${property.rooms}` : 'N/A';
          break;
        case 'value':
          value =
            property.area != null && property.area > 0
              ? property.price / property.area
              : Infinity;
          displayValue =
            property.area != null && property.area > 0
              ? `€${(property.price / property.area).toFixed(2)}/m²`
              : 'N/A';
          break;
        default:
          value = 0;
          displayValue = 'N/A';
      }

      const allValues = Array.from(values.values()).map((v) => v.value);
      values.set(property.id, {
        value,
        displayValue,
        score: this.normalizeScore(value, [...allValues, value]),
        highlight: 'neutral',
      });
    }

    // Determine winner (lowest price, highest area, etc.)
    const winner = this.determineWinner(values, dimension);

    // Update highlights
    for (const [id, compValue] of values.entries()) {
      if (id === winner) {
        compValue.highlight = 'best';
      } else {
        const allValues = Array.from(values.values()).map((v) => v.value);
        compValue.highlight = this.isExtreme(compValue.value, allValues);
      }
    }

    return {
      name: dimension,
      properties: values,
      winner,
      summary: this.generateDimensionSummary(dimension, values, winner),
    };
  }

  /**
   * Generate insights
   */
  private generateInsights(properties: UnifiedHouseModel[]): ComparisonInsights {
    // Price analysis
    const prices = properties.map((p) => ({ id: p.id, price: p.price }));
    const cheapest = prices.reduce((min, p) => (p.price < min.price ? p : min)).id;
    const mostExpensive = prices.reduce((max, p) => (p.price > max.price ? p : max)).id;
    const averagePrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const priceRange =
      Math.max(...prices.map((p) => p.price)) - Math.min(...prices.map((p) => p.price));

    // Best value (price per sqm)
    const withArea = properties.filter((p) => p.area != null && p.area > 0);
    const bestValue =
      withArea.length > 0
        ? withArea.reduce((best, p) => {
            const bestRatio = best.price / (best.area ?? 1);
            const pRatio = p.price / (p.area ?? 1);
            return pRatio < bestRatio ? p : best;
          }).id
        : properties[0].id;

    // Size analysis
    const areas = properties
      .filter((p) => p.area != null)
      .map((p) => ({ id: p.id, area: p.area! }));
    const largest = areas.length > 0 ? areas.reduce((max, p) => (p.area > max.area ? p : max)).id : properties[0].id;
    const smallest = areas.length > 0 ? areas.reduce((min, p) => (p.area < min.area ? p : min)).id : properties[0].id;
    const averageArea =
      areas.length > 0 ? areas.reduce((sum, p) => sum + p.area, 0) / areas.length : 0;

    const rooms = properties
      .filter((p) => p.rooms != null)
      .map((p) => ({ id: p.id, rooms: p.rooms! }));
    const mostRooms =
      rooms.length > 0
        ? rooms.reduce((max, p) => (p.rooms > max.rooms ? p : max)).id
        : properties[0].id;

    // Features analysis
    const features = this.extractAllFeatures(properties);
    const mostFeatures =
      features.size > 0
        ? Array.from(features.entries()).reduce((max, [id, f]) =>
            f.length > (features.get(max)?.length ?? 0) ? id : max
          , properties[0].id)
        : properties[0].id;

    // Find unique features
    const uniqueFeatures = new Map<string, string[]>();
    for (const [id, propFeatures] of features.entries()) {
      const unique = propFeatures.filter((f) => {
        // Feature is unique if no other property has it
        let count = 0;
        for (const [otherId, otherFeatures] of features.entries()) {
          if (otherId !== id && otherFeatures.includes(f)) {
            count++;
          }
        }
        return count === 0;
      });
      if (unique.length > 0) {
        uniqueFeatures.set(id, unique);
      }
    }

    // Find common features
    const allFeatureLists = Array.from(features.values());
    const commonFeatures =
      allFeatureLists.length > 0
        ? allFeatureLists[0].filter((f) => allFeatureLists.every((list) => list.includes(f)))
        : [];

    // Value analysis (best overall, best for families, etc.)
    const scores = properties.map((p) => ({
      id: p.id,
      overall: this.calculateOverallScore(p),
      family: this.calculateFamilyScore(p),
      professional: this.calculateProfessionalScore(p),
      investment: this.calculateInvestmentScore(p),
    }));

    const bestOverall = scores.reduce((max, s) => (s.overall > max.overall ? s : max)).id;
    const bestForFamilies = scores.reduce((max, s) => (s.family > max.family ? s : max)).id;
    const bestForProfessionals = scores.reduce((max, s) =>
      s.professional > max.professional ? s : max
    ).id;
    const bestInvestment = scores.reduce((max, s) =>
      s.investment > max.investment ? s : max
    ).id;

    return {
      priceAnalysis: {
        cheapest,
        mostExpensive,
        averagePrice,
        priceRange,
        bestValue,
      },
      locationAnalysis: {
        closestToCenter: properties[0].id, // Placeholder
        mostDesirableArea: properties[0].id, // Placeholder
        diversityScore: this.calculateLocationDiversity(properties),
      },
      sizeAnalysis: {
        largest,
        smallest,
        averageArea,
        mostRooms,
      },
      featuresAnalysis: {
        mostFeatures,
        uniqueFeatures,
        commonFeatures,
      },
      valueAnalysis: {
        bestOverall,
        bestForFamilies,
        bestForProfessionals,
        bestInvestment,
      },
    };
  }

  /**
   * Generate rankings
   */
  private generateRankings(properties: UnifiedHouseModel[]): PropertyRankings {
    // By price (lowest to highest)
    const byPrice = [...properties]
      .sort((a, b) => a.price - b.price)
      .map((p) => p.id);

    // By area (largest to smallest)
    const byArea = [...properties]
      .sort((a, b) => (b.area ?? 0) - (a.area ?? 0))
      .map((p) => p.id);

    // By value (lowest price per sqm to highest)
    const byValue = [...properties]
      .filter((p) => p.area != null && p.area > 0)
      .sort((a, b) => {
        const aValue = a.price / (a.area ?? 1);
        const bValue = b.price / (b.area ?? 1);
        return aValue - bValue;
      })
      .map((p) => p.id);

    // By recency (newest to oldest)
    const byRecency = [...properties]
      .sort(
        (a, b) =>
          new Date(b.metadata.extractedAt).getTime() -
          new Date(a.metadata.extractedAt).getTime()
      )
      .map((p) => p.id);

    // Overall (by composite score)
    const overall = [...properties]
      .sort((a, b) => this.calculateOverallScore(b) - this.calculateOverallScore(a))
      .map((p) => p.id);

    return {
      byPrice,
      byArea,
      byValue,
      byRecency,
      overall,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    properties: UnifiedHouseModel[],
    insights: ComparisonInsights
  ): string[] {
    const recommendations: string[] = [];

    // Price recommendations
    const priceRangePercent =
      (insights.priceAnalysis.priceRange / insights.priceAnalysis.averagePrice) * 100;

    if (priceRangePercent > 30) {
      recommendations.push(
        `Wide price range (${priceRangePercent.toFixed(0)}% difference) - Consider if the expensive options offer proportional value`
      );
    }

    // Value recommendations
    const bestValueProp = properties.find((p) => p.id === insights.priceAnalysis.bestValue);
    if (bestValueProp != null) {
      const bestValueRatio = bestValueProp.price / (bestValueProp.area ?? 1);
      recommendations.push(
        `Best value: ${bestValueProp.title} at €${bestValueRatio.toFixed(2)}/m²`
      );
    }

    // Overall winner
    const winnerProp = properties.find((p) => p.id === insights.valueAnalysis.bestOverall);
    if (winnerProp != null) {
      recommendations.push(
        `Overall best choice: ${winnerProp.title} - Balanced across all criteria`
      );
    }

    // Family-specific
    const familyProp = properties.find((p) => p.id === insights.valueAnalysis.bestForFamilies);
    if (familyProp != null && familyProp.id !== winnerProp?.id) {
      recommendations.push(
        `Best for families: ${familyProp.title} - Spacious with good amenities`
      );
    }

    // Unique features
    if (insights.featuresAnalysis.uniqueFeatures.size > 0) {
      for (const [id, features] of insights.featuresAnalysis.uniqueFeatures.entries()) {
        const prop = properties.find((p) => p.id === id);
        if (prop != null && features.length > 0) {
          recommendations.push(
            `${prop.title} offers unique features: ${features.slice(0, 2).join(', ')}`
          );
        }
      }
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Extract features from all properties
   */
  private extractAllFeatures(
    properties: UnifiedHouseModel[]
  ): Map<string, string[]> {
    const features = new Map<string, string[]>();

    for (const property of properties) {
      const propFeatures: string[] = [];

      // Extract from description
      const description = property.description?.toLowerCase() ?? '';

      const featureKeywords = [
        'balcony',
        'terrace',
        'garden',
        'parking',
        'garage',
        'elevator',
        'basement',
        'furnished',
        'kitchen',
        'pool',
        'gym',
      ];

      for (const keyword of featureKeywords) {
        if (description.includes(keyword)) {
          propFeatures.push(keyword);
        }
      }

      features.set(property.id, propFeatures);
    }

    return features;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(property: UnifiedHouseModel): number {
    let score = 50; // Base score

    // Price (lower is better, normalized)
    score += (1500 - property.price) / 100; // Assuming 1500 is target

    // Area (larger is better)
    if (property.area != null) {
      score += property.area / 10;
    }

    // Rooms (more is better)
    if (property.rooms != null) {
      score += property.rooms * 5;
    }

    // Recency (newer is better)
    const age = this.getListingAge(property);
    score += Math.max(0, 30 - age);

    return score;
  }

  /**
   * Calculate family score
   */
  private calculateFamilyScore(property: UnifiedHouseModel): number {
    let score = 0;

    // Rooms (more rooms = better for families)
    if (property.rooms != null) {
      score += property.rooms * 15;
    }

    // Area (larger = better)
    if (property.area != null) {
      score += property.area / 5;
    }

    // Features
    const description = property.description?.toLowerCase() ?? '';
    if (description.includes('garden')) score += 20;
    if (description.includes('balcony')) score += 10;
    if (description.includes('playground')) score += 15;

    return score;
  }

  /**
   * Calculate professional score
   */
  private calculateProfessionalScore(property: UnifiedHouseModel): number {
    let score = 0;

    // Location (city center is better)
    // Placeholder logic
    score += 50;

    // Features
    const description = property.description?.toLowerCase() ?? '';
    if (description.includes('office')) score += 15;
    if (description.includes('internet')) score += 10;
    if (description.includes('coworking')) score += 20;

    // Modern/renovated
    if (description.includes('modern') || description.includes('renovated')) {
      score += 15;
    }

    return score;
  }

  /**
   * Calculate investment score
   */
  private calculateInvestmentScore(property: UnifiedHouseModel): number {
    let score = 0;

    // Price per sqm (lower is better)
    if (property.area != null && property.area > 0) {
      const pricePerSqm = property.price / property.area;
      score += Math.max(0, 100 - pricePerSqm * 5);
    }

    // Quality score
    const confidence = property.metadata.confidence ?? 0.5;
    score += confidence * 30;

    return score;
  }

  /**
   * Calculate location diversity
   */
  private calculateLocationDiversity(properties: UnifiedHouseModel[]): number {
    const cities = new Set(properties.map((p) => p.location.city));
    return (cities.size / properties.length) * 100;
  }

  /**
   * Normalize score to 0-100
   */
  private normalizeScore(value: number, allValues: number[]): number {
    const min = Math.min(...allValues.filter((v) => v > 0));
    const max = Math.max(...allValues);

    if (max === min) return 50;

    return ((value - min) / (max - min)) * 100;
  }

  /**
   * Normalize price score (lower is better)
   */
  private normalizePriceScore(
    value: number,
    properties: UnifiedHouseModel[],
    isPricePerSqm = false
  ): number {
    const values = isPricePerSqm
      ? properties
          .filter((p) => p.area != null && p.area > 0)
          .map((p) => p.price / p.area!)
      : properties.map((p) => p.price);

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (max === min) return 50;

    // Invert: lower price = higher score
    return 100 - ((value - min) / (max - min)) * 100;
  }

  /**
   * Determine if value is extreme (best/worst)
   */
  private isExtreme(value: number, allValues: number[]): 'best' | 'worst' | 'neutral' {
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (value === min) return 'best'; // Assuming lower is better (price)
    if (value === max) return 'worst';
    return 'neutral';
  }

  /**
   * Determine winner for a dimension
   */
  private determineWinner(
    values: Map<string, ComparisonValue>,
    dimension: string
  ): string {
    const entries = Array.from(values.entries());

    // For price and value, lower is better
    if (dimension.toLowerCase().includes('price') || dimension.toLowerCase().includes('value')) {
      return entries.reduce((min, [id, val]) =>
        val.value < values.get(min)!.value ? id : min
      , entries[0][0]);
    }

    // For area, rooms, higher is better
    return entries.reduce((max, [id, val]) =>
      val.value > values.get(max)!.value ? id : max
    , entries[0][0]);
  }

  /**
   * Generate dimension summary
   */
  private generateDimensionSummary(
    dimension: string,
    values: Map<string, ComparisonValue>,
    winner: string
  ): string {
    const winnerValue = values.get(winner);
    if (winnerValue == null) return '';

    return `Best ${dimension.toLowerCase()}: ${winnerValue.displayValue}`;
  }

  /**
   * Get listing age in days
   */
  private getListingAge(property: UnifiedHouseModel): number {
    const now = Date.now();
    const extractedAt = new Date(property.metadata.extractedAt).getTime();
    return Math.floor((now - extractedAt) / (1000 * 60 * 60 * 24));
  }

  /**
   * Format listing age
   */
  private formatListingAge(days: number): string {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}
