/**
 * Rental Market Analytics Schemas
 *
 * Comprehensive rental market data for real estate investors.
 * Addresses User Story 3.2: Rental Yield Analysis
 */

import { z } from 'zod';

/**
 * Tenant Demand Level
 */
export enum TenantDemand {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

/**
 * Market Trend Direction
 */
export enum TrendDirection {
  DECLINING = 'declining',
  STABLE = 'stable',
  RISING = 'rising',
  RAPIDLY_RISING = 'rapidly_rising',
}

/**
 * Comparable Rental Property
 */
export const ComparableRentalSchema = z.object({
  id: z.string(),
  address: z.string(),
  distance: z.number(), // Miles from subject property

  // Property Details
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFeet: z.number(),
  propertyType: z.string(),

  // Rental Info
  monthlyRent: z.number(),
  rentPerSquareFoot: z.number(),

  // Lease Details
  leaseStatus: z.enum(['active', 'available', 'recently_rented']),
  daysOnMarket: z.number().optional(),
  depositAmount: z.number().optional(),

  // Amenities
  amenities: z.array(z.string()),

  // Dates
  listedAt: z.date().optional(),
  rentedAt: z.date().optional(),

  // Source
  source: z.string(), // "Zillow", "Rentometer", "Craigslist", etc.
  url: z.string().url().optional(),
});

export type ComparableRental = z.infer<typeof ComparableRentalSchema>;

/**
 * Seasonal Rent Trend
 */
export const SeasonalRentTrendSchema = z.object({
  month: z.number().min(1).max(12),
  averageRent: z.number(),
  percentChange: z.number(), // Compared to annual average
  demand: z.nativeEnum(TenantDemand),
});

export type SeasonalRentTrend = z.infer<typeof SeasonalRentTrendSchema>;

/**
 * Rent Growth Projection
 */
export const RentGrowthSchema = z.object({
  oneYear: z.number(), // Percentage
  threeYear: z.number(),
  fiveYear: z.number(),
  tenYear: z.number().optional(),

  // Historical for comparison
  historical: z.object({
    oneYear: z.number(),
    threeYear: z.number(),
    fiveYear: z.number(),
  }).optional(),
});

export type RentGrowth = z.infer<typeof RentGrowthSchema>;

/**
 * Vacancy Analysis
 */
export const VacancyAnalysisSchema = z.object({
  currentVacancyRate: z.number(), // Percentage
  historicalVacancyRate: z.number(), // 5-year average
  averageDaysVacant: z.number(),

  // By property type
  byPropertyType: z.record(z.object({
    vacancyRate: z.number(),
    averageDaysVacant: z.number(),
  })).optional(),

  // Trend
  trend: z.nativeEnum(TrendDirection),

  // Context
  marketContext: z.enum([
    'landlord_market', // Low vacancy, high demand
    'balanced_market',
    'tenant_market', // High vacancy, low demand
  ]),
});

export type VacancyAnalysis = z.infer<typeof VacancyAnalysisSchema>;

/**
 * Rental Market Snapshot
 */
export const RentalMarketSnapshotSchema = z.object({
  location: z.object({
    city: z.string(),
    state: z.string(),
    zipCode: z.string().optional(),
    neighborhood: z.string().optional(),
  }),

  // Date of analysis
  asOfDate: z.date(),

  // Rent Metrics
  medianRent: z.number(),
  averageRent: z.number(),
  rentPerSquareFoot: z.object({
    median: z.number(),
    average: z.number(),
    p25: z.number(),
    p75: z.number(),
  }),

  // By property type
  rentByType: z.record(z.object({
    median: z.number(),
    average: z.number(),
    count: z.number(),
  })).optional(),

  // By bedroom count
  rentByBedrooms: z.record(z.object({
    median: z.number(),
    average: z.number(),
    count: z.number(),
  })).optional(),

  // Market Activity
  totalListings: z.number(),
  newListings: z.number(), // Last 30 days
  averageDaysOnMarket: z.number(),

  // Supply/Demand
  tenantDemand: z.nativeEnum(TenantDemand),
  supplyLevel: z.enum(['shortage', 'balanced', 'oversupply']),
});

export type RentalMarketSnapshot = z.infer<typeof RentalMarketSnapshotSchema>;

/**
 * Complete Rental Market Analysis
 */
export const RentalMarketAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  address: z.string(),

