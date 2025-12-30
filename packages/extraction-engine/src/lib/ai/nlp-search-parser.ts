/**
 * NLP-Powered Smart Search Parser
 * Parses natural language queries into structured search criteria
 */

import type { UserPreferences } from './recommendation-engine.js';

/**
 * Parsed search query
 */
export interface ParsedSearchQuery {
  originalQuery: string;
  preferences: Partial<UserPreferences>;
  keywords: string[];
  confidence: number; // 0-1
  interpretation: string; // Human-readable interpretation
}

/**
 * Search intent classification
 */
export enum SearchIntent {
  FIND_PROPERTY = 'find_property',
  COMPARE_PRICES = 'compare_prices',
  EXPLORE_AREA = 'explore_area',
  CHECK_AVAILABILITY = 'check_availability',
}

/**
 * NLP Search Parser
 * Understands queries like:
 * - "2 bedroom apartment in Berlin under 1500"
 * - "family house with garden in Munich, max 2000 euro"
 * - "cheap studio near university, pets allowed"
 * - "luxury apartment downtown with parking and balcony"
 */
export class NLPSearchParser {
  private readonly currencyPatterns = /(\$|€|£|USD|EUR|GBP|euro|dollar|pound)/gi;
  private readonly numberPatterns = /\b(\d+(?:,\d{3})*(?:\.\d+)?)\b/g;
  private readonly roomPatterns = /\b(\d+)[\s-]?(bedroom|room|br|zimmer|chambres?)\b/gi;
  private readonly areaPatterns =
    /\b(\d+)[\s-]?(sqm|m2|square\s*meters?|quadrat.*meter)/gi;

  /**
   * Parse natural language query into structured preferences
   */
  public parse(query: string): ParsedSearchQuery {
    const normalizedQuery = query.toLowerCase().trim();
    const preferences: Partial<UserPreferences> = {};
    const keywords: string[] = [];
    let confidence = 0.5; // Base confidence

    // Extract location (cities and countries)
    const locationResult = this.extractLocation(normalizedQuery);
    if (locationResult.cities.length > 0) {
      preferences.preferredCities = locationResult.cities;
      confidence += 0.15;
    }
    if (locationResult.countries.length > 0) {
      preferences.preferredCountries = locationResult.countries;
      confidence += 0.1;
    }

    // Extract budget/price
    const priceResult = this.extractPrice(normalizedQuery);
    if (priceResult.min != null) {
      preferences.budgetMin = priceResult.min;
      confidence += 0.1;
    }
    if (priceResult.max != null) {
      preferences.budgetMax = priceResult.max;
      confidence += 0.15;
    }

    // Extract room count
    const rooms = this.extractRooms(normalizedQuery);
    if (rooms.min != null) {
      preferences.minRooms = rooms.min;
      confidence += 0.1;
    }
    if (rooms.max != null) {
      preferences.maxRooms = rooms.max;
      confidence += 0.05;
    }

    // Extract area
    const area = this.extractArea(normalizedQuery);
    if (area.min != null) {
      preferences.minArea = area.min;
      confidence += 0.05;
    }
    if (area.max != null) {
      preferences.maxArea = area.max;
      confidence += 0.05;
    }

    // Extract property type
    const propertyType = this.extractPropertyType(normalizedQuery);
    if (propertyType.length > 0) {
      preferences.propertyTypes = propertyType;
      confidence += 0.1;
    }

    // Extract features
    const features = this.extractFeatures(normalizedQuery);
    if (features.mustHave.length > 0) {
      preferences.mustHaveFeatures = features.mustHave;
      confidence += 0.15;
    }
    if (features.niceToHave.length > 0) {
      preferences.niceToHaveFeatures = features.niceToHave;
      confidence += 0.05;
    }

    // Extract keywords (non-structural terms)
    keywords.push(...this.extractKeywords(normalizedQuery));

    // Generate human-readable interpretation
    const interpretation = this.generateInterpretation(preferences, keywords);

    confidence = Math.min(1, confidence);

    return {
      originalQuery: query,
      preferences,
      keywords,
      confidence,
      interpretation,
    };
  }

  /**
   * Extract location (cities and countries)
   */
  private extractLocation(query: string): {
    cities: string[];
    countries: string[];
  } {
    const cities: string[] = [];
    const countries: string[] = [];

    // Major cities database (expand in production)
    const knownCities = [
      'berlin',
      'munich',
      'hamburg',
      'cologne',
      'frankfurt',
      'stuttgart',
      'düsseldorf',
      'dortmund',
      'essen',
      'leipzig',
      'bremen',
      'dresden',
      'hannover',
      'nuremberg',
      'paris',
      'lyon',
      'marseille',
      'toulouse',
      'madrid',
      'barcelona',
      'valencia',
      'seville',
      'london',
      'manchester',
      'birmingham',
      'rome',
      'milan',
      'naples',
      'turin',
      'amsterdam',
      'rotterdam',
      'the hague',
      'utrecht',
      'lisbon',
      'porto',
    ];

    // Countries database
    const knownCountries = [
      'germany',
      'france',
      'spain',
      'italy',
      'netherlands',
      'portugal',
      'uk',
      'united kingdom',
      'deutschland',
      'frankreich',
      'spanien',
      'italien',
    ];

    // Check for cities
    for (const city of knownCities) {
      if (query.includes(city)) {
        cities.push(this.capitalize(city));
      }
    }

    // Check for countries
    for (const country of knownCountries) {
      if (query.includes(country)) {
        countries.push(this.capitalize(country));
      }
    }

    return { cities, countries };
  }

