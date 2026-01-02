/**
 * Environmental & Climate Risk Assessment
 * Comprehensive climate, environmental, and natural disaster risk data
 * Increasingly critical for informed property decisions
 */

import { z } from 'zod';

// ============================================================================
// FLOOD RISK
// ============================================================================

/**
 * FEMA flood zone classifications
 */
export enum FloodZone {
  // High risk (Special Flood Hazard Areas)
  A = 'A', // 1% annual chance, no BFE determined
  AE = 'AE', // 1% annual chance, BFE determined
  AH = 'AH', // 1% annual chance, ponding 1-3 feet
  AO = 'AO', // 1% annual chance, sheet flow 1-3 feet
  V = 'V', // 1% annual chance, coastal with wave action

  // Moderate risk
  B = 'B', // 0.2% annual chance (former designation)
  X_SHADED = 'X_SHADED', // 0.2% annual chance (500-year floodplain)

  // Minimal risk
  C = 'C', // Minimal flood risk (former designation)
  X_UNSHADED = 'X_UNSHADED', // Minimal flood risk

  // Undetermined
  D = 'D', // Undetermined risk

  // Outside flood zone
  NONE = 'NONE',
}

/**
 * Comprehensive flood risk assessment
 */
export const FloodRiskSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // FEMA data
  femaZone: z.nativeEnum(FloodZone),
  baseFloodElevation: z.number().optional(), // Feet above sea level
  propertyElevation: z.number().optional(), // Feet above sea level
  elevationDifference: z.number().optional(), // Property vs BFE

  // Risk assessment
  riskLevel: z.enum(['minimal', 'low', 'moderate', 'high', 'very_high']),
  annualFloodProbability: z.number(), // Percentage (0-100)

  // Insurance requirements
  insuranceRequired: z.boolean(),
  estimatedAnnualPremium: z.object({
    min: z.number(),
    max: z.number(),
    average: z.number(),
  }).optional(),

  // Historical data
  floodHistory: z.array(z.object({
    date: z.date(),
    severity: z.enum(['minor', 'moderate', 'major', 'catastrophic']),
    waterDepth: z.number().optional(), // Inches
    damage: z.string().optional(),
  })).optional(),

  // Climate projections
  futureRisk: z.object({
    year2030: z.enum(['improving', 'stable', 'increasing']),
    year2050: z.enum(['improving', 'stable', 'increasing']),
    seaLevelRiseImpact: z.enum(['none', 'minor', 'moderate', 'significant']).optional(),
  }).optional(),

  // Mitigation
  mitigationOptions: z.array(z.object({
    type: z.enum(['elevation', 'flood_vents', 'sump_pump', 'landscaping', 'barriers']),
    description: z.string(),
    estimatedCost: z.number(),
    riskReduction: z.number(), // Percentage reduction
  })).optional(),

  // Data sources
  sources: z.array(z.object({
    name: z.string(), // "FEMA", "First Street Foundation"
    date: z.date(),
    url: z.string().url().optional(),
  })),

  lastUpdated: z.date(),
});

export type FloodRisk = z.infer<typeof FloodRiskSchema>;

// ============================================================================
// WILDFIRE RISK
// ============================================================================

/**
 * Wildfire hazard severity zones
 */
export enum WildfireHazardZone {
  NONE = 'none',
  NON_WILDLAND = 'non_wildland',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

/**
 * Wildfire risk assessment
 */
export const WildfireRiskSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Hazard classification
  hazardZone: z.nativeEnum(WildfireHazardZone),
  riskScore: z.number().min(0).max(100),

  // Contributing factors
  factors: z.object({
    vegetationDensity: z.enum(['low', 'moderate', 'high', 'very_high']),
    topography: z.enum(['flat', 'moderate_slope', 'steep_slope']),
    fireHistory: z.enum(['rare', 'occasional', 'frequent']),
    proximityToWildland: z.number().optional(), // Miles
    windExposure: z.enum(['low', 'moderate', 'high']),
  }),

  // Historical fires
  nearbyFireHistory: z.array(z.object({
    name: z.string(),
    year: z.number(),
    distance: z.number(), // Miles from property
    acresBurned: z.number(),
    containmentDays: z.number(),
  })).optional(),

