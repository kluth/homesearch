/**
 * Market Timing & Price Prediction AI
 * Predictive analytics for optimal buy/sell timing and price forecasting
 * Pain Point: 62% of buyers/sellers wonder if they're buying/selling at the right time
 * Differentiator: ML-powered market cycle analysis and price predictions
 */

import { z } from 'zod';

// ============================================================================
// MARKET CYCLE ANALYSIS
// ============================================================================

/**
 * Real estate market cycle analysis
 */
export const MarketCycleAnalysisSchema = z.object({
  id: z.string(),
  marketId: z.string(), // City/metro area
  marketName: z.string(),

  // Current cycle phase
  currentPhase: z.enum([
    'recovery', // Bottom - prices rising, inventory high, good buyer opportunity
    'expansion', // Prices rising, inventory falling, demand increasing
    'hyper_supply', // Peak - prices high, new construction flooding market
    'recession', // Prices falling, inventory rising, seller market weakening
  ]),

  phaseProgress: z.number().min(0).max(100), // % through current phase

  // Phase characteristics
  phaseDetails: z.object({
    priceDirection: z.enum(['falling', 'flat', 'rising_slowly', 'rising', 'rising_rapidly']),
    inventoryLevel: z.enum(['very_low', 'low', 'balanced', 'high', 'very_high']),
    demandLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
    competitionLevel: z.enum(['low', 'moderate', 'high', 'extreme']),

    monthsOfSupply: z.number(), // < 3 = seller's, 3-6 = balanced, > 6 = buyer's
    marketType: z.enum(['extreme_sellers', 'sellers', 'balanced', 'buyers', 'extreme_buyers']),
  }),

  // Historical context
  historicalContext: z.object({
    timeInCurrentPhase: z.number(), // Months
    averagePhaseDuration: z.number(), // Months for this phase historically

    lastPeakDate: z.date().optional(),
    lastBottomDate: z.date().optional(),

    // Comparison to last cycle
    vsLastCycle: z.object({
      priceGrowthComparison: z.number(), // Percentage points
      phaseDurationComparison: z.number(), // Months longer/shorter
    }).optional(),
  }),

  // Leading indicators
  leadingIndicators: z.array(z.object({
    indicator: z.enum([
      'new_listings',
      'price_reductions',
      'days_on_market',
      'sale_to_list_ratio',
      'pending_sales',
      'mortgage_applications',
      'builder_permits',
      'consumer_confidence',
    ]),
    value: z.number(),
    trend: z.enum(['declining', 'stable', 'rising']),
    signal: z.enum(['negative', 'neutral', 'positive']),
  })),

  // Forecast
  forecast: z.object({
    expectedNextPhase: z.enum(['recovery', 'expansion', 'hyper_supply', 'recession']),
    timeToNextPhase: z.number(), // Months
    confidenceInterval: z.object({
      shortest: z.number(), // Months
      longest: z.number(),
    }),
    confidence: z.enum(['low', 'medium', 'high']),
  }),

  // Market momentum
  momentum: z.object({
    score: z.number().min(-100).max(100), // Negative = weakening, Positive = strengthening
    direction: z.enum(['weakening', 'neutral', 'strengthening']),
    acceleration: z.enum(['decelerating', 'steady', 'accelerating']),
  }),

  lastUpdated: z.date(),
});

export type MarketCycleAnalysis = z.infer<typeof MarketCycleAnalysisSchema>;

// ============================================================================
// PRICE PREDICTION
// ============================================================================

/**
 * ML-powered property price prediction
 */
