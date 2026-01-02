/**
 * Crime & Safety Analytics
 * Comprehensive crime data, safety scores, and neighborhood security
 * Top 3 concern for 93% of homebuyers (NAR data)
 * Legally required disclosures in many states
 */

import { z } from 'zod';

// ============================================================================
// CRIME STATISTICS
// ============================================================================

/**
 * Crime types classification
 */
export enum CrimeType {
  // Violent crimes
  HOMICIDE = 'homicide',
  ASSAULT = 'assault',
  ROBBERY = 'robbery',
  SEXUAL_ASSAULT = 'sexual_assault',
  KIDNAPPING = 'kidnapping',

  // Property crimes
  BURGLARY = 'burglary',
  THEFT = 'theft',
  AUTO_THEFT = 'auto_theft',
  ARSON = 'arson',
  VANDALISM = 'vandalism',

  // Other
  DRUG_RELATED = 'drug_related',
  DUI = 'dui',
  DOMESTIC_VIOLENCE = 'domestic_violence',
  FRAUD = 'fraud',
  CYBERCRIME = 'cybercrime',
}

/**
 * Neighborhood crime statistics
 */
export const NeighborhoodCrimeStatsSchema = z.object({
  neighborhoodId: z.string(),
  neighborhoodName: z.string(),

  // Time period
  period: z.object({
    start: z.date(),
    end: z.date(),
    description: z.string(), // "Last 12 months", "2024", etc.
  }),

  // Overall crime rate
  overallCrimeRate: z.number(), // Crimes per 1,000 residents
  crimeIndex: z.number().min(0).max(100), // 0 = safest, 100 = most dangerous

  // Crime breakdown by type
  crimesByType: z.array(z.object({
    type: z.nativeEnum(CrimeType),
    count: z.number(),
    ratePerThousand: z.number(),
    percentOfTotal: z.number(),
  })),

  // Violent vs property crime ratio
  violentCrimes: z.object({
    total: z.number(),
    rate: z.number(),
    percentageOfTotal: z.number(),
  }),

  propertyViolentCrimes: z.object({
    total: z.number(),
    rate: z.number(),
    percentageOfTotal: z.number(),
  }),

  // Trend analysis
  trends: z.object({
    overallTrend: z.enum(['improving', 'stable', 'declining']),
    yearOverYearChange: z.number(), // Percentage change

    byType: z.array(z.object({
      type: z.nativeEnum(CrimeType),
      trend: z.enum(['improving', 'stable', 'declining']),
      change: z.number(),
    })),
  }),

  // Comparison data
  comparisons: z.object({
    vsCity: z.object({
      cityName: z.string(),
      neighborhoodRate: z.number(),
      cityRate: z.number(),
      percentDifference: z.number(), // Negative = safer than city
      comparison: z.enum(['much_safer', 'safer', 'similar', 'less_safe', 'much_less_safe']),
    }),

    vsState: z.object({
      stateRate: z.number(),
      percentDifference: z.number(),
    }).optional(),

    vsNational: z.object({
      nationalRate: z.number(),
      percentDifference: z.number(),
    }).optional(),

    vsNearbyNeighborhoods: z.array(z.object({
      neighborhoodName: z.string(),
      rate: z.number(),
      comparison: z.enum(['safer', 'similar', 'less_safe']),
    })).optional(),
  }),

  // Crime density by time
  timePatterns: z.object({
    byTimeOfDay: z.object({
      morning: z.number(), // 6am-12pm
      afternoon: z.number(), // 12pm-6pm
      evening: z.number(), // 6pm-12am
      night: z.number(), // 12am-6am
      peakHours: z.array(z.number()), // Hours with most crime (0-23)
    }),

    byDayOfWeek: z.record(z.number()), // day name -> count
    byMonth: z.record(z.number()), // month name -> count
  }).optional(),

  // Population context
  population: z.number(),
  populationDensity: z.number(), // Per square mile

  // Data quality
  dataQuality: z.object({
    source: z.enum(['fbi_ucr', 'local_police', 'crimemapping', 'spotcrime', 'aggregated']),
    lastUpdated: z.date(),
    completeness: z.enum(['complete', 'partial', 'limited']),
    notes: z.string().optional(),
  }),

  lastUpdated: z.date(),
});

