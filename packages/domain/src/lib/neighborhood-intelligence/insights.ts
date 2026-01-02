/**
 * Neighborhood Intelligence
 * Forward-looking neighborhood analysis - where is this area heading?
 * Pain Point: Buyers only see current state, not future trajectory
 * Differentiator: Predictive neighborhood scoring based on leading indicators
 */

import { z } from 'zod';

// ============================================================================
// DEVELOPMENT PIPELINE TRACKING
// ============================================================================

/**
 * Track upcoming development projects that will impact neighborhood
 */
export const DevelopmentPipelineSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  address: z.string(), // Of neighborhood or center point

  // Active developments
  activeDevelopments: z.array(z.object({
    id: z.string(),
    projectName: z.string(),
    address: z.string(),
    distance: z.number(), // Miles from property

    // Project details
    type: z.enum([
      'residential_single_family',
      'residential_multi_family',
      'residential_mixed_use',
      'commercial_retail',
      'commercial_office',
      'commercial_mixed_use',
      'infrastructure',
      'public_amenity',
      'school',
      'hospital',
      'transit_station',
      'park',
    ]),

    // Scale
    units: z.number().optional(), // Number of residential units or sq ft for commercial
    scale: z.enum(['small', 'medium', 'large', 'massive']),

    // Status & timeline
    status: z.enum([
      'proposed',
      'planning_permission_pending',
      'approved',
      'under_construction',
      'nearing_completion',
      'completed',
      'on_hold',
      'cancelled',
    ]),

    proposedDate: z.date().optional(),
    approvalDate: z.date().optional(),
    constructionStartDate: z.date().optional(),
    estimatedCompletionDate: z.date().optional(),
    actualCompletionDate: z.date().optional(),

    // Impact assessment
    impact: z.object({
      expectedImpact: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
      impactOnPropertyValues: z.enum(['increase', 'neutral', 'decrease']),
      impactOnQualityOfLife: z.enum(['improve', 'neutral', 'worsen']),

      positives: z.array(z.string()).optional(), // "New retail options", "Jobs"
      negatives: z.array(z.string()).optional(), // "Construction noise", "Traffic"
    }),

    // Developer
    developer: z.string().optional(),
    estimatedInvestment: z.number().optional(),

    // Links
    newsArticles: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
      publishedDate: z.date(),
    })).optional(),
  })),

  // Zoning changes
  zoningChanges: z.array(z.object({
    id: z.string(),
    area: z.string(),
    currentZoning: z.string(),
    proposedZoning: z.string(),

    status: z.enum(['proposed', 'under_review', 'approved', 'rejected']),
    proposedDate: z.date().optional(),
    hearingDate: z.date().optional(),
    decisionDate: z.date().optional(),

    // Potential impact
    likelyDevelopment: z.array(z.string()).optional(), // "High-rise residential", "Retail"
    impact: z.enum(['positive', 'neutral', 'negative']),
    notes: z.string().optional(),
  })).optional(),

  // Infrastructure projects
  infrastructureProjects: z.array(z.object({
    projectName: z.string(),
    type: z.enum([
      'road_improvement',
      'highway_expansion',
      'public_transit',
      'bike_lanes',
      'park',
      'utility_upgrade',
      'flood_control',
    ]),

    status: z.enum(['planned', 'funded', 'under_construction', 'completed']),
    timeline: z.string().optional(),
    budget: z.number().optional(),

    impact: z.enum(['positive', 'neutral', 'negative']),
  })).optional(),

  // Summary
  summary: z.object({
    totalActiveProjects: z.number(),
    totalInvestmentValue: z.number().optional(),
    overallTrajectory: z.enum(['declining', 'stable', 'growing', 'booming']),
    developmentScore: z.number().min(0).max(100), // Higher = more positive development
  }),

  lastUpdated: z.date(),
});

export type DevelopmentPipeline = z.infer<typeof DevelopmentPipelineSchema>;

// ============================================================================
// LOCAL BUSINESS DYNAMICS
// ============================================================================

/**
 * Track business openings, closings, and commercial health
 */
