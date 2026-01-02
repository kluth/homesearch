/**
 * Homeownership Management
 * Complete post-purchase home management - the forgotten stage
 * Pain Point: 78% of homeowners feel overwhelmed by maintenance, 56% defer critical repairs
 * Average homeowner spends $9,000/year on maintenance but lacks tracking/planning
 */

import { z } from 'zod';

// ============================================================================
// HOME MAINTENANCE TRACKING
// ============================================================================

/**
 * Home maintenance task library and scheduling
 */
export const MaintenanceTaskSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Task details
  taskName: z.string(),
  category: z.enum([
    'hvac',
    'plumbing',
    'electrical',
    'roofing',
    'gutters',
    'landscaping',
    'appliances',
    'painting',
    'flooring',
    'windows_doors',
    'foundation',
    'pest_control',
    'safety',
    'seasonal',
    'other',
  ]),

  // Description & instructions
  description: z.string(),
  instructions: z.string().optional(),
  estimatedDuration: z.number().optional(), // Hours
  skillLevel: z.enum(['easy_diy', 'moderate_diy', 'professional_required']),

  // Scheduling
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'semi_annual', 'annual', 'biennial', 'as_needed']),
  nextDueDate: z.date(),
  lastCompletedDate: z.date().optional(),

  // Priority
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  isOverdue: z.boolean(),
  daysOverdue: z.number().optional(),

  // Cost
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),

  // Completion tracking
  status: z.enum(['upcoming', 'due_soon', 'overdue', 'in_progress', 'completed', 'skipped']),
  completedBy: z.enum(['owner_diy', 'professional', 'skipped']).optional(),
  professionalUsed: z.object({
    providerId: z.string(),
    name: z.string(),
    cost: z.number(),
  }).optional(),

  // Completion details
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),
  completedDate: z.date().optional(),

  // Reminders
  reminders: z.array(z.object({
    daysBeforeDue: z.number(),
    sent: z.boolean(),
    sentAt: z.date().optional(),
  })).optional(),

  // Linked warranty/appliance
  linkedWarrantyId: z.string().optional(),
  linkedApplianceId: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type MaintenanceTask = z.infer<typeof MaintenanceTaskSchema>;

/**
 * Seasonal maintenance checklist
 */
export const SeasonalMaintenanceSchema = z.object({
  propertyId: z.string(),
  userId: z.string(),
  season: z.enum(['spring', 'summer', 'fall', 'winter']),
  year: z.number(),

  // Tasks for this season
  tasks: z.array(z.object({
    taskName: z.string(),
    category: z.string(),
    priority: z.enum(['essential', 'recommended', 'optional']),
    completed: z.boolean(),
    completedDate: z.date().optional(),
    estimatedCost: z.number().optional(),
    notes: z.string().optional(),
  })),

  // Progress
  totalTasks: z.number(),
  completedTasks: z.number(),
  completionPercentage: z.number().min(0).max(100),

  // Cost tracking
  budgetedCost: z.number().optional(),
  actualCost: z.number().optional(),

  generatedAt: z.date(),
});

export type SeasonalMaintenance = z.infer<typeof SeasonalMaintenanceSchema>;

// ============================================================================
// APPLIANCE & WARRANTY TRACKING
// ============================================================================

/**
 * Home appliance inventory with warranties
 */