export type NeighborhoodCrimeStats = z.infer<typeof NeighborhoodCrimeStatsSchema>;

// ============================================================================
// PROPERTY-LEVEL CRIME ANALYSIS
// ============================================================================

/**
 * Crime analysis specific to a property location
 */
export const PropertyCrimeAnalysisSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Immediate area crime (within 0.5 mile radius)
  immediateArea: z.object({
    radius: z.number().default(0.5), // Miles
    recentIncidents: z.number(), // Last 30 days
    crimeRate: z.number(),

    nearestIncidents: z.array(z.object({
      id: z.string(),
      type: z.nativeEnum(CrimeType),
      date: z.date(),
      distance: z.number(), // Feet from property
      block: z.string(), // "100 block of Main St"
      description: z.string().optional(),
      resolved: z.boolean(),
    })).optional(),
  }),

  // Heat map data
  heatMap: z.object({
    zones: z.array(z.object({
      radius: z.number(), // 0.25, 0.5, 1.0 miles
      crimeCount: z.number(),
      riskLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
      hotspots: z.array(z.object({
        location: z.string(),
        crimeConcentration: z.enum(['low', 'moderate', 'high']),
        primaryCrimeTypes: z.array(z.nativeEnum(CrimeType)),
      })).optional(),
    })),
  }),

  // Safety score
  safetyScore: z.number().min(0).max(100), // Higher = safer
  safetyGrade: z.enum(['A', 'B', 'C', 'D', 'F']),

  // Neighborhood context
  neighborhoodStats: NeighborhoodCrimeStatsSchema,

  // Nearby safety features
  safetyFeatures: z.object({
    policeStationDistance: z.number().optional(), // Miles
    fireStationDistance: z.number().optional(),
    hospitalDistance: z.number().optional(),

    streetLighting: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    trafficCalming: z.boolean().optional(), // Speed bumps, etc.
    communityWatch: z.boolean().optional(),
    gatedCommunity: z.boolean(),
  }).optional(),

  // Recommendations
  recommendations: z.array(z.object({
    category: z.enum(['security_system', 'outdoor_lighting', 'locks', 'camera', 'neighborhood_watch', 'awareness']),
    recommendation: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional(),

  generatedAt: z.date(),
});

export type PropertyCrimeAnalysis = z.infer<typeof PropertyCrimeAnalysisSchema>;

// ============================================================================
// SEX OFFENDER REGISTRY
// ============================================================================

/**
 * Sex offender registry data (legally required disclosure)
 */
export const SexOffenderDataSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Search radius
  searchRadius: z.number().default(1), // Miles

  // Offenders found
  offendersFound: z.number(),

  // Offender details (anonymized for privacy, full details via official registry)
  offenders: z.array(z.object({
    id: z.string(), // Registry ID
    distance: z.number(), // Miles from property
    approximateLocation: z.string(), // "500 block of Oak St" (not exact address)

    // Offense details
    offenseLevel: z.enum(['low', 'moderate', 'high']),
    offenseYear: z.number(),
    offenseType: z.string(), // General category

    // Compliance status
    compliant: z.boolean(),
    lastVerified: z.date(),
  })),

  // Risk assessment
  riskLevel: z.enum(['low', 'moderate', 'elevated', 'high']),

  // Comparison to area
  comparisonToArea: z.object({
    areaAverage: z.number(),
    comparison: z.enum(['below_average', 'average', 'above_average']),
  }).optional(),

  // Official registry links
  officialRegistries: z.array(z.object({
    jurisdiction: z.string(), // "Texas DPS", "Megan's Law CA"
    url: z.string().url(),
  })),

  // Legal disclaimer
  disclaimer: z.string().default(
    'This information is provided for awareness only. For complete and official information, please consult your state\'s sex offender registry.'
  ),

  lastUpdated: z.date(),
});

