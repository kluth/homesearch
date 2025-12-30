import { z } from 'zod';

/**
 * Market Analytics & Insights
 */

export enum MarketTrend {
  STRONG_SELLERS = 'strong_sellers', // High demand, low supply
  SELLERS = 'sellers',
  BALANCED = 'balanced',
  BUYERS = 'buyers',
  STRONG_BUYERS = 'strong_buyers', // Low demand, high supply
}

export const MarketAnalyticsSchema = z.object({
  id: z.string(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string().optional(),
    neighborhood: z.string().optional(),
  }),

  // Time period
  period: z.enum(['week', 'month', 'quarter', 'year']),
  startDate: z.date(),
  endDate: z.date(),

  // Market metrics
  metrics: z.object({
    // Supply
    activeListings: z.number(),
    newListings: z.number(),
    closedListings: z.number(),
    inventoryMonths: z.number(), // Months of supply

    // Demand
    averageDaysOnMarket: z.number(),
    medianDaysOnMarket: z.number(),
    listToSaleRatio: z.number(), // Percentage

    // Pricing
    medianListPrice: z.number(),
    medianSoldPrice: z.number(),
    averagePricePerSqFt: z.number(),
    priceReduction: z.number(), // Percentage of listings with price cuts

    // Trends
    priceChange: z.number(), // Percentage change from previous period
    volumeChange: z.number(), // Percentage change in sales volume
    competitionIndex: z.number().min(0).max(100), // 0 = no competition, 100 = very competitive
  }),

  // Market classification
  marketType: z.nativeEnum(MarketTrend),
  marketScore: z.number().min(0).max(100), // 0 = strong buyers market, 100 = strong sellers market

  // Predictions
  predictions: z.object({
    nextMonthPriceChange: z.number(), // Predicted percentage change
    confidence: z.number().min(0).max(1),
    trend: z.enum(['increasing', 'stable', 'decreasing']),
  }),

  // Comparable markets
  comparableMarkets: z.array(z.object({
    city: z.string(),
    state: z.string(),
    similarity: z.number().min(0).max(1),
    medianPrice: z.number(),
    priceChange: z.number(),
  })),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MarketAnalytics = z.infer<typeof MarketAnalyticsSchema>;

/**
 * Neighborhood Insights
 */
export const NeighborhoodInsightsSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().optional(),

  // Boundaries
  boundaries: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }).optional(),

  // Demographics
  demographics: z.object({
    population: z.number(),
    medianAge: z.number(),
    medianIncome: z.number(),
    householdSize: z.number(),
    ownerOccupiedPercent: z.number(),
    renterOccupiedPercent: z.number(),
  }),

  // Scores (0-100)
  scores: z.object({
    overall: z.number().min(0).max(100),
    schools: z.number().min(0).max(100),
    safety: z.number().min(0).max(100),
    walkability: z.number().min(0).max(100),
    transitScore: z.number().min(0).max(100),
    bikeScore: z.number().min(0).max(100),
    nightlife: z.number().min(0).max(100),
    restaurants: z.number().min(0).max(100),
    shopping: z.number().min(0).max(100),
    parks: z.number().min(0).max(100),
  }),

  // Schools
  schools: z.array(z.object({
    name: z.string(),
    type: z.enum(['elementary', 'middle', 'high', 'private']),
    rating: z.number().min(0).max(10),
    distance: z.number(), // km
    studentTeacherRatio: z.number().optional(),
  })),

  // Crime statistics
  crime: z.object({
    crimeRate: z.number(), // Per 1000 residents
    violentCrime: z.number(),
    propertyCrime: z.number(),
    trend: z.enum(['increasing', 'stable', 'decreasing']),
    nationalAverage: z.number(),
  }),

  // Amenities
  amenities: z.object({
    groceryStores: z.number(),
    restaurants: z.number(),
    parks: z.number(),
    gyms: z.number(),
    hospitals: z.number(),
    publicTransitStops: z.number(),
  }),

  // Transportation
  transportation: z.object({
    averageCommute: z.number(), // minutes
    commuteByMode: z.object({
      driving: z.number(), // percentage
      transit: z.number(),
      walking: z.number(),
      bicycling: z.number(),
      other: z.number(),
    }),
  }),

  // Real estate trends
  realEstate: z.object({
    medianHomeValue: z.number(),
    valueChange1Year: z.number(), // percentage
    valueChange5Year: z.number(), // percentage
    medianRent: z.number(),
    homeownershipRate: z.number(), // percentage
  }),

  // Vibe/Character
  characteristics: z.array(z.enum([
    'family_friendly',
    'young_professionals',
    'urban',
    'suburban',
    'historic',
    'trendy',
    'quiet',
    'walkable',
    'diverse',
    'artsy',
    'nightlife',
    'green_space',
  ])),

  // Top attractions
  topAttractions: z.array(z.object({
    name: z.string(),
    type: z.string(),
    distance: z.number(), // km
    rating: z.number().optional(),
  })),

  dataUpdatedAt: z.date(),
  createdAt: z.date(),
});

export type NeighborhoodInsights = z.infer<typeof NeighborhoodInsightsSchema>;

/**
 * Price History & Trends
 */
