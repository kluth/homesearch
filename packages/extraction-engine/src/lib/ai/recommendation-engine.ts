/**
 * AI-Powered Property Recommendation Engine
 * Combines collaborative filtering, content-based filtering, and user behavior analysis
 */

import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * User preferences for property search
 */
export interface UserPreferences {
  userId: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredCities?: string[];
  preferredCountries?: string[];
  propertyTypes?: string[];
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
  mustHaveFeatures?: string[]; // balcony, parking, garden, etc.
  niceToHaveFeatures?: string[];
  excludeFeatures?: string[];
  pets?: boolean;
  furnished?: boolean;
  maxCommuteTo?: { location: string; minutes: number }[];
}

/**
 * User interaction with a property
 */
export interface PropertyInteraction {
  userId: string;
  propertyId: string;
  type: InteractionType;
  timestamp: Date;
  duration?: number; // seconds viewing property
  responseGenerated?: boolean;
  responseSent?: boolean;
}

export enum InteractionType {
  VIEW = 'view',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  GENERATE_RESPONSE = 'generate_response',
  SEND_RESPONSE = 'send_response',
  REJECT = 'reject',
  SHARE = 'share',
}

/**
 * Recommended property with score
 */
export interface RecommendedProperty {
  property: UnifiedHouseModel;
  score: number; // 0-100
  reasons: string[];
  matchBreakdown: {
    priceMatch: number;
    locationMatch: number;
    featuresMatch: number;
    similarityToLiked: number;
    popularityScore: number;
  };
  tags: string[];
}

/**
 * Property score components
 */
interface PropertyScore {
  total: number;
  price: number;
  location: number;
  features: number;
  similarity: number;
  popularity: number;
}

/**
 * Smart Property Recommendation Engine
 */
export class RecommendationEngine {
  private userInteractions: Map<string, PropertyInteraction[]> = new Map();
  private userProfiles: Map<string, UserPreferences> = new Map();

  /**
   * Add user interaction for learning
   */
  public addInteraction(interaction: PropertyInteraction): void {
    const userId = interaction.userId;
    const interactions = this.userInteractions.get(userId) ?? [];
    interactions.push(interaction);
    this.userInteractions.set(userId, interactions);

    // Update user profile based on interactions
    this.updateUserProfile(userId, interaction);
  }

  /**
   * Get personalized property recommendations
   */
  public getRecommendations(
    userId: string,
    availableProperties: UnifiedHouseModel[],
    limit = 20
  ): RecommendedProperty[] {
    const preferences = this.userProfiles.get(userId);
    const interactions = this.userInteractions.get(userId) ?? [];

    // Score all properties
    const scoredProperties = availableProperties.map((property) => {
      const score = this.scoreProperty(property, preferences, interactions);
      const reasons = this.generateReasons(property, preferences, score);
      const tags = this.generateTags(property, preferences);

      return {
        property,
        score: score.total,
        reasons,
        matchBreakdown: {
          priceMatch: score.price,
          locationMatch: score.location,
          featuresMatch: score.features,
          similarityToLiked: score.similarity,
          popularityScore: score.popularity,
        },
        tags,
      };
    });

    // Sort by score and apply diversity
    const sorted = scoredProperties.sort((a, b) => b.score - a.score);

    // Apply diversity - don't show too many similar properties
    const diverse = this.applyDiversity(sorted);

    return diverse.slice(0, limit);
  }

  /**
   * Score a property for a user
   */
  private scoreProperty(
    property: UnifiedHouseModel,
    preferences?: UserPreferences,
    interactions: PropertyInteraction[] = []
  ): PropertyScore {
    let priceScore = 0;
    let locationScore = 0;
    let featuresScore = 0;
    let similarityScore = 0;
    let popularityScore = 0;

    // 1. Price matching (30% weight)
    if (preferences?.budgetMin != null || preferences?.budgetMax != null) {
      priceScore = this.calculatePriceScore(property, preferences);
    } else {
      priceScore = 50; // neutral
    }

    // 2. Location matching (25% weight)
    locationScore = this.calculateLocationScore(property, preferences);

    // 3. Features matching (20% weight)
    featuresScore = this.calculateFeaturesScore(property, preferences);

    // 4. Similarity to liked properties (15% weight)
    similarityScore = this.calculateSimilarityScore(property, interactions);

    // 5. Overall popularity (10% weight)
    popularityScore = this.calculatePopularityScore(property);

    const total = Math.round(
      priceScore * 0.3 +
        locationScore * 0.25 +
        featuresScore * 0.2 +
        similarityScore * 0.15 +
        popularityScore * 0.1
    );

    return {
      total: Math.min(100, Math.max(0, total)),
      price: priceScore,
      location: locationScore,
      features: featuresScore,
      similarity: similarityScore,
      popularity: popularityScore,
    };
  }