  /**
   * Extract price/budget information
   */
  private extractPrice(query: string): { min?: number; max?: number } {
    let min: number | undefined;
    let max: number | undefined;

    // Look for explicit "under", "below", "max", "maximum"
    const maxPatterns = [
      /(?:under|below|max|maximum|bis zu|maximal)\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
      /budget.*?(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
    ];

    for (const pattern of maxPatterns) {
      const match = pattern.exec(query);
      if (match != null) {
        max = this.parseNumber(match[1]);
      }
    }

    // Look for explicit "above", "minimum", "min", "from"
    const minPatterns = [
      /(?:above|over|minimum|min|from|ab|mindestens)\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
    ];

    for (const pattern of minPatterns) {
      const match = pattern.exec(query);
      if (match != null) {
        min = this.parseNumber(match[1]);
      }
    }

    // Look for range "between X and Y" or "X to Y" or "X - Y"
    const rangePatterns = [
      /between\s*(\d+(?:,\d{3})*)\s*(?:and|to|-)\s*(\d+(?:,\d{3})*)/gi,
      /(\d+(?:,\d{3})*)\s*(?:to|-)\s*(\d+(?:,\d{3})*)/gi,
    ];

    for (const pattern of rangePatterns) {
      const match = pattern.exec(query);
      if (match != null) {
        min = this.parseNumber(match[1]);
        max = this.parseNumber(match[2]);
        break;
      }
    }

    // If only one number mentioned with currency, assume it's max budget
    if (min == null && max == null && this.currencyPatterns.test(query)) {
      const numbers = Array.from(query.matchAll(this.numberPatterns));
      if (numbers.length === 1) {
        const num = this.parseNumber(numbers[0][1]);
        // If number is reasonable for rent/price (100-10000), use as max
        if (num >= 100 && num <= 10000) {
          max = num;
        }
      }
    }

    return { min, max };
  }

  /**
   * Extract room count
   */
  private extractRooms(query: string): { min?: number; max?: number } {
    let min: number | undefined;
    let max: number | undefined;

    // Match patterns like "2 bedroom", "3-room", "studio" (0 rooms)
    const matches = Array.from(query.matchAll(this.roomPatterns));

    if (matches.length > 0) {
      const roomCount = parseInt(matches[0][1], 10);
      min = roomCount;
      max = roomCount;
    }

    // Check for "studio" (typically 1 room or 0 bedrooms)
    if (query.includes('studio')) {
      min = 1;
      max = 1;
    }

    // Check for range "2-3 bedrooms"
    const rangeMatch = /(\d+)\s*-\s*(\d+)\s*(?:bedroom|room|zimmer)/i.exec(query);
    if (rangeMatch != null) {
      min = parseInt(rangeMatch[1], 10);
      max = parseInt(rangeMatch[2], 10);
    }

    return { min, max };
  }

  /**
   * Extract area in square meters
   */
  private extractArea(query: string): { min?: number; max?: number } {
    let min: number | undefined;
    let max: number | undefined;

    const matches = Array.from(query.matchAll(this.areaPatterns));

    if (matches.length > 0) {
      const area = parseInt(matches[0][1], 10);
      min = area * 0.9; // Allow 10% smaller
      max = area * 1.1; // Allow 10% larger
    }

    return { min, max };
  }

  /**
   * Extract property type
   */
  private extractPropertyType(query: string): string[] {
    const types: string[] = [];

    const propertyTypes = [
      { keywords: ['apartment', 'flat', 'wohnung', 'appartement'], type: 'apartment' },
      { keywords: ['house', 'home', 'haus', 'maison', 'casa'], type: 'house' },
      { keywords: ['studio'], type: 'studio' },
      { keywords: ['loft'], type: 'loft' },
      { keywords: ['penthouse'], type: 'penthouse' },
      { keywords: ['villa'], type: 'villa' },
      { keywords: ['townhouse'], type: 'townhouse' },
      { keywords: ['duplex'], type: 'duplex' },
    ];

    for (const { keywords, type } of propertyTypes) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          types.push(type);
          break;
        }
      }
    }

    return types;
  }

  /**
   * Extract features (must-have and nice-to-have)
   */
  private extractFeatures(query: string): {
    mustHave: string[];
    niceToHave: string[];
  } {
    const mustHave: string[] = [];
    const niceToHave: string[] = [];

    // Features with strong indicators (must-have)
    const mustHaveIndicators = ['with', 'must have', 'need', 'requires', 'include'];

    const features = {
      balcony: ['balcony', 'balkon', 'balcon', 'terraza'],
      terrace: ['terrace', 'terrasse', 'terraza'],
      garden: ['garden', 'garten', 'jardin'],
      parking: ['parking', 'garage', 'parkplatz'],
      elevator: ['elevator', 'lift', 'aufzug', 'ascenseur'],
      furnished: ['furnished', 'möbliert', 'meublé', 'amueblado'],
      pets: ['pets allowed', 'pet friendly', 'haustiere erlaubt', 'animaux acceptés'],
      basement: ['basement', 'cellar', 'keller', 'cave', 'sótano'],
      pool: ['pool', 'swimming pool', 'schwimmbad', 'piscine'],
      gym: ['gym', 'fitness', 'gimnasio'],
      dishwasher: ['dishwasher', 'geschirrspüler', 'lave-vaisselle'],
      'air conditioning': ['ac', 'air conditioning', 'klimaanlage', 'climatisation'],
    };

    for (const [feature, keywords] of Object.entries(features)) {
      for (const keyword of keywords) {
        if (!query.includes(keyword)) continue;

        // Check context to determine if must-have or nice-to-have
        let isMustHave = false;
        for (const indicator of mustHaveIndicators) {
          if (query.includes(`${indicator} ${keyword}`)) {
            isMustHave = true;
            break;
          }
        }

        if (isMustHave || query.includes('with ' + keyword)) {
          mustHave.push(feature);
        } else {
          niceToHave.push(feature);
        }
        break;
      }
    }

    return { mustHave, niceToHave };
  }

  /**
   * Extract keywords (terms that don't fit structured fields)
   */
  private extractKeywords(query: string): string[] {
    const keywords: string[] = [];

    // Quality/style indicators
    const qualityTerms = [
      'luxury',
      'premium',
      'modern',
      'renovated',
      'new',
      'contemporary',
      'traditional',
      'classic',
      'cozy',
      'spacious',
      'bright',
      'sunny',
      'quiet',
      'central',
      'downtown',
      'suburban',
    ];

    for (const term of qualityTerms) {
      if (query.includes(term)) {
        keywords.push(term);
      }
    }

    // Urgency indicators
    if (
      query.includes('urgent') ||
      query.includes('asap') ||
      query.includes('immediate')
    ) {
      keywords.push('urgent');
    }

    return keywords;
  }

  /**
   * Generate human-readable interpretation
   */
  private generateInterpretation(
    preferences: Partial<UserPreferences>,
    keywords: string[]
  ): string {
    const parts: string[] = [];

    // Property type
    if (preferences.propertyTypes != null && preferences.propertyTypes.length > 0) {
      parts.push(`Looking for ${preferences.propertyTypes.join(' or ')}`);
    } else {
      parts.push('Looking for property');
    }

    // Location
    if (preferences.preferredCities != null && preferences.preferredCities.length > 0) {
      parts.push(`in ${preferences.preferredCities.join(', ')}`);
    } else if (
      preferences.preferredCountries != null &&
      preferences.preferredCountries.length > 0
    ) {
      parts.push(`in ${preferences.preferredCountries.join(', ')}`);
    }

    // Budget
    if (preferences.budgetMin != null && preferences.budgetMax != null) {
      parts.push(`with budget €${preferences.budgetMin}-€${preferences.budgetMax}`);
    } else if (preferences.budgetMax != null) {
      parts.push(`under €${preferences.budgetMax}`);
    } else if (preferences.budgetMin != null) {
      parts.push(`above €${preferences.budgetMin}`);
    }

    // Rooms
    if (preferences.minRooms != null && preferences.maxRooms != null) {
      if (preferences.minRooms === preferences.maxRooms) {
        parts.push(`with ${preferences.minRooms} rooms`);
      } else {
        parts.push(`with ${preferences.minRooms}-${preferences.maxRooms} rooms`);
      }
    }

    // Features
    if (preferences.mustHaveFeatures != null && preferences.mustHaveFeatures.length > 0) {
      parts.push(`must have: ${preferences.mustHaveFeatures.join(', ')}`);
    }

    // Keywords
    if (keywords.length > 0) {
      parts.push(`(${keywords.join(', ')})`);
    }

    return parts.join(' ');
  }

  /**
   * Parse number from string (handles thousands separators)
   */
  private parseNumber(str: string): number {
    return parseInt(str.replace(/,/g, ''), 10);
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get search suggestions based on partial query
   */
  public getSuggestions(partialQuery: string): string[] {
    const suggestions: string[] = [];

    const templates = [
      '2 bedroom apartment in Berlin under 1500',
      'studio in Munich with parking',
      'house with garden in Hamburg',
      '3 room flat near city center, pets allowed',
      'luxury apartment with balcony and elevator',
      'modern apartment in Frankfurt, 1000-1500 euro',
      'family house with garage in Stuttgart',
      'cheap apartment for students near university',
    ];

    const normalized = partialQuery.toLowerCase();

    for (const template of templates) {
      if (template.toLowerCase().startsWith(normalized)) {
        suggestions.push(template);
      }
    }

    return suggestions.slice(0, 5);
  }
}