  // Estimated Rent for Subject Property
  estimatedRent: z.object({
    low: z.number(),
    median: z.number(),
    high: z.number(),
    confidence: z.enum(['low', 'medium', 'high']),
  }),

  // Comparable Rentals
  comparableRentals: z.array(ComparableRentalSchema),
  numberOfComps: z.number(),
  averageCompRent: z.number(),

  // Rent per Square Foot Analysis
  subjectRentPerSqFt: z.number(),
  marketRentPerSqFt: z.number(),
  premiumDiscount: z.number(), // Percentage vs market

  // Vacancy & Demand
  vacancyAnalysis: VacancyAnalysisSchema,
  estimatedVacancyDays: z.number(), // Per year
  vacancyCost: z.number(), // Monthly rent * (vacancy days / 365)

  // Market Trends
  trendDirection: z.nativeEnum(TrendDirection),
  rentGrowth: RentGrowthSchema,
  seasonalTrends: z.array(SeasonalRentTrendSchema),

  // Market Snapshot
  marketSnapshot: RentalMarketSnapshotSchema,

  // Investment Metrics
  grossYield: z.number(), // (Annual rent / property value) * 100
  netYield: z.number(), // After expenses
  cashOnCashReturn: z.number(), // After mortgage

  // Best/Worst Months
  bestMonthToList: z.object({
    month: z.number(),
    reason: z.string(),
  }),
  worstMonthToList: z.object({
    month: z.number(),
    reason: z.string(),
  }),

  // Recommendations
  recommendations: z.array(z.object({
    type: z.enum(['pricing', 'timing', 'amenities', 'marketing']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
  })),

  // Metadata
  analyzedAt: z.date(),
  dataSource: z.string(), // "Rentometer API", "Zillow Rental API", etc.
  expiresAt: z.date(), // Data freshness
});

export type RentalMarketAnalysis = z.infer<typeof RentalMarketAnalysisSchema>;

/**
 * Rental Comparison Report
 * Compare rental potential of multiple properties
 */
export const RentalComparisonReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),

  properties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    purchasePrice: z.number(),
    estimatedRent: z.number(),
    grossYield: z.number(),
    netYield: z.number(),
    cashOnCashReturn: z.number(),
    vacancyRate: z.number(),
    tenantDemand: z.nativeEnum(TenantDemand),
    score: z.number(), // Composite score 0-100
  })),

  // Rankings
  rankings: z.object({
    byGrossYield: z.array(z.string()), // Property IDs in order
    byNetYield: z.array(z.string()),
    byCashOnCash: z.array(z.string()),
    byOverallScore: z.array(z.string()),
  }),

  // Summary
  summary: z.object({
    averageGrossYield: z.number(),
    bestProperty: z.string(),
    worstProperty: z.string(),
    totalEstimatedMonthlyIncome: z.number(),
  }),
});

export type RentalComparisonReport = z.infer<typeof RentalComparisonReportSchema>;

/**
 * Tenant Profile
 */
export const TenantProfileSchema = z.object({
  demographics: z.object({
    averageAge: z.number().optional(),
    averageHouseholdSize: z.number().optional(),
    averageIncome: z.number().optional(),
    employmentTypes: z.array(z.string()).optional(),
  }),

  preferences: z.object({
    averageLeaseLength: z.number(), // Months
    petOwnership: z.number(), // Percentage
    parkingNeeds: z.number(), // Percentage requiring parking
    commonAmenities: z.array(z.string()),
  }),

  behavior: z.object({
    averageTenureYears: z.number(),
    renewalRate: z.number(), // Percentage
    onTimePaymentRate: z.number(), // Percentage
  }),
});

export type TenantProfile = z.infer<typeof TenantProfileSchema>;

/**
 * Rental Pricing Strategy
 */
export const PricingStrategySchema = z.object({
  recommendedRent: z.number(),
  strategy: z.enum([
    'premium', // Price above market
    'market_rate', // Price at market
    'competitive', // Price below market to fill quickly
    'luxury', // High-end pricing
  ]),

  reasoning: z.string(),

  alternatives: z.array(z.object({
    rent: z.number(),
    strategy: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    expectedDaysToRent: z.number(),
  })),

  // Value-adds to justify higher rent
  valueAdds: z.array(z.object({
    improvement: z.string(),
    cost: z.number(),
    rentIncrease: z.number(),
    roi: z.number(), // Months to recoup
  })).optional(),
});

export type PricingStrategy = z.infer<typeof PricingStrategySchema>;