  // Insurance
  insuranceImpact: z.object({
    availabilityStatus: z.enum(['readily_available', 'limited', 'difficult', 'unavailable']),
    estimatedPremiumIncrease: z.number().optional(), // Percentage vs standard
    fairPlanRequired: z.boolean(), // Requires state FAIR plan
  }),

  // Mitigation
  defensibleSpace: z.object({
    current: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    recommendations: z.array(z.string()),
    estimatedCost: z.number().optional(),
  }).optional(),

  // Fire protection
  fireProtection: z.object({
    nearestFireStation: z.number(), // Miles
    responseTime: z.number().optional(), // Minutes
    hydroSource: z.enum(['hydrant', 'reservoir', 'limited']),
    iso Rating: z.number().min(1).max(10).optional(), // Insurance Services Office rating
  }).optional(),

  lastUpdated: z.date(),
});

export type WildfireRisk = z.infer<typeof WildfireRiskSchema>;

// ============================================================================
// EARTHQUAKE RISK
// ============================================================================

/**
 * Earthquake hazard assessment
 */
export const EarthquakeRiskSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Seismic hazard
  hazardLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
  peakGroundAcceleration: z.number().optional(), // %g (percent of gravity)

  // Fault proximity
  nearestFault: z.object({
    name: z.string(),
    distance: z.number(), // Miles
    type: z.enum(['active', 'potentially_active', 'inactive']),
    slipRate: z.number().optional(), // mm/year
  }).optional(),

  // Liquefaction risk
  liquefactionRisk: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),

  // Building considerations
  buildingRisk: z.object({
    yearBuilt: z.number(),
    seismicCodeCompliance: z.enum(['pre_code', 'older_code', 'modern_code', 'latest_code']).optional(),
    foundationType: z.enum(['slab', 'crawlspace', 'basement', 'pier']).optional(),
    retrofitRecommended: z.boolean(),
    retrofitCost: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
  }).optional(),

  // Historical events
  significantEarthquakes: z.array(z.object({
    date: z.date(),
    magnitude: z.number(),
    distance: z.number(), // Miles
    damage: z.enum(['none', 'minor', 'moderate', 'severe']).optional(),
  })).optional(),

  // Insurance
  insuranceAvailable: z.boolean(),
  estimatedAnnualPremium: z.number().optional(),

  lastUpdated: z.date(),
});

export type EarthquakeRisk = z.infer<typeof EarthquakeRiskSchema>;

// ============================================================================
// AIR QUALITY
// ============================================================================

/**
 * Air Quality Index classification
 */
export enum AQILevel {
  GOOD = 'good', // 0-50
  MODERATE = 'moderate', // 51-100
  UNHEALTHY_SENSITIVE = 'unhealthy_for_sensitive', // 101-150
  UNHEALTHY = 'unhealthy', // 151-200
  VERY_UNHEALTHY = 'very_unhealthy', // 201-300
  HAZARDOUS = 'hazardous', // 301+
}

/**
 * Comprehensive air quality assessment
 */
export const AirQualitySchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Current AQI
  current: z.object({
    aqi: z.number().min(0).max(500),
    level: z.nativeEnum(AQILevel),
    primaryPollutant: z.enum(['pm2.5', 'pm10', 'ozone', 'no2', 'so2', 'co']),
    measuredAt: z.date(),
  }),

  // Historical averages
  annual: z.object({
    averageAQI: z.number(),
    goodDays: z.number(), // Days per year
    unhealthyDays: z.number(),
    trend: z.enum(['improving', 'stable', 'worsening']),
  }),

  // Pollution sources
  sources: z.array(z.object({
    type: z.enum(['traffic', 'industrial', 'wildfire', 'agriculture', 'natural']),
    distance: z.number().optional(), // Miles
    impact: z.enum(['low', 'moderate', 'high']),
  })).optional(),

  // Health impact
  healthAdvisory: z.object({
    general: z.string(),
    sensitiveGroups: z.array(z.enum([
      'children',
      'elderly',
      'asthma',
      'heart_disease',
      'respiratory_conditions',
    ])).optional(),
    recommendations: z.array(z.string()),
  }).optional(),

  // Comparison
  comparisonToNational: z.object({
    percentile: z.number().min(0).max(100), // Lower is better
    betterThan: z.string(), // "78% of US locations"
  }).optional(),

  lastUpdated: z.date(),
});