export const PriceHistorySchema = z.object({
  id: z.string(),
  propertyId: z.string(),

  // Historical prices
  history: z.array(z.object({
    date: z.date(),
    price: z.number(),
    event: z.enum(['listed', 'price_change', 'sold', 'delisted', 'relisted']),
    changePercent: z.number().optional(),
    daysOnMarket: z.number().optional(),
  })),

  // Current status
  currentPrice: z.number(),
  originalListPrice: z.number(),
  priceChanges: z.number(), // Total number of price changes
  totalPriceChange: z.number(), // Percentage from original
  daysSinceFirstListed: z.number(),

  // Valuation comparison
  estimatedValue: z.number().optional(),
  priceVsEstimate: z.number().optional(), // Percentage difference

  // Tax assessment
  taxAssessedValue: z.number().optional(),
  taxYear: z.number().optional(),

  // Previous sales
  previousSales: z.array(z.object({
    date: z.date(),
    price: z.number(),
    pricePerSqFt: z.number().optional(),
  })),

  updatedAt: z.date(),
});

export type PriceHistory = z.infer<typeof PriceHistorySchema>;

/**
 * Investment Analysis
 */
export const InvestmentAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Purchase assumptions
  purchasePrice: z.number(),
  downPaymentPercent: z.number().default(20),
  downPayment: z.number(),
  loanAmount: z.number(),
  interestRate: z.number(),
  loanTerm: z.number().default(30), // years
  closingCosts: z.number(),

  // Property details
  monthlyHOA: z.number().default(0),
  annualPropertyTax: z.number(),
  annualInsurance: z.number(),
  annualMaintenance: z.number(),

  // Rental assumptions (if investment property)
  isRental: z.boolean().default(false),
  monthlyRent: z.number().optional(),
  vacancyRate: z.number().default(5), // percentage
  managementFee: z.number().default(10), // percentage

  // Calculated metrics
  monthlyPayment: z.object({
    principal: z.number(),
    interest: z.number(),
    tax: z.number(),
    insurance: z.number(),
    hoa: z.number(),
    total: z.number(),
  }),

  // ROI calculations
  roi: z.object({
    // Cash flow (rental only)
    monthlyCashFlow: z.number().optional(),
    annualCashFlow: z.number().optional(),
    cashOnCashReturn: z.number().optional(), // percentage

    // Appreciation
    appreciationRate: z.number().default(3), // percentage per year
    estimatedValue5Year: z.number(),
    estimatedValue10Year: z.number(),

    // Total return
    totalInvestment: z.number(),
    projectedEquity5Year: z.number(),
    projectedEquity10Year: z.number(),
    roi5Year: z.number(), // percentage
    roi10Year: z.number(), // percentage

    // Comparison to alternatives
    comparedToRenting: z.object({
      monthlyRentEquivalent: z.number(),
      savingsPerMonth: z.number(),
      savingsPerYear: z.number(),
    }).optional(),
  }),

  // Break-even analysis
  breakEven: z.object({
    monthsToBreakEven: z.number(),
    totalCostToBreakEven: z.number(),
  }),

  // Sensitivity analysis
  sensitivity: z.object({
    interestRateChange1Percent: z.number(), // Change in monthly payment
    homeValueChange10Percent: z.number(), // Change in equity
    rentChange10Percent: z.number().optional(), // Change in cash flow
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InvestmentAnalysis = z.infer<typeof InvestmentAnalysisSchema>;

/**
 * Commute Analysis
 */
export enum TransportMode {
  DRIVING = 'driving',
  TRANSIT = 'transit',
  WALKING = 'walking',
  BICYCLING = 'bicycling',
}

export const CommuteAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Destinations
  destinations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    type: z.enum(['work', 'school', 'other']),

    // Commute by mode
    routes: z.array(z.object({
      mode: z.nativeEnum(TransportMode),
      distance: z.number(), // km
      duration: z.number(), // minutes
      durationInTraffic: z.number().optional(), // minutes (peak hours)

      // Transit specific
      transfers: z.number().optional(),
      walkingDistance: z.number().optional(),
      cost: z.number().optional(),

      // Route details
      steps: z.array(z.object({
        instruction: z.string(),
        distance: z.number(),
        duration: z.number(),
      })).optional(),
    })),

    // Best option
    recommendedMode: z.nativeEnum(TransportMode),
    recommendedDuration: z.number(),
  })),

  // Overall score
  commuteScore: z.number().min(0).max(100),
  totalDailyCommute: z.number(), // minutes (round trip to all destinations)

  // Costs
  estimatedMonthlyCost: z.object({
    driving: z.number().optional(), // Gas + parking
    transit: z.number().optional(), // Transit pass
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CommuteAnalysis = z.infer<typeof CommuteAnalysisSchema>;

/**
 * Property Comparison
 */
export const PropertyComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().optional(),

  // Properties being compared
  propertyIds: z.array(z.string()).min(2).max(5),

  // Comparison criteria (user weighted)
  weights: z.object({
    price: z.number().min(0).max(10).default(8),
    location: z.number().min(0).max(10).default(8),
    size: z.number().min(0).max(10).default(6),
    condition: z.number().min(0).max(10).default(7),
    schools: z.number().min(0).max(10).default(5),
    commute: z.number().min(0).max(10).default(6),
    amenities: z.number().min(0).max(10).default(5),
    investment: z.number().min(0).max(10).default(4),
  }),

  // Calculated scores
  scores: z.array(z.object({
    propertyId: z.string(),
    totalScore: z.number().min(0).max(100),
    breakdown: z.object({
      price: z.number().min(0).max(10),
      location: z.number().min(0).max(10),
      size: z.number().min(0).max(10),
      condition: z.number().min(0).max(10),
      schools: z.number().min(0).max(10),
      commute: z.number().min(0).max(10),
      amenities: z.number().min(0).max(10),
      investment: z.number().min(0).max(10),
    }),
  })),

  // Winner
  recommendedPropertyId: z.string(),

  // Notes
  notes: z.string().optional(),
  prosAndCons: z.record(z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PropertyComparison = z.infer<typeof PropertyComparisonSchema>;