  /**
   * Calculate price match score
   */
  private calculatePriceScore(
    property: UnifiedHouseModel,
    preferences?: UserPreferences
  ): number {
    const price = property.price;

    if (preferences?.budgetMax == null && preferences?.budgetMin == null) {
      return 50;
    }

    const min = preferences?.budgetMin ?? 0;
    const max = preferences?.budgetMax ?? Infinity;

    // Perfect match
    if (price >= min && price <= max) {
      // Give higher score to properties in the lower-middle range (best value)
      const range = max - min;
      const position = (price - min) / range;

      if (position < 0.4) return 100; // Lower price range = best value
      if (position < 0.7) return 95;
      return 85; // Upper range still good
    }

    // Slightly over budget
    if (price > max && price <= max * 1.1) {
      return 60; // Maybe worth stretching
    }

    // Way over budget
    if (price > max * 1.1) {
      return Math.max(0, 40 - ((price - max) / max) * 100);
    }

    // Under budget but maybe too cheap (red flag?)
    if (price < min) {
      const difference = min - price;
      const percentageBelow = (difference / min) * 100;

      if (percentageBelow < 20) return 70; // Slightly cheap = good deal
      return Math.max(0, 50 - percentageBelow); // Very cheap = suspicious
    }

    return 50;
  }

  /**
   * Calculate location match score
   */
  private calculateLocationScore(
    property: UnifiedHouseModel,
    preferences?: UserPreferences
  ): number {
    let score = 50; // neutral

    const city = property.location.city?.toLowerCase();
    const country = property.location.country?.toLowerCase();

    // Preferred cities (very strong match)
    if (preferences?.preferredCities != null && city != null) {
      const preferredCities = preferences.preferredCities.map((c) => c.toLowerCase());
      if (preferredCities.includes(city)) {
        score = 100;
      }
    }

    // Preferred countries (moderate match)
    if (preferences?.preferredCountries != null && country != null) {
      const preferredCountries = preferences.preferredCountries.map((c) => c.toLowerCase());
      if (preferredCountries.includes(country)) {
        score = Math.max(score, 75);
      }
    }

    return score;
  }

  /**
   * Calculate features match score
   */
  private calculateFeaturesScore(
    property: UnifiedHouseModel,
    preferences?: UserPreferences
  ): number {
    let score = 50;
    const features = this.extractFeatures(property);

    // Must-have features (deal breakers)
    if (preferences?.mustHaveFeatures != null && preferences.mustHaveFeatures.length > 0) {
      const mustHaveCount = preferences.mustHaveFeatures.filter((f) =>
        features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))
      ).length;

      const mustHaveRatio = mustHaveCount / preferences.mustHaveFeatures.length;