export const PricePredictionSchema = z.object({
  id: z.string(),
  propertyId: z.string().optional(),
  address: z.string(),

  // Current price estimate
  currentValue: z.object({
    estimate: z.number(),
    confidenceInterval: z.object({
      low: z.number(),
      high: z.number(),
    }),
    confidence: z.enum(['low', 'medium', 'high', 'very_high']),

    // Model ensemble (multiple AVMs)
    modelEstimates: z.array(z.object({
      model: z.enum(['zillow', 'redfin', 'realtor', 'corelogic', 'proprietary_ml']),
      estimate: z.number(),
      lastUpdated: z.date(),
    })),

    // Comparable sales
    recentComps: z.array(z.object({
      address: z.string(),
      salePrice: z.number(),
      saleDate: z.date(),
      similarity: z.number().min(0).max(100), // ML similarity score
      pricePerSqft: z.number(),
    })).optional(),
  }),

  // Future predictions
  predictions: z.object({
    // Short term
    threeMonth: z.object({
      estimate: z.number(),
      change: z.number(), // Dollar amount
      changePercent: z.number(),
      confidenceInterval: z.object({
        low: z.number(),
        high: z.number(),
      }),
    }),

    sixMonth: z.object({
      estimate: z.number(),
      change: z.number(),
      changePercent: z.number(),
      confidenceInterval: z.object({
        low: z.number(),
        high: z.number(),
      }),
    }),

    oneYear: z.object({
      estimate: z.number(),
      change: z.number(),
      changePercent: z.number(),
      confidenceInterval: z.object({
        low: z.number(),
        high: z.number(),
      }),
    }),

    // Long term
    threeYear: z.object({
      estimate: z.number(),
      change: z.number(),
      changePercent: z.number(),
      annualizedReturn: z.number(),
    }).optional(),

    fiveYear: z.object({
      estimate: z.number(),
      change: z.number(),
      changePercent: z.number(),
      annualizedReturn: z.number(),
    }).optional(),
  }),

  // Factors driving prediction
  priceDrivers: z.array(z.object({
    factor: z.enum([
      'market_appreciation',
      'neighborhood_growth',
      'new_development',
      'school_ratings',
      'transit_access',
      'amenity_growth',
      'supply_demand',
      'interest_rates',
      'economic_growth',
      'migration_patterns',
    ]),
    impact: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']),
    weight: z.number().min(0).max(1), // Contribution to prediction
  })),

  // Scenarios
  scenarios: z.object({
    bullCase: z.object({
      oneYearPrice: z.number(),
      threeYearPrice: z.number(),
      assumptions: z.array(z.string()),
      probability: z.number().min(0).max(1),
    }),

    baseCase: z.object({
      oneYearPrice: z.number(),
      threeYearPrice: z.number(),
      assumptions: z.array(z.string()),
      probability: z.number().min(0).max(1),
    }),

    bearCase: z.object({
      oneYearPrice: z.number(),
      threeYearPrice: z.number(),
      assumptions: z.array(z.string()),
      probability: z.number().min(0).max(1),
    }),
  }),

  // Model performance
  modelMetrics: z.object({
    historicalAccuracy: z.number().optional(), // % within prediction interval
    meanAbsoluteError: z.number().optional(), // Average $ error
    lastCalibrationDate: z.date().optional(),
  }).optional(),

  generatedAt: z.date(),
});

export type PricePrediction = z.infer<typeof PricePredictionSchema>;

// ============================================================================
// OPTIMAL TIMING RECOMMENDATION
// ============================================================================

/**
 * Buy/sell timing recommendations
 */
export const TimingRecommendationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),
  marketId: z.string(),

  // User intent
  intent: z.enum(['buying', 'selling', 'both']),

  // For buyers
  buyerAnalysis: z.object({
    // Current conditions
    currentMarketCondition: z.enum(['terrible', 'poor', 'fair', 'good', 'excellent']),

    // Timing recommendation
    recommendation: z.enum([
      'buy_now', // Optimal time
      'good_time', // Favorable conditions
      'neutral', // Not particularly good or bad
      'wait_if_possible', // Better opportunities likely coming
      'wait', // Unfavorable conditions
    ]),

    reasoning: z.string(),

    // Specific considerations
    considerations: z.object({
      priceLevel: z.enum(['low', 'moderate', 'high', 'peak']),
      competition: z.enum(['low', 'moderate', 'high', 'extreme']),
      inventory: z.enum(['low', 'moderate', 'high']),
      interestRates: z.enum(['low', 'moderate', 'high', 'very_high']),

      affordabilityIndex: z.number().optional(), // 100 = avg, <100 = less affordable
    }),

    // Timing scenarios
    ifBuyNow: z.object({
      expectedOneYearValue: z.number().optional(),
      expectedThreeYearValue: z.number().optional(),
      expectedROI: z.number(),
      risk: z.enum(['low', 'moderate', 'high']),
    }),

    ifWait: z.object({
      expectedPriceChange: z.number(), // Percentage (could be negative)
      expectedRateChange: z.number(), // Percentage points
      netAffordabilityChange: z.number(), // Total cost impact
      optimalWaitPeriod: z.number().optional(), // Months
    }).optional(),

    // Key insights
    keyInsights: z.array(z.string()),
  }).optional(),

  // For sellers
  sellerAnalysis: z.object({
    // Current conditions
    currentMarketCondition: z.enum(['terrible', 'poor', 'fair', 'good', 'excellent']),

    // Timing recommendation
    recommendation: z.enum([
      'sell_now', // Optimal time
      'good_time', // Favorable conditions
      'neutral', // Not particularly good or bad
      'wait_if_possible', // Better opportunities likely coming
      'wait', // Unfavorable conditions
    ]),

    reasoning: z.string(),

    // Specific considerations
    considerations: z.object({
      demandLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
      daysOnMarket: z.number(), // Average for area
      saleToListRatio: z.number(), // % of list price achieved
      bidWars: z.boolean(), // Multiple offers common
      seasonality: z.enum(['off_season', 'shoulder', 'peak_season']),
    }),

    // Timing scenarios
    ifSellNow: z.object({
      expectedSalePrice: z.number(),
      expectedDaysOnMarket: z.number(),
      expectedSaleToListRatio: z.number(),
      probabilityOfMultipleOffers: z.number().min(0).max(1),
    }),

    ifWait: z.object({
      expectedPriceChange: z.number(), // Percentage
      expectedMarketConditionChange: z.enum(['worse', 'same', 'better']),
      optimalWaitPeriod: z.number().optional(), // Months
      seasonalOptimal: z.string().optional(), // "Spring 2024"
    }).optional(),

    // Listing strategy
    listingStrategy: z.object({
      recommendedListPrice: z.number(),
      pricingStrategy: z.enum(['aggressive', 'market', 'conservative']),
      expectedOutcome: z.string(),
    }).optional(),

    // Key insights
    keyInsights: z.array(z.string()),
  }).optional(),

  // Market outlook
  marketOutlook: z.object({
    threeMonthOutlook: z.enum(['deteriorating', 'stable', 'improving']),
    sixMonthOutlook: z.enum(['deteriorating', 'stable', 'improving']),
    oneYearOutlook: z.enum(['deteriorating', 'stable', 'improving']),

    keyEvents: z.array(z.object({
      event: z.string(),
      expectedDate: z.date().optional(),
      impact: z.enum(['negative', 'neutral', 'positive']),
    })).optional(),
  }),

  generatedAt: z.date(),
  expiresAt: z.date(), // Recommendations expire (update weekly)
});