export const ApplianceInventorySchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Appliance details
  applianceType: z.enum([
    'refrigerator',
    'oven',
    'cooktop',
    'dishwasher',
    'microwave',
    'garbage_disposal',
    'washer',
    'dryer',
    'water_heater',
    'hvac_furnace',
    'hvac_ac',
    'heat_pump',
    'garage_door_opener',
    'sump_pump',
    'water_softener',
    'dehumidifier',
    'other',
  ]),

  // Product information
  brand: z.string(),
  model: z.string(),
  serialNumber: z.string().optional(),
  color: z.string().optional(),

  // Purchase details
  purchaseDate: z.date(),
  purchasePrice: z.number(),
  purchaseStore: z.string().optional(),
  receiptPhoto: z.string().url().optional(),

  // Age tracking
  ageYears: z.number(),
  expectedLifespan: z.number(), // Years
  percentLifeRemaining: z.number().min(0).max(100),

  // Warranty information
  warranty: z.object({
    manufacturerWarranty: z.object({
      active: z.boolean(),
      yearsOriginal: z.number(),
      expirationDate: z.date(),
      coverage: z.string().optional(), // "Parts and labor", "Parts only"
    }),

    extendedWarranty: z.object({
      hasExtended: z.boolean(),
      provider: z.string().optional(),
      expirationDate: z.date().optional(),
      cost: z.number().optional(),
      coverage: z.string().optional(),
    }).optional(),

    homeWarrantyCovers: z.boolean(), // Covered by home warranty plan
  }),

  // Maintenance history
  maintenanceRecords: z.array(z.object({
    date: z.date(),
    type: z.enum(['routine_maintenance', 'repair', 'professional_service']),
    description: z.string(),
    cost: z.number(),
    performedBy: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
  })).optional(),

  // Manual & documentation
  manualUrl: z.string().url().optional(),
  manualUploaded: z.boolean().default(false),

  // Replacement planning
  replacementPriority: z.enum(['immediate', 'within_year', 'within_3years', 'future', 'working_fine']),
  replacementBudget: z.number().optional(),

  // Energy efficiency
  energyStarRated: z.boolean().optional(),
  estimatedAnnualEnergyCost: z.number().optional(),

  // Status
  status: z.enum(['working', 'needs_repair', 'needs_replacement', 'under_warranty_repair']),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type ApplianceInventory = z.infer<typeof ApplianceInventorySchema>;

// ============================================================================
// HOME VALUE & EQUITY TRACKING
// ============================================================================

/**
 * Automated home value tracking and equity monitoring
 */
export const HomeValueTrackingSchema = z.object({
  propertyId: z.string(),
  userId: z.string(),

  // Purchase information
  purchasePrice: z.number(),
  purchaseDate: z.date(),
  downPayment: z.number(),

  // Current value estimates
  currentValue: z.object({
    estimate: z.number(),
    confidenceInterval: z.object({
      low: z.number(),
      high: z.number(),
    }),
    lastUpdated: z.date(),

    // Multiple estimates (AVM models)
    estimates: z.array(z.object({
      source: z.enum(['zillow', 'redfin', 'realtor', 'corelogic', 'proprietary']),
      value: z.number(),
      asOfDate: z.date(),
    })).optional(),
  }),

  // Value history
  valueHistory: z.array(z.object({
    date: z.date(),
    value: z.number(),
    source: z.string(),
  })),

  // Appreciation tracking
  appreciation: z.object({
    totalDollars: z.number(), // Total appreciation since purchase
    totalPercent: z.number(),
    annualizedPercent: z.number(),

    // Comparisons
    vsNeighborhood: z.object({
      neighborhoodAppreciation: z.number(),
      outperformance: z.number(), // +/- percentage points
    }).optional(),

    vsCity: z.object({
      cityAppreciation: z.number(),
      outperformance: z.number(),
    }).optional(),
  }),

  // Equity tracking
  equity: z.object({
    totalEquity: z.number(),
    equityPercent: z.number(), // Equity / current value * 100
    loanToValue: z.number(), // Remaining loan / current value * 100

    // Equity breakdown
    downPaymentEquity: z.number(),
    principalPaydownEquity: z.number(),
    appreciationEquity: z.number(),
    improvementEquity: z.number().optional(), // From documented improvements
  }),

  // Mortgage details
  mortgage: z.object({
    originalLoanAmount: z.number(),
    currentBalance: z.number(),
    interestRate: z.number(),
    monthlyPayment: z.number(),
    remainingYears: z.number(),

    // Payoff tracking
    principalPaidToDate: z.number(),
    interestPaidToDate: z.number(),
    estimatedPayoffDate: z.date(),

    // Early payoff scenarios
    payoffScenarios: z.array(z.object({
      extraMonthlyPayment: z.number(),
      newPayoffDate: z.date(),
      interestSaved: z.number(),
      yearsShaved: z.number(),
    })).optional(),
  }).optional(),

  // Improvement tracking (adds to equity)
  improvements: z.array(z.object({
    date: z.date(),
    description: z.string(),
    cost: z.number(),
    estimatedValueAdd: z.number(),
    category: z.enum(['kitchen', 'bathroom', 'addition', 'landscaping', 'roofing', 'hvac', 'other']),
  })).optional(),

  // Refinance opportunities
  refinanceOpportunity: z.object({
    currentRateVsMarket: z.number(), // Percentage points difference
    potentialSavings: z.number(), // Monthly
    breakEvenMonths: z.number(),
    recommended: z.boolean(),
    reasoning: z.string(),
  }).optional(),

  lastUpdated: z.date(),
});