      if (mustHaveRatio === 1) {
        score = 100; // Has all must-haves
      } else if (mustHaveRatio >= 0.5) {
        score = 60 + mustHaveRatio * 40; // Has some must-haves
      } else {
        return 20; // Missing critical features
      }
    }

    // Nice-to-have features (bonus)
    if (preferences?.niceToHaveFeatures != null && preferences.niceToHaveFeatures.length > 0) {
      const niceToHaveCount = preferences.niceToHaveFeatures.filter((f) =>
        features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))
      ).length;

      const bonus = (niceToHaveCount / preferences.niceToHaveFeatures.length) * 20;
      score = Math.min(100, score + bonus);
    }

    // Exclude features (deal breakers)
    if (preferences?.excludeFeatures != null && preferences.excludeFeatures.length > 0) {
      const hasExcluded = preferences.excludeFeatures.some((f) =>
        features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))
      );

      if (hasExcluded) {
        return 10; // Has excluded features
      }
    }

    // Room count
    if (preferences?.minRooms != null || preferences?.maxRooms != null) {
      const rooms = property.rooms;
      if (rooms != null) {
        const min = preferences?.minRooms ?? 0;
        const max = preferences?.maxRooms ?? Infinity;

        if (rooms >= min && rooms <= max) {
          score = Math.min(100, score + 10);
        } else {
          score = Math.max(0, score - 20);
        }
      }
    }

    // Area
    if (preferences?.minArea != null || preferences?.maxArea != null) {
      const area = property.area;
      if (area != null) {
        const min = preferences?.minArea ?? 0;
        const max = preferences?.maxArea ?? Infinity;

        if (area >= min && area <= max) {
          score = Math.min(100, score + 10);
        } else {
          score = Math.max(0, score - 15);
        }
      }
    }

    return score;
  }

  /**
   * Calculate similarity to properties the user liked
   */
  private calculateSimilarityScore(
    property: UnifiedHouseModel,
    interactions: PropertyInteraction[]
  ): number {
    // Find properties user favorited or sent responses to
    const likedProperties = interactions.filter(
      (i) =>
        i.type === InteractionType.FAVORITE ||
        i.type === InteractionType.SEND_RESPONSE
    );

    if (likedProperties.length === 0) {
      return 50; // No data yet
    }

    // Simple similarity based on price range and location
    // In production, this would use vector embeddings
    const likedPrices = likedProperties
      .map((i) => this.getPropertyPrice(i.propertyId))
      .filter((p): p is number => p != null);

    if (likedPrices.length === 0) {
      return 50;
    }

    const avgLikedPrice = likedPrices.reduce((a, b) => a + b, 0) / likedPrices.length;
    const priceDifference = Math.abs(property.price - avgLikedPrice);
    const priceRatio = priceDifference / avgLikedPrice;

    if (priceRatio < 0.1) return 100; // Very similar price
    if (priceRatio < 0.2) return 85;
    if (priceRatio < 0.3) return 70;
    if (priceRatio < 0.5) return 55;
    return 40;
  }

  /**
   * Calculate popularity score based on all user interactions
   */
  private calculatePopularityScore(property: UnifiedHouseModel): number {
    // Count interactions for this property across all users
    let viewCount = 0;
    let favoriteCount = 0;
    let responseCount = 0;

    for (const interactions of this.userInteractions.values()) {
      for (const interaction of interactions) {
        if (interaction.propertyId === property.id) {
          if (interaction.type === InteractionType.VIEW) viewCount++;
          if (interaction.type === InteractionType.FAVORITE) favoriteCount++;
          if (interaction.type === InteractionType.SEND_RESPONSE) responseCount++;
        }
      }
    }

    // Weighted popularity score
    const popularityScore =
      viewCount * 1 + favoriteCount * 5 + responseCount * 10;

    // Normalize to 0-100 (assume max 100 views, 20 favorites, 10 responses)
    const maxScore = 100 * 1 + 20 * 5 + 10 * 10;
    return Math.min(100, (popularityScore / maxScore) * 100);
  }

  /**
   * Extract features from property
   */
  private extractFeatures(property: UnifiedHouseModel): string[] {
    const features: string[] = [];

    // From description
    const description = property.description?.toLowerCase() ?? '';

    // Common features
    const featureKeywords = [
      'balcony',
      'terrace',
      'garden',
      'parking',
      'garage',
      'elevator',
      'lift',
      'basement',
      'cellar',
      'furnished',
      'kitchen',
      'dishwasher',
      'washing machine',
      'dryer',
      'air conditioning',
      'heating',
      'fireplace',
      'pool',
      'gym',
      'storage',
      'pets allowed',
      'wheelchair accessible',
    ];

    for (const keyword of featureKeywords) {
      if (description.includes(keyword)) {
        features.push(keyword);
      }
    }

    // From explicit fields
    if (property.rooms != null) features.push(`${property.rooms} rooms`);
    if (property.area != null) features.push(`${property.area} sqm`);
    if (property.type != null) features.push(property.type);

    return features;
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private generateReasons(
    property: UnifiedHouseModel,
    preferences?: UserPreferences,
    score: PropertyScore
  ): string[] {
    const reasons: string[] = [];

    // Price reasons
    if (score.price >= 85) {
      if (preferences?.budgetMax != null && property.price < preferences.budgetMax * 0.8) {
        reasons.push('Great value - well within your budget');
      } else {
        reasons.push('Perfect price match');
      }
    }

    // Location reasons
    if (score.location >= 90) {
      reasons.push(`In your preferred location: ${property.location.city}`);
    }

    // Features reasons
    if (score.features >= 85) {
      reasons.push('Has all your must-have features');
    }

    // Similarity reasons
    if (score.similarity >= 80) {
      reasons.push('Similar to properties you liked');
    }

    // Popularity reasons
    if (score.popularity >= 70) {
      reasons.push('Popular property - high interest from other users');
    }

    // Quality score from extraction
    if (property.metadata.confidence != null && property.metadata.confidence >= 0.9) {
      reasons.push('High-quality verified listing');
    }

    // Recency
    const hoursSinceExtraction =
      (Date.now() - new Date(property.metadata.extractedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceExtraction < 24) {
      reasons.push('Recently listed');
    }

    // Default reason if no specific matches
    if (reasons.length === 0) {
      reasons.push('Matches your general criteria');
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  /**
   * Generate tags for property
   */
  private generateTags(
    property: UnifiedHouseModel,
    preferences?: UserPreferences
  ): string[] {
    const tags: string[] = [];

    // Value tag
    if (preferences?.budgetMax != null && property.price < preferences.budgetMax * 0.7) {
      tags.push('Great Value');
    }

    // New listing
    const hoursSinceExtraction =
      (Date.now() - new Date(property.metadata.extractedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceExtraction < 24) {
      tags.push('New');
    }

    // Popular
    const interactions = Array.from(this.userInteractions.values()).flat();
    const interactionCount = interactions.filter(
      (i) => i.propertyId === property.id
    ).length;
    if (interactionCount > 10) {
      tags.push('Popular');
    }

    // Premium
    if (property.price > 2000 && property.area != null && property.area > 100) {
      tags.push('Premium');
    }

    return tags;
  }

  /**
   * Apply diversity to recommendations
   */
  private applyDiversity(recommendations: RecommendedProperty[]): RecommendedProperty[] {
    const diverse: RecommendedProperty[] = [];
    const cities = new Set<string>();
    const priceRanges = new Set<string>();

    for (const rec of recommendations) {
      const city = rec.property.location.city ?? 'unknown';
      const priceRange = this.getPriceRange(rec.property.price);

      // Limit same city to 40% of results
      const cityCount = Array.from(diverse).filter(
        (d) => d.property.location.city === city
      ).length;

      if (cityCount < recommendations.length * 0.4) {
        diverse.push(rec);
        cities.add(city);
        priceRanges.add(priceRange);
      } else if (diverse.length < recommendations.length * 0.8) {
        // Still add if we have space
        diverse.push(rec);
      }
    }

    return diverse;
  }

  /**
   * Get price range bucket
   */
  private getPriceRange(price: number): string {
    if (price < 500) return 'budget';
    if (price < 1000) return 'affordable';
    if (price < 1500) return 'moderate';
    if (price < 2000) return 'high';
    return 'premium';
  }

  /**
   * Update user profile based on interactions
   */
  private updateUserProfile(userId: string, interaction: PropertyInteraction): void {
    // This is a simple implementation - in production, use ML
    const profile = this.userProfiles.get(userId) ?? { userId };

    // Learn from favorites and sent responses
    if (
      interaction.type === InteractionType.FAVORITE ||
      interaction.type === InteractionType.SEND_RESPONSE
    ) {
      const price = this.getPropertyPrice(interaction.propertyId);
      if (price != null) {
        // Update budget estimates
        if (profile.budgetMax == null || price > profile.budgetMax) {
          profile.budgetMax = Math.round(price * 1.1);
        }
        if (profile.budgetMin == null || price < profile.budgetMin) {
          profile.budgetMin = Math.round(price * 0.9);
        }
      }

      // Learn location preferences
      const city = this.getPropertyCity(interaction.propertyId);
      if (city != null) {
        profile.preferredCities = profile.preferredCities ?? [];
        if (!profile.preferredCities.includes(city)) {
          profile.preferredCities.push(city);
        }
      }
    }

    this.userProfiles.set(userId, profile);
  }

  /**
   * Get property price by ID (placeholder - in production, query from DB)
   */
  private getPropertyPrice(propertyId: string): number | null {
    // In production, this would query Firestore
    return null;
  }

  /**
   * Get property city by ID (placeholder - in production, query from DB)
   */
  private getPropertyCity(propertyId: string): string | null {
    // In production, this would query Firestore
    return null;
  }

  /**
   * Set user preferences explicitly
   */
  public setUserPreferences(preferences: UserPreferences): void {
    this.userProfiles.set(preferences.userId, preferences);
  }

  /**
   * Get user preferences
   */
  public getUserPreferences(userId: string): UserPreferences | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get user interaction history
   */
  public getUserInteractions(userId: string): PropertyInteraction[] {
    return this.userInteractions.get(userId) ?? [];
  }

  /**
   * Clear user data (GDPR compliance)
   */
  public clearUserData(userId: string): void {
    this.userInteractions.delete(userId);
    this.userProfiles.delete(userId);
  }
}