export type SexOffenderData = z.infer<typeof SexOffenderDataSchema>;

// ============================================================================
// POLICE & EMERGENCY SERVICES
// ============================================================================

/**
 * Police and emergency services information
 */
export const EmergencyServicesSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Police coverage
  policeDepartment: z.object({
    name: z.string(),
    jurisdiction: z.string(),
    phone: z.string(),
    nonEmergencyPhone: z.string(),
    website: z.string().url().optional(),

    stationAddress: z.string(),
    stationDistance: z.number(), // Miles

    // Service metrics
    averageResponseTime: z.number().optional(), // Minutes
    officersPerThousand: z.number().optional(),
    clearanceRate: z.number().optional(), // Percentage of crimes solved

    // Community programs
    communityPrograms: z.array(z.string()).optional(), // "Neighborhood Watch", "Coffee with a Cop"

    // Rating
    departmentRating: z.number().min(1).max(5).optional(),
  }),

  // Fire department
  fireDepartment: z.object({
    name: z.string(),
    stationAddress: z.string(),
    stationDistance: z.number(),
    phone: z.string(),
    averageResponseTime: z.number().optional(),

    // ISO rating (1-10, 1 = best)
    isoRating: z.number().min(1).max(10).optional(),
  }),

  // EMS/Ambulance
  emsService: z.object({
    provider: z.string(),
    averageResponseTime: z.number().optional(),
  }).optional(),

  // Nearest hospital
  nearestHospital: z.object({
    name: z.string(),
    address: z.string(),
    distance: z.number(),
    traumaLevel: z.enum(['level_1', 'level_2', 'level_3', 'level_4', 'not_trauma']).optional(),
    hasER: z.boolean(),
  }).optional(),

  // 911 system
  emergencySystem: z.object({
    supports911: z.boolean(),
    enhancedE911: z.boolean(), // E911 provides exact location
    textTo911Available: z.boolean(),
  }),

  lastUpdated: z.date(),
});

export type EmergencyServices = z.infer<typeof EmergencyServicesSchema>;

// ============================================================================
// SCHOOL SAFETY
// ============================================================================

/**
 * School safety information
 */
export const SchoolSafetySchema = z.object({
  schoolId: z.string(),
  schoolName: z.string(),

  // Safety measures
  safetyMeasures: z.object({
    securityOfficers: z.boolean(),
    officerCount: z.number().optional(),

    securityCameras: z.boolean(),
    metalDetectors: z.boolean(),
    controlledAccess: z.boolean(),
    visitorCheckIn: z.boolean(),

    emergencyPlan: z.boolean(),
    lockdownDrills: z.boolean(),
    drillFrequency: z.string().optional(), // "Monthly", "Quarterly"
  }),

  // Incident data
  incidents: z.object({
    lastYear: z.number(),
    violentIncidents: z.number(),
    bullyingReports: z.number(),
    suspensions: z.number(),
    expulsions: z.number(),

    trend: z.enum(['improving', 'stable', 'declining']),
  }).optional(),

  // Safety rating
  safetyRating: z.number().min(1).max(10).optional(),
  parentSafetyRating: z.number().min(1).max(5).optional(), // From reviews

  // Programs
  safetyPrograms: z.array(z.string()).optional(), // "Anti-bullying", "Mental health counseling"

  lastUpdated: z.date(),
});

export type SchoolSafety = z.infer<typeof SchoolSafetySchema>;

// ============================================================================
// NATURAL HAZARD SAFETY
// ============================================================================

/**
 * Natural hazard and disaster preparedness
 */