export type HomeValueTracking = z.infer<typeof HomeValueTrackingSchema>;

// ============================================================================
// HOME IMPROVEMENT ROI CALCULATOR
// ============================================================================

/**
 * ROI calculator for home improvements
 */
export const ImprovementROISchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Improvement details
  improvementType: z.enum([
    'kitchen_remodel_minor',
    'kitchen_remodel_major',
    'bathroom_remodel',
    'bathroom_addition',
    'master_suite_addition',
    'bedroom_addition',
    'family_room_addition',
    'sunroom_addition',
    'deck_addition',
    'patio_addition',
    'pool_installation',
    'landscaping',
    'siding_replacement',
    'window_replacement',
    'door_replacement',
    'roofing_replacement',
    'hvac_replacement',
    'flooring_replacement',
    'painting_interior',
    'painting_exterior',
    'basement_finishing',
    'attic_conversion',
    'garage_addition',
    'solar_panels',
    'smart_home_upgrades',
    'other',
  ]),

  improvementName: z.string(),
  description: z.string().optional(),

  // Cost analysis
  costs: z.object({
    estimatedCost: z.number(),
    lowEstimate: z.number(),
    highEstimate: z.number(),

    breakdown: z.array(z.object({
      item: z.string(),
      cost: z.number(),
    })).optional(),

    financingNeeded: z.boolean(),
    financingCost: z.number().optional(), // Interest over life of loan
  }),

  // Value add analysis
  valueAdded: z.object({
    estimatedValueIncrease: z.number(),
    roiPercentage: z.number(), // (Value added - Cost) / Cost * 100

    // National averages
    nationalAverageROI: z.number().optional(),
    vsNationalAverage: z.number().optional(), // +/- percentage points

    // Local market
    localMarketROI: z.number().optional(),
  }),

  // Recoup analysis
  recoupAnalysis: z.object({
    costRecoupPercentage: z.number(), // % of cost recouped at sale
    netGain: z.number(), // Value added - Cost
    breakevenYears: z.number().optional(), // Years to break even if including financing

    // At sale
    expectedRecoupAtSale: z.number(), // Dollars recouped when selling
    timeHorizon: z.enum(['immediate_sale', '1_2_years', '3_5_years', '5_10_years', 'long_term']),
  }),

  // Other benefits
  nonMonetaryBenefits: z.object({
    energySavings: z.number().optional(), // Annual $ saved
    qualityOfLife: z.enum(['minimal', 'moderate', 'significant', 'transformative']).optional(),
    maintenanceReduction: z.number().optional(), // Annual $ saved
    insuranceSavings: z.number().optional(), // Annual $ saved
  }).optional(),

  // Timing
  bestTimingToComplete: z.enum(['before_selling', 'for_enjoyment', 'deferred_maintenance', 'no_rush']),
  urgency: z.enum(['critical', 'important', 'nice_to_have', 'luxury']),

  // Recommendation
  recommendation: z.object({
    recommended: z.boolean(),
    reasoning: z.string(),
    alternatives: z.array(z.string()).optional(),
    priorityRanking: z.number().optional(), // Among other potential improvements
  }),

  // Market data sources
  dataSources: z.array(z.string()).optional(), // "Remodeling Magazine Cost vs Value", "NAR", etc.

  generatedAt: z.date(),
});

export type ImprovementROI = z.infer<typeof ImprovementROISchema>;

// ============================================================================
// HOMEOWNERSHIP DASHBOARD
// ============================================================================

/**
 * Comprehensive homeownership dashboard
 */