export type AirQuality = z.infer<typeof AirQualitySchema>;

// ============================================================================
// CLIMATE & WEATHER
// ============================================================================

/**
 * Climate comfort and weather patterns
 */
export const ClimateProfileSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Temperature
  temperature: z.object({
    annualAverage: z.number(),
    summerAverage: z.number(),
    winterAverage: z.number(),
    recordHigh: z.number(),
    recordLow: z.number(),
    daysOver90F: z.number(),
    daysBelow32F: z.number(),
  }),

  // Precipitation
  precipitation: z.object({
    annualInches: z.number(),
    rainyDays: z.number(),
    snowyDays: z.number(),
    annualSnowfall: z.number(),
  }),

  // Sunshine
  sunshine: z.object({
    sunnyDays: z.number(),
    partlyCloudyDays: z.number(),
    cloudyDays: z.number(),
    annualSunshineHours: z.number(),
  }),

  // Humidity
  humidity: z.object({
    averageAnnual: z.number(),
    summer: z.number(),
    winter: z.number(),
  }),

  // Severe weather
  severeWeather: z.object({
    tornadoRisk: z.enum(['minimal', 'low', 'moderate', 'high', 'extreme']),
    hurricaneRisk: z.enum(['none', 'minimal', 'low', 'moderate', 'high']).optional(),
    hailRisk: z.enum(['minimal', 'low', 'moderate', 'high']),
    severeThunderstorms: z.number(), // Average per year
  }),

  // Comfort indices
  comfortIndices: z.object({
    heatIndexDays: z.number(), // Days with dangerous heat index
    windChillDays: z.number(), // Days with dangerous wind chill
    comfortableMonths: z.array(z.number()), // Months 1-12
  }),

  // Climate change projections
  futureProjections: z.object({
    temperatureChange2050: z.number().optional(), // Degrees F increase
    precipitationChange2050: z.number().optional(), // Percentage change
    extremeWeatherTrend: z.enum(['decreasing', 'stable', 'increasing']).optional(),
  }).optional(),

  lastUpdated: z.date(),
});

export type ClimateProfile = z.infer<typeof ClimateProfileSchema>;

// ============================================================================
// ENVIRONMENTAL HAZARDS
// ============================================================================

/**
 * Other environmental hazards and concerns
 */
export const EnvironmentalHazardsSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Radon
  radon: z.object({
    zoneLevel: z.enum(['zone_1_high', 'zone_2_moderate', 'zone_3_low']),
    testingRecommended: z.boolean(),
    mitigationCost: z.number().optional(),
  }).optional(),

  // Soil contamination
  soilContamination: z.object({
    nearSuperfundSite: z.boolean(),
    superfundDistance: z.number().optional(), // Miles
    brownfieldStatus: z.boolean(),
    knownContaminants: z.array(z.string()).optional(),
  }).optional(),

  // Lead paint risk (based on year built)
  leadPaintRisk: z.enum(['none', 'possible', 'likely']).optional(),

  // Asbestos risk
  asbestosRisk: z.enum(['none', 'possible', 'likely']).optional(),

  // Noise pollution
  noisePollution: z.object({
    level: z.enum(['very_quiet', 'quiet', 'moderate', 'loud', 'very_loud']),
    sources: z.array(z.enum(['traffic', 'airport', 'railroad', 'highway', 'industrial', 'entertainment'])),
    decibels: z.number().optional(),
  }).optional(),

  // Light pollution
  lightPollution: z.object({
    level: z.enum(['dark', 'rural', 'suburban', 'urban', 'bright_urban']),
    nightSkyVisibility: z.enum(['excellent', 'good', 'fair', 'poor']),
  }).optional(),

  lastUpdated: z.date(),
});

export type EnvironmentalHazards = z.infer<typeof EnvironmentalHazardsSchema>;

// ============================================================================
// SUSTAINABILITY & GREEN FEATURES
// ============================================================================

/**
 * Property sustainability and green features
 */
