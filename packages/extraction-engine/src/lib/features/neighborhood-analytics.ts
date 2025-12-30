/**
 * Neighborhood Analytics Engine
 *
 * Provides comprehensive insights into neighborhoods with data-driven scoring,
 * comparisons, and personalized recommendations.
 *
 * Features:
 * - Multi-dimensional neighborhood scoring
 * - School ratings and education quality
 * - Safety and crime statistics
 * - Amenities and points of interest
 * - Demographics and population trends
 * - Transportation and walkability scores
 * - Market trends and property value appreciation
 * - Environmental factors (noise, air quality, green spaces)
 *
 * @module NeighborhoodAnalytics
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const LocationCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const SchoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['elementary', 'middle', 'high', 'university', 'private', 'public']),
  rating: z.number().min(0).max(10),
  distanceKm: z.number().nonnegative(),
  studentCount: z.number().int().nonnegative().optional(),
  studentTeacherRatio: z.number().positive().optional(),
  graduationRate: z.number().min(0).max(100).optional(),
  reviews: z.array(z.object({
    rating: z.number().min(1).max(5),
    comment: z.string(),
    date: z.string().datetime(),
  })).default([]),
});

export const CrimeStatisticsSchema = z.object({
  neighborhood: z.string(),
  year: z.number().int(),
  totalIncidents: z.number().int().nonnegative(),
  crimeRate: z.number().nonnegative().describe('Incidents per 1000 residents'),
  breakdown: z.object({
    violent: z.number().int().nonnegative(),
    property: z.number().int().nonnegative(),
    theft: z.number().int().nonnegative(),
    vandalism: z.number().int().nonnegative(),
    other: z.number().int().nonnegative(),
  }),
  trend: z.enum(['decreasing', 'stable', 'increasing']),
  trendPercentage: z.number().describe('Year-over-year change percentage'),
  safetyScore: z.number().min(0).max(100),
});

export const AmenitySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'grocery',
    'restaurant',
    'cafe',
    'park',
    'gym',
    'hospital',
    'pharmacy',
    'school',
    'shopping',
    'entertainment',
    'transport',
    'other',
  ]),
  location: LocationCoordinatesSchema,
  distanceKm: z.number().nonnegative(),
  walkingMinutes: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().default(0),
  isOpen24Hours: z.boolean().default(false),
});

export const DemographicsSchema = z.object({
  neighborhood: z.string(),
  totalPopulation: z.number().int().nonnegative(),
  populationDensity: z.number().nonnegative().describe('Per square km'),
  medianAge: z.number().nonnegative(),
  ageDistribution: z.object({
    under18: z.number().min(0).max(100),
    age18to34: z.number().min(0).max(100),
    age35to54: z.number().min(0).max(100),
    age55to64: z.number().min(0).max(100),
    age65plus: z.number().min(0).max(100),
  }),
  householdIncome: z.object({
    median: z.number().nonnegative(),
    average: z.number().nonnegative(),
    distribution: z.object({
      under30k: z.number().min(0).max(100),
      from30to60k: z.number().min(0).max(100),
      from60to100k: z.number().min(0).max(100),
      from100to150k: z.number().min(0).max(100),
      over150k: z.number().min(0).max(100),
    }),
  }),
  employmentRate: z.number().min(0).max(100),
  educationLevel: z.object({
    highSchool: z.number().min(0).max(100),
    bachelors: z.number().min(0).max(100),
    graduate: z.number().min(0).max(100),
  }),
  familyComposition: z.object({
    singlePerson: z.number().min(0).max(100),
    couples: z.number().min(0).max(100),
    familiesWithChildren: z.number().min(0).max(100),
    other: z.number().min(0).max(100),
  }),
});

export const TransportationScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  walkScore: z.number().min(0).max(100).describe('Walkability to amenities'),
  transitScore: z.number().min(0).max(100).describe('Public transit access'),
  bikeScore: z.number().min(0).max(100).describe('Bike-friendliness'),
  parkingAvailability: z.enum(['excellent', 'good', 'fair', 'poor']),
  nearestMetroStation: z.object({
    name: z.string(),
    distanceKm: z.number().nonnegative(),
    walkingMinutes: z.number().int().nonnegative(),
  }).optional(),
  busStops: z.number().int().nonnegative().describe('Within 500m'),
  averageCommuteMins: z.number().int().nonnegative(),
});

export const MarketTrendsSchema = z.object({
  neighborhood: z.string(),
  averagePriceSqm: z.number().nonnegative(),
  medianPropertyPrice: z.number().nonnegative(),
  priceChange: z.object({
    oneYear: z.number().describe('Percentage change'),
    threeYears: z.number(),
    fiveYears: z.number(),
  }),
  appreciationRate: z.number().describe('Annual appreciation rate'),
  inventory: z.object({
    totalListings: z.number().int().nonnegative(),
    averageDaysOnMarket: z.number().int().nonnegative(),
    monthsOfSupply: z.number().nonnegative(),
  }),
  demandScore: z.number().min(0).max(100),
  investmentPotential: z.enum(['excellent', 'good', 'fair', 'poor']),
});

export const EnvironmentalFactorsSchema = z.object({
  neighborhood: z.string(),
  airQualityIndex: z.number().min(0).max(500).describe('0-50 good, 51-100 moderate, 101+ unhealthy'),
  airQualityRating: z.enum(['excellent', 'good', 'moderate', 'unhealthy', 'very_unhealthy']),
  noiseLevel: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
  greenSpacePercentage: z.number().min(0).max(100).describe('Percentage of green/park areas'),
  nearestPark: z.object({
    name: z.string(),
    distanceKm: z.number().nonnegative(),
    sizeHectares: z.number().nonnegative(),
  }).optional(),
  floodRisk: z.enum(['none', 'low', 'moderate', 'high']),
  earthquakeRisk: z.enum(['none', 'low', 'moderate', 'high']).optional(),
  sunlightHoursAvg: z.number().nonnegative().describe('Average daily sunlight hours'),
});

export const NeighborhoodScoreSchema = z.object({
  neighborhood: z.string(),
  overall: z.number().min(0).max(100),
  breakdown: z.object({
    safety: z.number().min(0).max(100),
    schools: z.number().min(0).max(100),
    amenities: z.number().min(0).max(100),
    transportation: z.number().min(0).max(100),
    environment: z.number().min(0).max(100),
    marketValue: z.number().min(0).max(100),
    community: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bestFor: z.array(z.enum(['families', 'professionals', 'students', 'retirees', 'investors'])),
});

export const NeighborhoodProfileSchema = z.object({
  name: z.string(),
  city: z.string(),
  country: z.string(),
  center: LocationCoordinatesSchema,
  boundaryPolygon: z.array(LocationCoordinatesSchema).optional(),
  areaKm2: z.number().positive().optional(),
  score: NeighborhoodScoreSchema,
  demographics: DemographicsSchema,
  crime: CrimeStatisticsSchema,
  schools: z.array(SchoolSchema),
  amenities: z.array(AmenitySchema),
  transportation: TransportationScoreSchema,
  marketTrends: MarketTrendsSchema,
  environment: EnvironmentalFactorsSchema,
  description: z.string().optional(),
  lastUpdated: z.string().datetime(),
});

export const NeighborhoodComparisonSchema = z.object({
  neighborhoods: z.array(z.string()).min(2).max(5),
  criteria: z.array(z.enum([
    'overall',
    'safety',
    'schools',
    'amenities',
    'transportation',
    'environment',
    'marketValue',
    'affordability',
  ])),
  results: z.array(z.object({
    neighborhood: z.string(),
    scores: z.record(z.number()),
    rank: z.number().int().positive(),
    winner: z.boolean(),
  })),
  insights: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type LocationCoordinates = z.infer<typeof LocationCoordinatesSchema>;
export type School = z.infer<typeof SchoolSchema>;
export type CrimeStatistics = z.infer<typeof CrimeStatisticsSchema>;
export type Amenity = z.infer<typeof AmenitySchema>;
export type Demographics = z.infer<typeof DemographicsSchema>;
export type TransportationScore = z.infer<typeof TransportationScoreSchema>;
export type MarketTrends = z.infer<typeof MarketTrendsSchema>;
export type EnvironmentalFactors = z.infer<typeof EnvironmentalFactorsSchema>;
export type NeighborhoodScore = z.infer<typeof NeighborhoodScoreSchema>;
export type NeighborhoodProfile = z.infer<typeof NeighborhoodProfileSchema>;
export type NeighborhoodComparison = z.infer<typeof NeighborhoodComparisonSchema>;

// ============================================================================
// Interfaces
// ============================================================================

export interface NeighborhoodSearchCriteria {
  city?: string;
  country?: string;
  minOverallScore?: number;
  maxPriceSqm?: number;
  minSafetyScore?: number;
  minSchoolRating?: number;
  minWalkScore?: number;
  requiredAmenities?: Amenity['category'][];
  maxCommuteMins?: number;
  preferredFor?: NeighborhoodScore['bestFor'][number][];
}

export interface PersonalizedRecommendation {
  neighborhood: string;
  matchScore: number;
  reasons: string[];
  pros: string[];
  cons: string[];
  estimatedMonthlyLiving: number;
  recommendedFor: string[];
}

// ============================================================================
// Neighborhood Analytics Engine
// ============================================================================

export class NeighborhoodAnalytics {
  /**
   * Calculates a comprehensive score for a neighborhood
   */
  public calculateNeighborhoodScore(profile: Omit<NeighborhoodProfile, 'score'>): NeighborhoodScore {
    // Safety Score (0-100)
    const safetyScore = profile.crime.safetyScore;

    // Schools Score (0-100)
    const schoolsScore = this.calculateSchoolsScore(profile.schools);

    // Amenities Score (0-100)
    const amenitiesScore = this.calculateAmenitiesScore(profile.amenities);

    // Transportation Score (already 0-100)
    const transportationScore = profile.transportation.overall;

    // Environment Score (0-100)
    const environmentScore = this.calculateEnvironmentScore(profile.environment);

    // Market Value Score (0-100) - based on appreciation and demand
    const marketValueScore = profile.marketTrends.demandScore;

    // Community Score (0-100) - based on demographics and diversity
    const communityScore = this.calculateCommunityScore(profile.demographics);

    // Overall Score: Weighted average
    const weights = {
      safety: 0.20,
      schools: 0.15,
      amenities: 0.15,
      transportation: 0.15,
      environment: 0.10,
      marketValue: 0.15,
      community: 0.10,
    };

    const overall = Math.round(
      safetyScore * weights.safety +
      schoolsScore * weights.schools +
      amenitiesScore * weights.amenities +
      transportationScore * weights.transportation +
      environmentScore * weights.environment +
      marketValueScore * weights.marketValue +
      communityScore * weights.community
    );

    // Identify strengths (score >= 75)
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const scoreMap = {
      safety: safetyScore,
      schools: schoolsScore,
      amenities: amenitiesScore,
      transportation: transportationScore,
      environment: environmentScore,
      marketValue: marketValueScore,
      community: communityScore,
    };

    for (const [category, score] of Object.entries(scoreMap)) {
      if (score >= 75) {
        strengths.push(this.getCategoryDescription(category, 'strength'));
      } else if (score < 50) {
        weaknesses.push(this.getCategoryDescription(category, 'weakness'));
      }
    }

    // Determine best audience
    const bestFor: NeighborhoodScore['bestFor'] = [];
    if (schoolsScore >= 70 && safetyScore >= 70) {
      bestFor.push('families');
    }
    if (transportationScore >= 75 && amenitiesScore >= 70) {
      bestFor.push('professionals');
    }
    if (amenitiesScore >= 75 && profile.demographics.medianAge < 35) {
      bestFor.push('students');
    }
    if (safetyScore >= 80 && environmentScore >= 70) {
      bestFor.push('retirees');
    }
    if (marketValueScore >= 70 && profile.marketTrends.appreciationRate > 3) {
      bestFor.push('investors');
    }

    return {
      neighborhood: profile.name,
      overall,
      breakdown: {
        safety: safetyScore,
        schools: schoolsScore,
        amenities: amenitiesScore,
        transportation: transportationScore,
        environment: environmentScore,
        marketValue: marketValueScore,
        community: communityScore,
      },
      strengths,
      weaknesses,
      bestFor,
    };
  }

  /**
   * Calculates schools score based on ratings and proximity
   */
  private calculateSchoolsScore(schools: School[]): number {
    if (schools.length === 0) {
      return 50; // Neutral score if no data
    }

    // Prioritize nearby schools
    const nearbySchools = schools.filter(s => s.distanceKm <= 2);

    if (nearbySchools.length === 0) {
      return 40; // Lower score if no nearby schools
    }

    // Calculate average rating of nearby schools (scale to 0-100)
    const avgRating = nearbySchools.reduce((sum, s) => sum + s.rating, 0) / nearbySchools.length;
    const baseScore = (avgRating / 10) * 100;

    // Bonus for having all school types nearby
    const hasElementary = nearbySchools.some(s => s.type === 'elementary');
    const hasMiddle = nearbySchools.some(s => s.type === 'middle');
    const hasHigh = nearbySchools.some(s => s.type === 'high');

    let bonus = 0;
    if (hasElementary) bonus += 5;
    if (hasMiddle) bonus += 5;
    if (hasHigh) bonus += 5;

    return Math.min(100, Math.round(baseScore + bonus));
  }

  /**
   * Calculates amenities score based on variety and proximity
   */
  private calculateAmenitiesScore(amenities: Amenity[]): number {
    if (amenities.length === 0) {
      return 30;
    }

    // Count amenities within walking distance (1 km)
    const walkable = amenities.filter(a => a.distanceKm <= 1);

    // Calculate category diversity
    const categories = new Set(amenities.map(a => a.category));
    const diversityScore = (categories.size / 12) * 100; // 12 total categories

    // Calculate proximity score (more walkable amenities = better)
    const proximityScore = Math.min(100, (walkable.length / 20) * 100);

    // Calculate quality score (average ratings)
    const ratedAmenities = amenities.filter(a => a.rating !== undefined);
    const qualityScore = ratedAmenities.length > 0
      ? (ratedAmenities.reduce((sum, a) => sum + (a.rating ?? 0), 0) / ratedAmenities.length / 5) * 100
      : 70; // Default to 70 if no ratings

    // Weighted average
    return Math.round(
      diversityScore * 0.3 +
      proximityScore * 0.4 +
      qualityScore * 0.3
    );
  }

  /**
   * Calculates environment score
   */
  private calculateEnvironmentScore(env: EnvironmentalFactors): number {
    let score = 0;

    // Air quality (0-50 AQI = 100 points, linearly decrease to 0 at 500 AQI)
    const airScore = Math.max(0, 100 - (env.airQualityIndex / 5));
    score += airScore * 0.3;

    // Noise level
    const noiseScores = {
      very_quiet: 100,
      quiet: 80,
      moderate: 60,
      noisy: 40,
      very_noisy: 20,
    };
    score += noiseScores[env.noiseLevel] * 0.2;

    // Green space
    score += env.greenSpacePercentage * 0.25;

    // Flood risk
    const floodScores = {
      none: 100,
      low: 80,
      moderate: 50,
      high: 20,
    };
    score += floodScores[env.floodRisk] * 0.15;

    // Sunlight
    const sunlightScore = Math.min(100, (env.sunlightHoursAvg / 8) * 100);
    score += sunlightScore * 0.1;

    return Math.round(score);
  }

  /**
   * Calculates community score
   */
  private calculateCommunityScore(demographics: Demographics): number {
    let score = 60; // Base score

    // Diversity bonus (more balanced age distribution = better)
    const ageValues = Object.values(demographics.ageDistribution);
    const ageVariance = this.calculateVariance(ageValues);
    const diversityBonus = Math.max(0, 20 - ageVariance / 2);
    score += diversityBonus;

    // Employment rate bonus
    if (demographics.employmentRate >= 95) {
      score += 10;
    } else if (demographics.employmentRate >= 90) {
      score += 5;
    }

    // Education level bonus
    if (demographics.educationLevel.bachelors >= 40) {
      score += 10;
    } else if (demographics.educationLevel.bachelors >= 30) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Compares multiple neighborhoods
   */
  public compareNeighborhoods(
    profiles: NeighborhoodProfile[],
    criteria: NeighborhoodComparison['criteria']
  ): NeighborhoodComparison {
    const results: NeighborhoodComparison['results'] = [];

    for (const profile of profiles) {
      const scores: Record<string, number> = {};

      for (const criterion of criteria) {
        if (criterion === 'overall') {
          scores[criterion] = profile.score.overall;
        } else if (criterion === 'affordability') {
          // Lower price = higher affordability score
          const avgPrice = profile.marketTrends.averagePriceSqm;
          const maxPrice = Math.max(...profiles.map(p => p.marketTrends.averagePriceSqm));
          scores[criterion] = Math.round(((maxPrice - avgPrice) / maxPrice) * 100);
        } else {
          scores[criterion] = profile.score.breakdown[criterion as keyof typeof profile.score.breakdown];
        }
      }

      results.push({
        neighborhood: profile.name,
        scores,
        rank: 0, // Will be calculated below
        winner: false,
      });
    }

    // Calculate ranks for each criterion
    for (const criterion of criteria) {
      const sorted = [...results].sort((a, b) => b.scores[criterion] - a.scores[criterion]);
      sorted.forEach((result, index) => {
        const original = results.find(r => r.neighborhood === result.neighborhood);
        if (original) {
          original.rank += index + 1;
        }
      });
    }

    // Final ranking (lower rank number = better)
    results.sort((a, b) => a.rank - b.rank);
    results[0].winner = true;

    // Generate insights
    const insights: string[] = [];
    const winner = results[0];

    insights.push(`${winner.neighborhood} is the overall winner with the best combined score.`);

    // Find standout categories
    for (const criterion of criteria) {
      const best = results.reduce((prev, curr) =>
        curr.scores[criterion] > prev.scores[criterion] ? curr : prev
      );

      if (best.scores[criterion] >= 80) {
        insights.push(
          `${best.neighborhood} excels in ${criterion} with a score of ${Math.round(best.scores[criterion])}/100.`
        );
      }
    }

    // Find best value
    if (criteria.includes('affordability') && criteria.includes('overall')) {
      const valueScores = results.map(r => ({
        neighborhood: r.neighborhood,
        value: (r.scores.affordability + r.scores.overall) / 2,
      }));

      const bestValue = valueScores.reduce((prev, curr) => curr.value > prev.value ? curr : prev);

      insights.push(
        `${bestValue.neighborhood} offers the best value combining quality and affordability.`
      );
    }

    return {
      neighborhoods: profiles.map(p => p.name),
      criteria,
      results,
      insights,
    };
  }

  /**
   * Finds neighborhoods matching specific criteria
   */
  public searchNeighborhoods(
    allProfiles: NeighborhoodProfile[],
    criteria: NeighborhoodSearchCriteria
  ): NeighborhoodProfile[] {
    return allProfiles.filter(profile => {
      // City filter
      if (criteria.city && profile.city.toLowerCase() !== criteria.city.toLowerCase()) {
        return false;
      }

      // Country filter
      if (criteria.country && profile.country.toLowerCase() !== criteria.country.toLowerCase()) {
        return false;
      }

      // Overall score filter
      if (criteria.minOverallScore && profile.score.overall < criteria.minOverallScore) {
        return false;
      }

      // Price filter
      if (criteria.maxPriceSqm && profile.marketTrends.averagePriceSqm > criteria.maxPriceSqm) {
        return false;
      }

      // Safety filter
      if (criteria.minSafetyScore && profile.score.breakdown.safety < criteria.minSafetyScore) {
        return false;
      }

      // School rating filter
      if (criteria.minSchoolRating) {
        const maxSchoolRating = Math.max(...profile.schools.map(s => s.rating));
        if (maxSchoolRating < criteria.minSchoolRating) {
          return false;
        }
      }

      // Walk score filter
      if (criteria.minWalkScore && profile.transportation.walkScore < criteria.minWalkScore) {
        return false;
      }

      // Required amenities filter
      if (criteria.requiredAmenities && criteria.requiredAmenities.length > 0) {
        const availableCategories = new Set(profile.amenities.map(a => a.category));
        const hasAllRequired = criteria.requiredAmenities.every(req => availableCategories.has(req));
        if (!hasAllRequired) {
          return false;
        }
      }

      // Commute time filter
      if (criteria.maxCommuteMins && profile.transportation.averageCommuteMins > criteria.maxCommuteMins) {
        return false;
      }

      // Preferred audience filter
      if (criteria.preferredFor && criteria.preferredFor.length > 0) {
        const hasMatch = criteria.preferredFor.some(pref => profile.score.bestFor.includes(pref));
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generates personalized neighborhood recommendations
   */
  public getPersonalizedRecommendations(
    allProfiles: NeighborhoodProfile[],
    userProfile: {
      budget: number;
      householdSize: number;
      hasChildren: boolean;
      workLocation?: LocationCoordinates;
      maxCommuteMins?: number;
      priorities: Array<keyof NeighborhoodScore['breakdown']>;
    }
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];

    for (const profile of allProfiles) {
      // Calculate match score (0-100)
      let matchScore = 0;
      const reasons: string[] = [];
      const pros: string[] = [];
      const cons: string[] = [];

      // Budget match (30%)
      const avgPrice = profile.marketTrends.medianPropertyPrice;
      if (avgPrice <= userProfile.budget) {
        const budgetFit = ((userProfile.budget - avgPrice) / userProfile.budget) * 100;
        matchScore += Math.min(30, budgetFit * 0.3);
        reasons.push('Fits within your budget');
        pros.push(`Median property price: €${Math.round(avgPrice).toLocaleString()}`);
      } else {
        cons.push(`Above budget by €${Math.round(avgPrice - userProfile.budget).toLocaleString()}`);
      }

      // Priority match (40%)
      for (const priority of userProfile.priorities) {
        const score = profile.score.breakdown[priority];
        matchScore += (score / 100) * (40 / userProfile.priorities.length);

        if (score >= 75) {
          pros.push(`Excellent ${priority} (${score}/100)`);
          reasons.push(`High ${priority} score matches your priorities`);
        } else if (score < 50) {
          cons.push(`Below average ${priority} (${score}/100)`);
        }
      }

      // Family suitability (20% if has children)
      if (userProfile.hasChildren) {
        const schoolScore = profile.score.breakdown.schools;
        const safetyScore = profile.score.breakdown.safety;
        const familyScore = (schoolScore + safetyScore) / 2;

        matchScore += (familyScore / 100) * 20;

        if (familyScore >= 75) {
          reasons.push('Great for families with children');
          pros.push('Excellent schools and safe environment');
        }
      } else {
        matchScore += 20; // No penalty for non-families
      }

      // Commute consideration (10% if work location provided)
      if (userProfile.workLocation && userProfile.maxCommuteMins) {
        if (profile.transportation.averageCommuteMins <= userProfile.maxCommuteMins) {
          matchScore += 10;
          reasons.push('Convenient commute to work');
          pros.push(`Average commute: ${profile.transportation.averageCommuteMins} minutes`);
        } else {
          cons.push(`Commute exceeds preference (${profile.transportation.averageCommuteMins} min)`);
        }
      } else {
        matchScore += 10;
      }

      // Estimate monthly living costs
      const estimatedMonthlyLiving = this.estimateMonthlyLivingCosts(profile);

      // Determine recommended for
      const recommendedFor: string[] = [];
      if (matchScore >= 80) {
        recommendedFor.push('Highly recommended');
      }
      if (userProfile.hasChildren && profile.score.breakdown.schools >= 75) {
        recommendedFor.push('Perfect for families');
      }
      if (profile.marketTrends.appreciationRate > 5) {
        recommendedFor.push('Great investment opportunity');
      }

      recommendations.push({
        neighborhood: profile.name,
        matchScore: Math.round(matchScore),
        reasons,
        pros,
        cons,
        estimatedMonthlyLiving,
        recommendedFor,
      });
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations.slice(0, 10); // Return top 10
  }

  /**
   * Estimates monthly living costs for a neighborhood
   */
  private estimateMonthlyLivingCosts(profile: NeighborhoodProfile): number {
    // Base estimate on median household income and typical cost of living percentages
    const medianIncome = profile.demographics.householdIncome.median;

    // Typical monthly expenses as percentage of annual income:
    // - Housing: 28-30%
    // - Groceries: 10-15%
    // - Transportation: 15-20%
    // - Utilities: 5-10%
    // - Healthcare: 8-12%
    // - Entertainment: 5-10%

    const monthlyIncome = medianIncome / 12;
    const estimatedLiving = monthlyIncome * 0.75; // ~75% of income for living expenses

    return Math.round(estimatedLiving);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getCategoryDescription(category: string, type: 'strength' | 'weakness'): string {
    const descriptions: Record<string, { strength: string; weakness: string }> = {
      safety: {
        strength: 'Very safe with low crime rates',
        weakness: 'Higher than average crime rates',
      },
      schools: {
        strength: 'Excellent schools with high ratings',
        weakness: 'Limited quality education options',
      },
      amenities: {
        strength: 'Wide variety of nearby amenities',
        weakness: 'Limited amenities and services',
      },
      transportation: {
        strength: 'Excellent public transit and walkability',
        weakness: 'Limited transportation options',
      },
      environment: {
        strength: 'Clean air and abundant green spaces',
        weakness: 'Environmental concerns',
      },
      marketValue: {
        strength: 'Strong market with good appreciation',
        weakness: 'Declining or stagnant market',
      },
      community: {
        strength: 'Vibrant and diverse community',
        weakness: 'Limited community engagement',
      },
    };

    return descriptions[category]?.[type] ?? category;
  }
}