export const NaturalHazardSafetySchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Hazard risks (references to environment domain data)
  hazards: z.object({
    floodRisk: z.enum(['minimal', 'low', 'moderate', 'high', 'very_high']),
    wildfireRisk: z.enum(['minimal', 'low', 'moderate', 'high', 'very_high']),
    earthquakeRisk: z.enum(['minimal', 'low', 'moderate', 'high', 'very_high']),
    hurricaneRisk: z.enum(['none', 'minimal', 'low', 'moderate', 'high']).optional(),
    tornadoRisk: z.enum(['minimal', 'low', 'moderate', 'high', 'extreme']).optional(),
  }),

  // Emergency preparedness
  preparedness: z.object({
    nearestShelter: z.object({
      type: z.enum(['hurricane', 'tornado', 'general', 'cooling_warming']),
      name: z.string(),
      address: z.string(),
      distance: z.number(),
      capacity: z.number().optional(),
    }).optional(),

    evacuationRoutes: z.array(z.object({
      description: z.string(),
      primaryRoute: z.string(),
      alternateRoute: z.string().optional(),
    })).optional(),

    emergencySupplies: z.object({
      recommended: z.array(z.string()),
      daysSupplyRecommended: z.number(), // Typically 3-7 days
    }).optional(),
  }).optional(),

  // Community resilience
  communityResilience: z.object({
    disasterResponseRating: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    hasWarningSystem: z.boolean(),
    warningSystemType: z.array(z.enum(['sirens', 'alerts', 'app', 'reverse_911'])).optional(),
  }).optional(),

  lastUpdated: z.date(),
});

export type NaturalHazardSafety = z.infer<typeof NaturalHazardSafetySchema>;

// ============================================================================
// COMPREHENSIVE SAFETY REPORT
// ============================================================================

/**
 * Comprehensive safety report for a property
 */
export const SafetyReportSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Overall safety score
  overallSafetyScore: z.number().min(0).max(100),
  safetyGrade: z.enum(['A', 'B', 'C', 'D', 'F']),

  // Component scores
  componentScores: z.object({
    crimeScore: z.number().min(0).max(100),
    emergencyServicesScore: z.number().min(0).max(100),
    naturalHazardScore: z.number().min(0).max(100),
    schoolSafetyScore: z.number().min(0).max(100).optional(),
  }),

  // Detailed sections
  crimeAnalysis: PropertyCrimeAnalysisSchema,
  sexOffenderData: SexOffenderDataSchema,
  emergencyServices: EmergencyServicesSchema,
  naturalHazards: NaturalHazardSafetySchema,
  schoolSafety: z.array(SchoolSafetySchema).optional(),

  // Summary insights
  insights: z.array(z.object({
    type: z.enum(['strength', 'concern', 'recommendation']),
    category: z.enum(['crime', 'emergency', 'natural_hazards', 'schools', 'general']),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),

  // Comparison
  comparisonSummary: z.object({
    saferThanPercentage: z.number(), // "Safer than 78% of neighborhoods"
    similarNeighborhoods: z.array(z.object({
      name: z.string(),
      safetyScore: z.number(),
      comparison: z.enum(['safer', 'similar', 'less_safe']),
    })).optional(),
  }),

  generatedAt: z.date(),
  validUntil: z.date(), // Report should be refreshed quarterly
});

export type SafetyReport = z.infer<typeof SafetyReportSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const SafetySchemas = {
  NeighborhoodCrimeStats: NeighborhoodCrimeStatsSchema,
  PropertyCrimeAnalysis: PropertyCrimeAnalysisSchema,
  SexOffenderData: SexOffenderDataSchema,
  EmergencyServices: EmergencyServicesSchema,
  SchoolSafety: SchoolSafetySchema,
  NaturalHazardSafety: NaturalHazardSafetySchema,
  SafetyReport: SafetyReportSchema,
};
