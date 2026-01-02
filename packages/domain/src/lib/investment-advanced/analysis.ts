/**
 * Advanced Investment Analysis
 * Sophisticated real estate investment tools for serious investors
 * Pain Point: Investors lack tools for cash flow modeling, tax optimization, and advanced strategies
 * Revenue Opportunity: Premium investor tier $99-$299/month, professional tier $499/month
 */

import { z } from 'zod';

// ============================================================================
// CASH FLOW MODELING
// ============================================================================

/**
 * Comprehensive cash flow analysis with tax implications
 */
export const InvestmentCashFlowSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),
  analysisName: z.string(),

  // Property acquisition
  acquisition: z.object({
    purchasePrice: z.number(),
    downPayment: z.number(),
    downPaymentPercent: z.number(),
    closingCosts: z.number(),
    rehabCosts: z.number().optional(),
    totalCashInvested: z.number(),

    // Financing
    loanAmount: z.number(),
    interestRate: z.number(),
    loanTerm: z.number(), // Years
    monthlyPrincipalInterest: z.number(),

    // Initial costs
    inspectionCosts: z.number().optional(),
    appraisalCost: z.number().optional(),
    legalFees: z.number().optional(),
  }),

  // Monthly income
  monthlyIncome: z.object({
    baseRent: z.number(),

    // Additional income
    parkingIncome: z.number().optional(),
    storageIncome: z.number().optional(),
    laundryIncome: z.number().optional(),
    petRent: z.number().optional(),
    otherIncome: z.number().optional(),

    totalGrossIncome: z.number(),

    // Vacancy allowance
    vacancyRate: z.number(), // Percentage
    vacancyLoss: z.number(),

    effectiveGrossIncome: z.number(),
  }),

  // Monthly expenses
  monthlyExpenses: z.object({
    // Mortgage
    principalInterest: z.number(),
    pmi: z.number().optional(),

    // Property costs
    propertyTax: z.number(),
    insurance: z.number(),
    hoaFees: z.number().optional(),

    // Operating expenses
    propertyManagement: z.number().optional(), // Usually 8-10% of rent
    maintenance: z.number(), // Usually 1% of property value annually
    repairs: z.number(),
    utilities: z.number().optional(), // If landlord pays
    landscaping: z.number().optional(),
    pestControl: z.number().optional(),

    // Other
    capex: z.number(), // Capital expenditure reserve (roof, HVAC, etc.)
    advertising: z.number().optional(),
    legal: z.number().optional(),
    accounting: z.number().optional(),
    other: z.number().optional(),

    totalExpenses: z.number(),
  }),

  // Monthly cash flow
  monthlyCashFlow: z.object({
    grossIncome: z.number(),
    netOperatingIncome: z.number(), // Income - operating expenses (no debt service)
    cashFlow: z.number(), // NOI - debt service
    cashFlowBeforeTax: z.number(),
    taxImpact: z.number(), // Can be negative (savings)
    cashFlowAfterTax: z.number(),
  }),

  // Annual summary
  annualCashFlow: z.object({
    grossIncome: z.number(),
    netOperatingIncome: z.number(),
    cashFlowBeforeTax: z.number(),
    cashFlowAfterTax: z.number(),
  }),

  // Investment metrics
  metrics: z.object({
    // Cash-on-cash return
    cashOnCashReturn: z.number(), // Annual cash flow / Total cash invested

    // Cap rate
    capRate: z.number(), // NOI / Purchase price

    // ROI
    totalROI: z.number(),
    annualizedROI: z.number(),

    // Debt coverage
    debtServiceCoverageRatio: z.number(), // NOI / Annual debt service

    // Profitability
    grossRentMultiplier: z.number(), // Purchase price / Annual rent
    rentToValue: z.number(), // Monthly rent / Purchase price

    // Break-even
    breakEvenRatio: z.number(), // (Operating expenses + Debt) / Gross income
    breakEvenOccupancy: z.number(), // Percentage
  }),

  // Tax analysis
  taxAnalysis: z.object({
    // Depreciation
    depreciation: z.object({
      buildingValue: z.number(), // Usually 80% of purchase price
      annualDepreciation: z.number(), // Building value / 27.5 years residential
      depreciationBenefit: z.number(), // Tax savings from depreciation
    }),

    // Deductions
    deductions: z.object({
      mortgageInterest: z.number(),
      propertyTax: z.number(),
      insurance: z.number(),
      repairs: z.number(),
      maintenance: z.number(),
      propertyManagement: z.number().optional(),
      utilities: z.number().optional(),
      hoa: z.number().optional(),
      professional: z.number().optional(), // Legal, accounting
      advertising: z.number().optional(),
      depreciation: z.number(),

      totalDeductions: z.number(),
    }),

    // Tax impact
    taxableIncome: z.number(), // Rental income - deductions
    taxBracket: z.number(), // User's marginal tax rate
    taxLiability: z.number(), // Can be negative
    effectiveTaxRate: z.number(),

    // Passive loss rules
    passiveLossLimitation: z.object({
      applies: z.boolean(),
      carriedForwardLosses: z.number().optional(),
    }).optional(),
  }),

  // Year-by-year projections
  yearlyProjections: z.array(z.object({
    year: z.number(),

    // Income growth
    rentGrowth: z.number(), // Percentage
    grossIncome: z.number(),
    netOperatingIncome: z.number(),

    // Expenses
    expenseGrowth: z.number(), // Percentage
    totalExpenses: z.number(),

    // Loan paydown
    loanBalance: z.number(),
    principalPaid: z.number(),
    interestPaid: z.number(),

    // Appreciation
    propertyValue: z.number(),
    appreciation: z.number(),
    totalEquity: z.number(),

    // Cash flow
    cashFlowBeforeTax: z.number(),
    cashFlowAfterTax: z.number(),

    // Cumulative
    cumulativeCashFlow: z.number(),
    cumulativeEquity: z.number(),
    totalReturn: z.number(),
  })),

  // Exit scenario
  exitScenario: z.object({
    yearsHeld: z.number(),
    salePrice: z.number(),
    saleExpenses: z.number(), // Agent fees, closing costs (6-8%)

    // Capital gains
    capitalGains: z.object({
      totalGain: z.number(),
      depreciationRecapture: z.number(),
      longTermCapitalGain: z.number(),

      // Tax rates
      recaptureTaxRate: z.number(), // 25% for depreciation recapture
      capitalGainsTaxRate: z.number(), // 0%, 15%, or 20%
      stateTaxRate: z.number().optional(),

      totalTaxOwed: z.number(),
    }),

    netProceeds: z.number(),
    totalProfit: z.number(),
    totalROI: z.number(),
    annualizedReturn: z.number(),
  }).optional(),

  // Assumptions
  assumptions: z.object({
    appreciationRate: z.number(), // Annual %
    rentGrowthRate: z.number(), // Annual %
    expenseGrowthRate: z.number(), // Annual %
    vacancyRate: z.number(), // %
    maintenanceRate: z.number(), // % of property value
    capexRate: z.number(), // % of property value
  }),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type InvestmentCashFlow = z.infer<typeof InvestmentCashFlowSchema>;