export type TimingRecommendation = z.infer<typeof TimingRecommendationSchema>;

// ============================================================================
// INTEREST RATE IMPACT ANALYSIS
// ============================================================================

/**
 * Analyze impact of interest rate changes on affordability
 */
export const RateImpactAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  // Property details
  propertyPrice: z.number(),
  downPayment: z.number(),
  loanAmount: z.number(),

  // Current rates
  currentRates: z.object({
    averageRate: z.number(),
    rateRange: z.object({
      best: z.number(),
      average: z.number(),
      worst: z.number(),
    }),
    asOfDate: z.date(),
  }),

  // Rate scenarios
  scenarios: z.array(z.object({
    scenarioName: z.string(),
    interestRate: z.number(),

    // Monthly payment
    monthlyPayment: z.object({
      principalInterest: z.number(),
      taxes: z.number(),
      insurance: z.number(),
      pmi: z.number().optional(),
      hoa: z.number().optional(),
      total: z.number(),
    }),

    // Affordability
    affordability: z.object({
      requiredIncome: z.number(), // At 28% front-end ratio
      vs28PercentRule: z.string(), // "Within budget", "Over budget"
      vs36PercentRule: z.string(), // Including all debt
    }),

    // Total cost
    totalInterestPaid: z.number(), // Over life of loan
    totalCost: z.number(), // Principal + interest
  })),

  // Rate forecasts
  rateForecast: z.object({
    currentRate: z.number(),

    threeMonth: z.object({
      forecast: z.number(),
      direction: z.enum(['down', 'flat', 'up']),
      confidenceInterval: z.object({
        low: z.number(),
        high: z.number(),
      }),
    }),

    sixMonth: z.object({
      forecast: z.number(),
      direction: z.enum(['down', 'flat', 'up']),
      confidenceInterval: z.object({
        low: z.number(),
        high: z.number(),
      }),
    }),

    oneYear: z.object({
      forecast: z.number(),
      direction: z.enum(['down', 'flat', 'up']),
    }),

    // Fed policy
    fedPolicy: z.object({
      currentStance: z.enum(['easing', 'neutral', 'tightening']),
      expectedDirection: z.enum(['lower_rates', 'hold', 'raise_rates']),
      nextMeetingDate: z.date().optional(),
    }).optional(),
  }),

  // Buy now vs wait analysis
  buyNowVsWait: z.object({
    // If buy now at current rate
    buyNow: z.object({
      rate: z.number(),
      monthlyPayment: z.number(),
      totalInterest: z.number(),
    }),

    // If wait for rates to drop
    waitScenario: z.object({
      assumedFutureRate: z.number(),
      monthsToWait: z.number(),
      futureMonthlyPayment: z.number(),
      monthlySavings: z.number(),

      // But price might increase
      assumedPriceIncrease: z.number(), // Percentage
      futurePurchasePrice: z.number(),
      futureLoanAmount: z.number(),
      futureMonthlyPaymentAdjusted: z.number(),

      // Net outcome
      netMonthlySavings: z.number(), // Could be negative
      totalSavingsOverWait: z.number(),
    }),

    recommendation: z.enum(['buy_now', 'wait_for_rates', 'unclear']),
    reasoning: z.string(),
  }),

  // Rate lock analysis (if buying now)
  rateLockAnalysis: z.object({
    recommendedLockPeriod: z.enum(['30_days', '45_days', '60_days', '90_days']),
    reasoning: z.string(),
    floatDownOption: z.boolean(), // Can lower rate if rates drop
  }).optional(),

  generatedAt: z.date(),
});