export const BusinessDynamicsSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  address: z.string(),

  // Recent openings
  recentOpenings: z.array(z.object({
    businessName: z.string(),
    category: z.enum([
      'restaurant',
      'cafe',
      'bar',
      'grocery',
      'retail_clothing',
      'retail_other',
      'fitness',
      'healthcare',
      'professional_services',
      'entertainment',
      'other',
    ]),
    address: z.string(),
    openingDate: z.date(),
    distance: z.number(), // Miles

    // Significance
    significance: z.enum(['chain', 'local_business', 'notable_brand', 'first_in_neighborhood']),
    qualityIndicator: z.enum(['budget', 'mid_range', 'upscale', 'luxury']).optional(),

    notes: z.string().optional(),
  })),

  // Recent closings
  recentClosings: z.array(z.object({
    businessName: z.string(),
    category: z.string(),
    address: z.string(),
    closingDate: z.date(),
    yearsInBusiness: z.number().optional(),
    distance: z.number(),

    // Reason
    reason: z.enum(['lease_expired', 'poor_sales', 'corporate_closure', 'redevelopment', 'unknown']).optional(),
    replacement: z.string().optional(), // "New restaurant coming"
  })),

  // Vacancy trends
  commercialVacancy: z.object({
    currentVacancyRate: z.number(), // Percentage
    vacancyTrend: z.enum(['increasing', 'stable', 'decreasing']),
    vacancyVsCityAverage: z.number(), // Percentage points difference

    notableVacancies: z.array(z.object({
      address: z.string(),
      formerOccupant: z.string().optional(),
      monthsVacant: z.number(),
      sqft: z.number().optional(),
    })).optional(),
  }),

  // Business mix analysis
  businessMix: z.object({
    // Categories
    restaurants: z.number(),
    cafes: z.number(),
    bars: z.number(),
    groceryStores: z.number(),
    retailStores: z.number(),
    services: z.number(),
    entertainment: z.number(),

    // Diversity
    diversityScore: z.number().min(0).max(100), // Higher = better mix
    walkabilityImpact: z.enum(['poor', 'fair', 'good', 'excellent']),

    // Quality indicators
    nationalChains: z.number(),
    localBusinesses: z.number(),
    upscaleEstablishments: z.number(),
  }),

  // Notable attractions
  notableAttractions: z.array(z.object({
    name: z.string(),
    type: z.enum(['landmark', 'cultural', 'entertainment', 'dining', 'shopping']),
    address: z.string(),
    distance: z.number(),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  })).optional(),

  // Business health score
  commercialHealthScore: z.number().min(0).max(100), // Based on openings, closings, vacancy
  commercialTrend: z.enum(['declining', 'stable', 'improving', 'thriving']),

  // Time periods
  analysisTimeframe: z.object({
    openingsLast12Months: z.number(),
    closingsLast12Months: z.number(),
    netChange: z.number(), // Positive = more openings than closings
  }),

  lastUpdated: z.date(),
});

export type BusinessDynamics = z.infer<typeof BusinessDynamicsSchema>;

// ============================================================================
// NEIGHBORHOOD EVENTS & COMMUNITY
// ============================================================================

/**
 * Local events, community engagement, and social fabric
 */
export const NeighborhoodEventsSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),

  // Recurring events
  recurringEvents: z.array(z.object({
    eventName: z.string(),
    type: z.enum([
      'farmers_market',
      'street_fair',
      'festival',
      'concert_series',
      'community_meeting',
      'block_party',
      'sports_league',
      'cultural_celebration',
    ]),

    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'annual']),
    schedule: z.string().optional(), // "Every Saturday 9am-2pm"
    location: z.string(),

    attendance: z.enum(['small', 'medium', 'large', 'massive']).optional(),
    yearsRunning: z.number().optional(),

    description: z.string().optional(),
  })),

  // Upcoming events (next 90 days)
  upcomingEvents: z.array(z.object({
    eventName: z.string(),
    date: z.date(),
    type: z.string(),
    location: z.string(),
    description: z.string().optional(),
    website: z.string().url().optional(),
  })).optional(),

  // Community organizations
  communityOrganizations: z.array(z.object({
    name: z.string(),
    type: z.enum([
      'neighborhood_association',
      'business_improvement_district',
      'community_development',
      'cultural',
      'environmental',
      'safety',
      'youth_programs',
    ]),

    active: z.boolean(),
    membershipSize: z.enum(['small', 'medium', 'large']).optional(),
    meetingFrequency: z.string().optional(),
    website: z.string().url().optional(),
    contact: z.string().optional(),
  })).optional(),

  // Community engagement score
  engagementScore: z.number().min(0).max(100),
  engagementLevel: z.enum(['low', 'moderate', 'high', 'very_high']),

  // Social fabric indicators
  socialFabric: z.object({
    neighborhoodPride: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
    communityEvents: z.number(), // Per year
    volunteerRate: z.number().optional(), // Percentage
    voterTurnout: z.number().optional(), // Percentage

    // Indicators
    activeCommunityGroups: z.number(),
    socialMediaPresence: z.boolean(), // Neighborhood Facebook group, etc.
    blockClubs: z.number().optional(),
  }),

  lastUpdated: z.date(),
});