// ============================================================================
// 1031 EXCHANGE PLANNING
// ============================================================================

/**
 * 1031 exchange (like-kind exchange) planning and tracking
 */
export const Exchange1031Schema = z.object({
  id: z.string(),
  userId: z.string(),

  // Exchange status
  status: z.enum([
    'planning',
    'relinquished_property_listed',
    'relinquished_property_under_contract',
    'relinquished_property_sold',
    'identification_period',
    'replacement_property_identified',
    'replacement_property_under_contract',
    'exchange_completed',
    'failed',
  ]),

  // Type of exchange
  exchangeType: z.enum([
    'delayed', // Most common
    'simultaneous',
    'reverse', // Buy replacement before selling
    'improvement', // Build on replacement property
  ]),

  // Relinquished property (selling)
  relinquishedProperty: z.object({
    propertyId: z.string().optional(),
    address: z.string(),
    purchasePrice: z.number(),
    purchaseDate: z.date(),
    currentValue: z.number(),

    // Sale details
    listedDate: z.date().optional(),
    listingPrice: z.number().optional(),
    salePrice: z.number().optional(),
    saleDate: z.date().optional(),
    closingDate: z.date().optional(),

    // Financials
    currentLoanBalance: z.number(),
    totalEquity: z.number(),
    estimatedSaleExpenses: z.number(),
    netProceeds: z.number(),

    // Tax basis
    adjustedCostBasis: z.number(),
    depreciationTaken: z.number(),
    capitalGain: z.number(),
    deferredTaxes: z.number(),
  }),

  // Important deadlines
  deadlines: z.object({
    // Sale date of relinquished property starts the clock
    relinquishedPropertySaleDate: z.date().optional(),

    // 45-day identification period
    identificationDeadline: z.date().optional(), // 45 days from sale
    identificationDeadlineMet: z.boolean(),

    // 180-day exchange period
    exchangeDeadline: z.date().optional(), // 180 days from sale or tax return due date, whichever is earlier
    daysRemaining: z.number().optional(),
  }),

  // Replacement property identification (can identify up to 3 properties)
  identifiedProperties: z.array(z.object({
    id: z.string(),
    address: z.string(),
    purchasePrice: z.number(),
    identifiedDate: z.date(),
    status: z.enum(['identified', 'under_contract', 'purchased', 'fell_through']),

    // Property details
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    sqft: z.number().optional(),

    // Financing
    downPayment: z.number(),
    loanAmount: z.number(),

    // Notes
    notes: z.string().optional(),
  })),

  // Replacement property (buying)
  replacementProperty: z.object({
    propertyId: z.string().optional(),
    address: z.string().optional(),
    purchasePrice: z.number().optional(),
    closingDate: z.date().optional(),

    // Must meet requirements
    equalOrGreaterValue: z.boolean(), // Must be equal or greater value
    reinvestAllProceeds: z.boolean(), // Must reinvest all proceeds
    noBootReceived: z.boolean(), // Boot = cash/property received (taxable)
  }).optional(),

  // Qualified intermediary
  qualifiedIntermediary: z.object({
    required: z.boolean(), // Always required for delayed exchanges
    name: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    contractSigned: z.boolean(),
  }),

  // Financial analysis
  financialAnalysis: z.object({
    // Must reinvest
    minimumReinvestment: z.number(), // Must equal or exceed net proceeds
    minimumReplacementValue: z.number(), // Must equal or exceed sale price

    // Boot (taxable portion)
    cashBoot: z.number(), // Cash received
    mortgageBoot: z.number(), // Debt reduction
    totalBoot: z.number(),
    taxOnBoot: z.number(),

    // Deferred taxes
    capitalGainDeferred: z.number(),
    depreciationRecaptureDeferred: z.number(),
    totalTaxDeferred: z.number(),

    // New basis
    replacementPropertyBasis: z.number(), // Carried-over basis + additional investment
  }).optional(),

  // Compliance requirements
  compliance: z.object({
    likeKindProperty: z.boolean(), // Real property for real property
    heldForInvestment: z.boolean(), // Not primary residence (unless partial 121/1031)
    noRelatedParty: z.boolean(), // Can't exchange with related party
    qualifiedIntermediaryUsed: z.boolean(),
    proceedsHeldByQI: z.boolean(), // Cannot touch proceeds
  }),

  // Alerts & warnings
  alerts: z.array(z.object({
    severity: z.enum(['info', 'warning', 'critical']),
    message: z.string(),
    actionRequired: z.string().optional(),
  })).optional(),

  // Document checklist
  documents: z.array(z.object({
    documentType: z.enum([
      'qi_agreement',
      'assignment_agreement',
      'identification_notice',
      'settlement_statement_relinquished',
      'settlement_statement_replacement',
      'title_reports',
      'tax_documentation',
    ]),
    uploaded: z.boolean(),
    uploadedDate: z.date().optional(),
  })).optional(),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type Exchange1031 = z.infer<typeof Exchange1031Schema>;

// ============================================================================
// BRRRR STRATEGY ANALYSIS
// ============================================================================

/**
 * BRRRR Strategy: Buy, Rehab, Rent, Refinance, Repeat
 */
export const BRRRRStrategySchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  // Strategy phase
  currentPhase: z.enum(['buy', 'rehab', 'rent', 'refinance', 'repeat', 'hold']),

  // Phase 1: Buy
  buy: z.object({
    purchasePrice: z.number(),
    purchaseDate: z.date().optional(),
    closingCosts: z.number(),

    // Initial financing (usually hard money or cash)
    initialLoan: z.object({
      loanType: z.enum(['hard_money', 'private_money', 'cash', 'conventional_purchase']),
      loanAmount: z.number(),
      interestRate: z.number(),
      loanTerm: z.number(), // Months
      monthlyPayment: z.number(),
      points: z.number().optional(),
    }).optional(),

    cashInvested: z.number(),
    marketValue: z.number(), // Before rehab (ARV assessment)
    discount: z.number(), // Purchase price vs market value
  }),

  // Phase 2: Rehab
  rehab: z.object({
    budgetedCost: z.number(),
    actualCost: z.number().optional(),

    startDate: z.date().optional(),
    completionDate: z.date().optional(),
    estimatedDuration: z.number(), // Days

    // Holding costs during rehab
    holdingCosts: z.object({
      loanInterest: z.number(),
      propertyTax: z.number(),
      insurance: z.number(),
      utilities: z.number(),
      other: z.number().optional(),
      totalHoldingCosts: z.number(),
    }),

    // Rehab scope
    scopeOfWork: z.array(z.object({
      item: z.string(),
      budgetedCost: z.number(),
      actualCost: z.number().optional(),
      completed: z.boolean(),
    })).optional(),

    // ARV impact
    beforeRehabValue: z.number(),
    afterRepairValue: z.number(), // ARV
    valueAdded: z.number(),
  }),

  // Phase 3: Rent
  rent: z.object({
    // Rent analysis
    marketRent: z.number(),
    targetRent: z.number(),
    actualRent: z.number().optional(),

    // Tenant placement
    tenantScreeningCost: z.number().optional(),
    leasingCost: z.number().optional(),
    leaseStartDate: z.date().optional(),

    // Seasoning period (many lenders require 6-12 months rental history)
    seasoningRequired: z.number(), // Months
    seasoningMet: z.boolean(),
    rentalHistoryMonths: z.number().optional(),

    // Cash flow during rent phase
    monthlyIncome: z.number(),
    monthlyExpenses: z.number(),
    monthlyCashFlow: z.number(),
  }),

  // Phase 4: Refinance
  refinance: z.object({
    // New loan (cash-out refinance)
    newLoan: z.object({
      loanType: z.enum(['conventional', 'portfolio', 'dscr', 'other']),
      afterRepairValue: z.number(),
      loanToValueMax: z.number(), // Usually 75-80% for investment property
      maxLoanAmount: z.number(),
      targetLoanAmount: z.number(),

      interestRate: z.number(),
      loanTerm: z.number(), // Years
      monthlyPayment: z.number(),
    }),

    // Refinance costs
    appraisalCost: z.number(),
    closingCosts: z.number(),
    totalRefinanceCosts: z.number(),

    // Cash-out analysis
    payoffOldLoan: z.number(),
    cashOutAmount: z.number(),
    capitalRecovered: z.number(), // Cash returned to investor

    // New cash flow
    newMonthlyCashFlow: z.number(),

    refinanceDate: z.date().optional(),
  }).optional(),

  // Overall BRRRR analysis
  analysis: z.object({
    // Total investment
    purchasePrice: z.number(),
    rehabCosts: z.number(),
    closingCosts: z.number(),
    holdingCosts: z.number(),
    refinanceCosts: z.number(),
    totalInvested: z.number(),

    // Capital recovered
    capitalRecovered: z.number(), // From refinance
    capitalLeftIn: z.number(), // Total invested - recovered
    percentRecovered: z.number(),

    // Infinite return scenario
    infiniteReturn: z.boolean(), // If 100%+ capital recovered
    cashOnCashReturn: z.number(), // Annual cash flow / capital left in

    // Equity created
    propertyValue: z.number(), // ARV
    loanBalance: z.number(),
    totalEquity: z.number(),
    equityPercent: z.number(),

    // ROI
    totalROI: z.number(),
    annualizedROI: z.number(),

    // Deal quality
    dealQuality: z.enum(['poor', 'fair', 'good', 'great', 'home_run']),
    recommendation: z.string(),
  }),

  // Risks & considerations
  risks: z.array(z.object({
    category: z.enum(['market', 'rehab', 'financing', 'tenant', 'timing']),
    risk: z.string(),
    mitigation: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })).optional(),

  // Repeat strategy
  repeatPlan: z.object({
    capitalAvailableForNext: z.number(),
    targetNextPurchase: z.number(),
    scalingStrategy: z.string().optional(),
  }).optional(),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type BRRRRStrategy = z.infer<typeof BRRRRStrategySchema>;

// ============================================================================
// MULTI-PROPERTY COMPARISON
// ============================================================================

/**
 * Compare multiple investment properties side-by-side
 */
export const InvestmentComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  comparisonName: z.string(),

  properties: z.array(z.object({
    propertyId: z.string().optional(),
    address: z.string(),

    // Purchase
    purchasePrice: z.number(),
    downPayment: z.number(),
    cashInvested: z.number(),

    // Income
    monthlyRent: z.number(),
    annualGrossIncome: z.number(),

    // Expenses
    monthlyExpenses: z.number(),
    annualExpenses: z.number(),

    // Cash flow
    monthlyCashFlow: z.number(),
    annualCashFlow: z.number(),

    // Metrics
    cashOnCashReturn: z.number(),
    capRate: z.number(),
    debtServiceCoverageRatio: z.number(),
    totalROI: z.number(),

    // Appreciation
    appreciationRate: z.number(),
    year5Value: z.number(),
    year10Value: z.number(),

    // Risk factors
    riskScore: z.number().min(0).max(100).optional(),
    marketStrength: z.enum(['weak', 'stable', 'growing', 'hot']).optional(),

    // Notes
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
  })),

  // Ranking
  rankedBy: z.enum(['cash_flow', 'cash_on_cash', 'total_return', 'cap_rate', 'custom']).optional(),
  topPick: z.string().optional(), // Property address

  // Recommendation
  recommendation: z.object({
    recommendedProperty: z.string(),
    reasoning: z.string(),
    alternativeOption: z.string().optional(),
  }).optional(),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type InvestmentComparison = z.infer<typeof InvestmentComparisonSchema>;

// ============================================================================
// INVESTOR PORTFOLIO ANALYTICS
// ============================================================================

/**
 * Advanced analytics across investor's entire portfolio
 */
export const PortfolioAnalyticsSchema = z.object({
  userId: z.string(),

  // Portfolio summary
  summary: z.object({
    totalProperties: z.number(),
    totalValue: z.number(),
    totalEquity: z.number(),
    totalDebt: z.number(),
    averageLTV: z.number(),

    // Cash flow
    monthlyGrossIncome: z.number(),
    monthlyNetIncome: z.number(),
    annualNetIncome: z.number(),

    // Returns
    portfolioCashOnCashReturn: z.number(),
    portfolioCapRate: z.number(),
    totalROI: z.number(),
    annualizedReturn: z.number(),
  }),

  // Diversification
  diversification: z.object({
    byPropertyType: z.array(z.object({
      type: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'commercial']),
      count: z.number(),
      percentOfPortfolio: z.number(),
      totalValue: z.number(),
    })),

    byMarket: z.array(z.object({
      market: z.string(), // City or metro area
      count: z.number(),
      percentOfPortfolio: z.number(),
      totalValue: z.number(),
    })),

    diversificationScore: z.number().min(0).max(100), // Higher = more diversified
  }),

  // Risk analysis
  riskMetrics: z.object({
    concentrationRisk: z.enum(['low', 'moderate', 'high']), // Too much in one market/type
    vacancyRisk: z.number(), // Current vacancy rate
    debtRisk: z.enum(['low', 'moderate', 'high']), // Based on LTV and DSCR
    marketRisk: z.enum(['low', 'moderate', 'high']), // Market conditions

    overallRisk: z.enum(['conservative', 'moderate', 'aggressive', 'very_aggressive']),
  }),

  // Growth projections
  projections: z.object({
    year1: z.object({
      portfolioValue: z.number(),
      totalEquity: z.number(),
      annualCashFlow: z.number(),
    }),
    year5: z.object({
      portfolioValue: z.number(),
      totalEquity: z.number(),
      annualCashFlow: z.number(),
    }),
    year10: z.object({
      portfolioValue: z.number(),
      totalEquity: z.number(),
      annualCashFlow: z.number(),
    }),
  }),

  // Tax optimization
  taxStrategy: z.object({
    annualDepreciation: z.number(),
    taxSavingsFromDepreciation: z.number(),
    recommendedStrategies: z.array(z.enum([
      'cost_segregation_study',
      '1031_exchange',
      'opportunity_zones',
      'real_estate_professional_status',
      'bonus_depreciation',
    ])).optional(),
  }),

  // Recommendations
  recommendations: z.array(z.object({
    category: z.enum(['acquisition', 'disposition', 'optimization', 'risk_management']),
    recommendation: z.string(),
    expectedImpact: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional(),

  lastUpdated: z.date(),
});

export type PortfolioAnalytics = z.infer<typeof PortfolioAnalyticsSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const InvestmentAdvancedSchemas = {
  InvestmentCashFlow: InvestmentCashFlowSchema,
  Exchange1031: Exchange1031Schema,
  BRRRRStrategy: BRRRRStrategySchema,
  InvestmentComparison: InvestmentComparisonSchema,
  PortfolioAnalytics: PortfolioAnalyticsSchema,
};