export const SustainabilityProfileSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Solar potential
  solarPotential: z.object({
    rating: z.enum(['poor', 'fair', 'good', 'excellent']),
    annualSunlightHours: z.number(),
    roofSuitability: z.boolean().optional(),
    estimatedAnnualSavings: z.number().optional(),
    paybackPeriod: z.number().optional(), // Years
    hasSolarPanels: z.boolean(),
    solarCapacity: z.number().optional(), // kW
  }).optional(),

  // Energy efficiency
  energyEfficiency: z.object({
    homeEnergyScore: z.number().min(1).max(10).optional(),
    estimatedAnnualCost: z.number().optional(),
    comparisonToSimilar: z.enum(['much_better', 'better', 'average', 'worse', 'much_worse']).optional(),

    features: z.object({
      energyStarAppliances: z.boolean(),
      ledLighting: z.boolean(),
      programmableThermostat: z.boolean(),
      tanklessWaterHeater: z.boolean(),
      doublePane Windows: z.boolean(),
      atticInsulation: z.enum(['none', 'minimal', 'adequate', 'excellent']).optional(),
    }).optional(),
  }).optional(),

  // Green certifications
  certifications: z.array(z.enum([
    'leed_certified',
    'leed_silver',
    'leed_gold',
    'leed_platinum',
    'energy_star',
    'net_zero',
    'passive_house',
  ])).optional(),

  // EV charging
  evCharging: z.object({
    hasCharger: z.boolean(),
    chargerType: z.enum(['level_1', 'level_2', 'level_3']).optional(),
    preWired: z.boolean(),
    installCost: z.number().optional(),
  }).optional(),

  // Water conservation
  waterConservation: z.object({
    lowFlowFixtures: z.boolean(),
    rainwaterHarvesting: z.boolean(),
    droughtTolerantLandscaping: z.boolean(),
    grayWaterSystem: z.boolean(),
  }).optional(),

  // Green score
  overallGreenScore: z.number().min(0).max(100).optional(),

  lastUpdated: z.date(),
});

export type SustainabilityProfile = z.infer<typeof SustainabilityProfileSchema>;

// ============================================================================
// COMPREHENSIVE RISK REPORT
// ============================================================================

/**
 * Aggregated environmental risk report for a property
 */
export const EnvironmentalRiskReportSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Overall risk score
  overallRiskScore: z.number().min(0).max(100), // Lower is better
  riskLevel: z.enum(['low', 'moderate', 'elevated', 'high']),

  // Individual risks
  floodRisk: FloodRiskSchema.optional(),
  wildfireRisk: WildfireRiskSchema.optional(),
  earthquakeRisk: EarthquakeRiskSchema.optional(),
  airQuality: AirQualitySchema.optional(),
  climate: ClimateProfileSchema.optional(),
  hazards: EnvironmentalHazardsSchema.optional(),
  sustainability: SustainabilityProfileSchema.optional(),

  // Insurance impact
  totalInsuranceImpact: z.object({
    estimatedAnnualIncrease: z.number(), // $ above baseline
    factors: z.array(z.string()), // ["Flood zone AE", "Wildfire risk"]
  }).optional(),

  // Recommendations
  recommendations: z.array(z.object({
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    recommendation: z.string(),
    estimatedCost: z.number().optional(),
    timeline: z.string().optional(),
  })),

  // Comparison
  comparisonToArea: z.object({
    betterThan: z.number(), // Percentage of properties in area
    summary: z.string(),
  }).optional(),

  generatedAt: z.date(),
  validUntil: z.date(), // Report should be refreshed
});

export type EnvironmentalRiskReport = z.infer<typeof EnvironmentalRiskReportSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const EnvironmentSchemas = {
  FloodRisk: FloodRiskSchema,
  WildfireRisk: WildfireRiskSchema,
  EarthquakeRisk: EarthquakeRiskSchema,
  AirQuality: AirQualitySchema,
  ClimateProfile: ClimateProfileSchema,
  EnvironmentalHazards: EnvironmentalHazardsSchema,
  SustainabilityProfile: SustainabilityProfileSchema,
  EnvironmentalRiskReport: EnvironmentalRiskReportSchema,
};