export type NeighborhoodEvents = z.infer<typeof NeighborhoodEventsSchema>;

// ============================================================================
// FUTURE GROWTH INDICATORS
// ============================================================================

/**
 * Leading indicators of neighborhood growth and change
 */
export const GrowthIndicatorsSchema = z.object({
  neighborhoodId: z.string(),
  address: z.string(),

  // Demographic trends
  demographicTrends: z.object({
    populationGrowth: z.object({
      last5Years: z.number(), // Percentage
      last10Years: z.number(),
      trend: z.enum(['declining', 'stable', 'growing', 'rapid_growth']),
      vsCity: z.number(), // Percentage points difference
    }),

    ageShift: z.object({
      medianAgeChange: z.number(), // Change over 5 years
      youngProfessionalInflux: z.boolean(), // Ages 25-40 increasing
      familyInflux: z.boolean(), // Children increasing
      retireesInflux: z.boolean(), // 65+ increasing
    }),

    incomeChange: z.object({
      medianIncomeGrowth: z.number(), // Percentage over 5 years
      trend: z.enum(['declining', 'stable', 'growing']),
      vsCity: z.number(), // Percentage points difference
    }),

    educationChange: z.object({
      collegeGradGrowth: z.number(), // Percentage point change
      trend: z.enum(['declining', 'stable', 'improving']),
    }),
  }),

  // Real estate indicators
  realEstateIndicators: z.object({
    priceAppreciation: z.object({
      last1Year: z.number(),
      last3Years: z.number(),
      last5Years: z.number(),
      vsCityAverage: z.number(), // Outperforming or underperforming
      trend: z.enum(['cooling', 'stable', 'accelerating']),
    }),

    salesVelocity: z.object({
      averageDaysOnMarket: z.number(),
      trend: z.enum(['slowing', 'stable', 'accelerating']),
      vsCity: z.number(), // Days difference
    }),

    renovationActivity: z.object({
      permitsIssued: z.number(), // Last 12 months
      permitValue: z.number(), // Total value
      trend: z.enum(['declining', 'stable', 'increasing']),
      majorRenovations: z.number(), // Permits > $50k
    }),

    newConstruction: z.object({
      unitsUnderConstruction: z.number(),
      unitsPipelined: z.number(), // Approved but not started
      absorption: z.enum(['slow', 'moderate', 'fast']), // How quickly selling
    }),
  }),

  // Amenity development
  amenityDevelopment: z.object({
    recentAmenities: z.array(z.object({
      amenity: z.string(),
      type: z.enum(['retail', 'dining', 'entertainment', 'fitness', 'cultural', 'park', 'transit']),
      opened: z.date(),
      significance: z.enum(['minor', 'moderate', 'major']),
    })),

    upcomingAmenities: z.array(z.object({
      amenity: z.string(),
      type: z.string(),
      expectedOpening: z.date().optional(),
      significance: z.enum(['minor', 'moderate', 'major']),
    })),

    amenityScore: z.number().min(0).max(100),
    amenityTrend: z.enum(['declining', 'stable', 'improving']),
  }),

  // Investment activity
  investmentActivity: z.object({
    // Investor purchases
    investorPurchaseRate: z.number(), // Percentage of sales
    trend: z.enum(['declining', 'stable', 'increasing']),

    // Institutional investment
    institutionalActivity: z.boolean(),
    notableInvestors: z.array(z.string()).optional(), // "BlackRock", etc.

    // Flipping activity
    flippingRate: z.number(), // Percentage
    flippingProfitability: z.enum(['low', 'moderate', 'high']).optional(),
  }),

  // Transit & mobility
  transitDevelopment: z.object({
    plannedTransit: z.array(z.object({
      project: z.string(),
      type: z.enum(['light_rail', 'subway', 'bus_rapid_transit', 'bike_infrastructure']),
      status: z.enum(['planned', 'funded', 'under_construction']),
      expectedCompletion: z.date().optional(),
      distance: z.number(), // Miles from property
    })).optional(),

    walkScoreTrend: z.enum(['declining', 'stable', 'improving']).optional(),
    transitScoreTrend: z.enum(['declining', 'stable', 'improving']).optional(),
  }),

  // School quality
  schoolTrends: z.object({
    performanceTrend: z.enum(['declining', 'stable', 'improving']),
    ratingChange: z.number().optional(), // Change in avg rating over 3 years
    newSchools: z.boolean(),
    schoolInvestment: z.number().optional(), // Recent capital improvements
  }).optional(),

  // Crime trends
  crimeTrends: z.object({
    overallTrend: z.enum(['increasing', 'stable', 'decreasing']),
    violentCrimeChange: z.number(), // Percentage change
    propertyCrimeChange: z.number(),
  }),

  // Overall growth score
  growthScore: z.number().min(0).max(100),
  growthTrajectory: z.enum(['declining', 'stable', 'emerging', 'hot', 'peaked']),

  // Gentrification analysis
  gentrificationIndicators: z.object({
    gentrificationStage: z.enum([
      'not_gentrifying',
      'early_stage',
      'active_gentrification',
      'advanced_gentrification',
      'post_gentrification',
    ]),

    indicators: z.array(z.enum([
      'rising_income',
      'rising_education',
      'young_professional_influx',
      'new_amenities',
      'rising_rents',
      'displacement_risk',
      'historic_preservation',
      'artist_community',
    ])).optional(),

    displacementRisk: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),

  lastUpdated: z.date(),
});

export type GrowthIndicators = z.infer<typeof GrowthIndicatorsSchema>;

// ============================================================================
// NEIGHBORHOOD FORECAST
// ============================================================================

/**
 * Predictive neighborhood analysis - where is this heading?
 */
export const NeighborhoodForecastSchema = z.object({
  neighborhoodId: z.string(),
  address: z.string(),

  // Overall assessment
  currentState: z.enum(['declining', 'stable', 'transitioning', 'growing', 'hot']),
  futureTrajectory: z.enum(['decline', 'stagnation', 'steady_growth', 'rapid_growth', 'transformation']),

  // 5-year forecast
  fiveYearForecast: z.object({
    // Property values
    expectedAppreciation: z.number(), // Percentage
    confidenceInterval: z.object({
      low: z.number(),
      high: z.number(),
    }),

    // Demographics
    expectedPopulationChange: z.number(), // Percentage
    expectedIncomeChange: z.number(), // Percentage

    // Amenities
    expectedAmenityImprovements: z.array(z.string()).optional(),
    expectedChallenges: z.array(z.string()).optional(),
  }),

  // Key drivers
  keyDrivers: z.array(z.object({
    driver: z.string(),
    impact: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']),
    confidence: z.enum(['low', 'medium', 'high']),
  })),

  // Scenarios
  scenarios: z.object({
    bullCase: z.object({
      scenario: z.string(),
      expectedAppreciation: z.number(),
      probability: z.number(), // 0-1
    }),

    baseCase: z.object({
      scenario: z.string(),
      expectedAppreciation: z.number(),
      probability: z.number(),
    }),

    bearCase: z.object({
      scenario: z.string(),
      expectedAppreciation: z.number(),
      probability: z.number(),
    }),
  }),

  // Investment timing
  timingRecommendation: z.object({
    recommendation: z.enum(['buy_now', 'good_time', 'wait_and_see', 'avoid']),
    reasoning: z.string(),
    optimalTiming: z.string().optional(), // "Next 6-12 months", "After X development completes"
  }),

  // Confidence
  forecastConfidence: z.enum(['low', 'medium', 'high']),
  lastDataUpdate: z.date(),

  generatedAt: z.date(),
});

export type NeighborhoodForecast = z.infer<typeof NeighborhoodForecastSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const NeighborhoodIntelligenceSchemas = {
  DevelopmentPipeline: DevelopmentPipelineSchema,
  BusinessDynamics: BusinessDynamicsSchema,
  NeighborhoodEvents: NeighborhoodEventsSchema,
  GrowthIndicators: GrowthIndicatorsSchema,
  NeighborhoodForecast: NeighborhoodForecastSchema,
};