export const HomeownershipDashboardSchema = z.object({
  userId: z.string(),
  propertyId: z.string(),

  // Summary metrics
  summary: z.object({
    currentHomeValue: z.number(),
    totalEquity: z.number(),
    yearsOwned: z.number(),
    totalAppreciation: z.number(),

    // Monthly costs
    monthlyMortgage: z.number(),
    monthlyHOA: z.number().optional(),
    monthlyUtilities: z.number().optional(),
    monthlyInsurance: z.number(),
    monthlyPropertyTax: z.number(),
    totalMonthlyCost: z.number(),

    // Annual costs
    annualMaintenance: z.number(),
    annualImprovements: z.number().optional(),
  }),

  // Upcoming tasks & alerts
  upcomingTasks: z.array(z.object({
    taskName: z.string(),
    category: z.string(),
    dueDate: z.date(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })),

  overdueTasksCount: z.number(),

  // Warranties expiring soon
  expiring Warranties: z.array(z.object({
    applianceName: z.string(),
    expirationDate: z.date(),
    daysUntilExpiration: z.number(),
  })),

  // Appliances needing attention
  appliancesNeedingAttention: z.array(z.object({
    applianceName: z.string(),
    issue: z.enum(['near_end_of_life', 'needs_repair', 'maintenance_overdue']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })),

  // Financial opportunities
  opportunities: z.array(z.object({
    type: z.enum(['refinance', 'heloc', 'sell', 'rent_out', 'improvement']),
    title: z.string(),
    description: z.string(),
    potentialSavings: z.number().optional(),
    action: z.string(),
  })).optional(),

  // Budget vs actual
  budgetTracking: z.object({
    annualMaintenanceBudget: z.number(),
    yearToDateSpent: z.number(),
    remainingBudget: z.number(),
    projectedAnnualSpend: z.number(),
    onTrack: z.boolean(),
  }).optional(),

  lastUpdated: z.date(),
});

export type HomeownershipDashboard = z.infer<typeof HomeownershipDashboardSchema>;

// ============================================================================
// REFINANCE OPPORTUNITY ALERT
// ============================================================================

/**
 * Refinance opportunity monitoring
 */
export const RefinanceOpportunitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),

  // Current mortgage
  currentMortgage: z.object({
    loanAmount: z.number(),
    interestRate: z.number(),
    monthlyPayment: z.number(),
    remainingYears: z.number(),
    loanType: z.enum(['conventional', 'fha', 'va', 'usda', 'jumbo']),
  }),

  // Market rates
  marketRates: z.object({
    currentMarketRate: z.number(),
    rateDifference: z.number(), // Current rate - market rate
    trendDirection: z.enum(['rising', 'stable', 'falling']),
  }),

  // Refinance scenario
  refinanceScenario: z.object({
    newLoanAmount: z.number(),
    newInterestRate: z.number(),
    newMonthlyPayment: z.number(),
    newLoanTerm: z.number(), // Years

    closingCosts: z.number(),
    monthlySavings: z.number(),
    totalInterestSavings: z.number(), // Over life of loan

    breakEvenMonths: z.number(),
    breakevenDate: z.date(),

    cashOutOption: z.object({
      available: z.boolean(),
      maxCashOut: z.number().optional(),
      purposes: z.array(z.enum(['debt_consolidation', 'home_improvements', 'investment', 'other'])).optional(),
    }).optional(),
  }),

  // Recommendation
  recommendation: z.object({
    shouldRefinance: z.boolean(),
    confidence: z.enum(['low', 'medium', 'high']),
    reasoning: z.string(),
    optimalTiming: z.enum(['now', 'wait_for_lower_rates', 'wait_for_more_equity', 'not_recommended']),
  }),

  // Action steps
  nextSteps: z.array(z.string()),

  // Alert status
  alertSent: z.boolean(),
  alertSentAt: z.date().optional(),

  generatedAt: z.date(),
});

export type RefinanceOpportunity = z.infer<typeof RefinanceOpportunitySchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const HomeownershipSchemas = {
  MaintenanceTask: MaintenanceTaskSchema,
  SeasonalMaintenance: SeasonalMaintenanceSchema,
  ApplianceInventory: ApplianceInventorySchema,
  HomeValueTracking: HomeValueTrackingSchema,
  ImprovementROI: ImprovementROISchema,
  HomeownershipDashboard: HomeownershipDashboardSchema,
  RefinanceOpportunity: RefinanceOpportunitySchema,
};