export type RateImpactAnalysis = z.infer<typeof RateImpactAnalysisSchema>;

// ============================================================================
// BIDDING STRATEGY
// ============================================================================

/**
 * Competitive bidding strategy recommendations
 */
export const BiddingStrategySchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),

  // Property details
  address: z.string(),
  listPrice: z.number(),
  daysOnMarket: z.number(),

  // Market analysis
  marketCondition: z.object({
    competitionLevel: z.enum(['low', 'moderate', 'high', 'extreme']),
    averageOffersPerProperty: z.number(),
    averageSaleToListRatio: z.number(), // 1.05 = selling 5% over asking
    averageDaysOnMarket: z.number(),

    // This specific property
    estimatedInterest: z.enum(['low', 'moderate', 'high', 'very_high']),
    likelyOffers: z.number(), // Estimated number of offers
    probabilityOfBidWar: z.number().min(0).max(1),
  }),

  // Comparable sales
  comparables: z.array(z.object({
    address: z.string(),
    listPrice: z.number(),
    salePrice: z.number(),
    saleToListRatio: z.number(),
    daysOnMarket: z.number(),
    numberOfOffers: z.number().optional(),
    hadMultipleOffers: z.boolean(),
    closedDate: z.date(),
  })),

  // Recommended offer strategy
  offerStrategy: z.object({
    // Price recommendation
    recommendedOfferPrice: z.number(),
    offerAsPercentOfList: z.number(),

    strategy: z.enum([
      'below_asking', // Weak market, try lower
      'at_asking', // Balanced
      'slightly_over_asking', // Competitive
      'strong_over_asking', // Very competitive
      'best_and_highest', // Go all-in
    ]),

    reasoning: z.string(),

    // Price ranges
    priceGuidance: z.object({
      minimumViable: z.number(), // Unlikely to be accepted but possible
      competitive: z.number(), // Competitive offer
      strong: z.number(), // Very likely to win
      ceiling: z.number(), // Don't go above this (fair market value)
    }),
  }),

  // Offer tactics
  tacticRecommendations: z.array(z.object({
    tactic: z.enum([
      'escalation_clause',
      'waive_appraisal_contingency',
      'waive_inspection_contingency',
      'waive_financing_contingency',
      'cash_offer',
      'quick_close',
      'flexible_close_date',
      'cover_sellers_closing_costs',
      'rent_back_to_seller',
      'personal_letter',
      'larger_earnest_money',
      'proof_of_funds',
      'pre_underwritten_approval',
    ]),
    recommended: z.boolean(),
    impact: z.enum(['low', 'moderate', 'high', 'very_high']),
    risk: z.enum(['low', 'moderate', 'high']),
    notes: z.string().optional(),
  })),

  // Escalation clause guidance
  escalationClause: z.object({
    recommended: z.boolean(),
    initialOffer: z.number(),
    escalationAmount: z.number(), // Increment (e.g., $1,000)
    maxPrice: z.number(), // Ceiling
    example: z.string(),
  }).optional(),

  // Contingencies guidance
  contingencies: z.object({
    inspection: z.object({
      recommend: z.enum(['include', 'shorten_period', 'waive']),
      risk: z.string(),
    }),
    appraisal: z.object({
      recommend: z.enum(['include', 'include_with_gap_coverage', 'waive']),
      risk: z.string(),
    }),
    financing: z.object({
      recommend: z.enum(['include', 'shorten_period', 'waive']),
      risk: z.string(),
    }),
  }),

  // Timeline
  timeline: z.object({
    recommendedResponseDeadline: z.number(), // Hours
    recommendedInspectionPeriod: z.number(), // Days
    recommendedClosingPeriod: z.number(), // Days

    urgency: z.enum(['standard', 'moderate', 'high', 'extreme']),
  }),

  // Counter-offer strategy (if applicable)
  counterOfferGuidance: z.object({
    ifCountered: z.string(), // "Accept if within 2% of your max"
    walkawayPrice: z.number(), // Don't go above this
    negotiationLeverage: z.enum(['seller_has_leverage', 'balanced', 'buyer_has_leverage']),
  }).optional(),

  generatedAt: z.date(),
});

export type BiddingStrategy = z.infer<typeof BiddingStrategySchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const MarketIntelligenceSchemas = {
  MarketCycleAnalysis: MarketCycleAnalysisSchema,
  PricePrediction: PricePredictionSchema,
  TimingRecommendation: TimingRecommendationSchema,
  RateImpactAnalysis: RateImpactAnalysisSchema,
  BiddingStrategy: BiddingStrategySchema,
};
