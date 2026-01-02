/**
 * Energy Optimization & Green Financing
 * Solar potential, efficiency upgrades, green financing, and utility cost optimization
 * Pain Point: 73% want energy-efficient homes, but lack tools to evaluate costs/savings
 * Revenue Opportunity: Solar installer leads $100-$300 each, green loan referrals $50-$150
 */

import { z } from 'zod';

// ============================================================================
// SOLAR POTENTIAL ANALYSIS
// ============================================================================

/**
 * Comprehensive solar panel feasibility and ROI analysis
 */
export const SolarPotentialSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  address: z.string(),

  // Site suitability
  siteSuitability: z.object({
    roofArea: z.number(), // Square feet
    usableRoofArea: z.number(), // After accounting for obstructions
    roofOrientation: z.enum(['north', 'south', 'east', 'west', 'multiple']),
    roofPitch: z.number().optional(), // Degrees (30-40 optimal)
    shading: z.enum(['none', 'minimal', 'moderate', 'significant']),

    suitabilityScore: z.number().min(0).max(100),
    suitabilityRating: z.enum(['poor', 'fair', 'good', 'excellent']),

    // Limitations
    limitations: z.array(z.enum([
      'insufficient_roof_space',
      'excessive_shading',
      'poor_orientation',
      'roof_condition',
      'hoa_restrictions',
      'local_regulations',
      'structural_concerns',
    ])).optional(),
  }),

  // Solar production estimate
  productionEstimate: z.object({
    // System size
    recommendedSystemSize: z.number(), // kW
    numberOfPanels: z.number(),
    panelWattage: z.number(), // Watts per panel

    // Annual production
    annualProductionKWh: z.number(),
    monthlyProduction: z.array(z.object({
      month: z.enum(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
      kwh: z.number(),
    })),

    // Coverage
    currentAnnualUsage: z.number(), // kWh
    percentageOfUsageCovered: z.number(),
    netAnnualUsage: z.number(), // After solar production

    // Sun exposure
    averageSunHoursPerDay: z.number(),
    annualSunHours: z.number(),
  }),

  // Cost analysis
  costs: z.object({
    // Equipment
    systemCost: z.number(),
    costPerWatt: z.number(),

    breakdown: z.object({
      panels: z.number(),
      inverter: z.number(),
      racking: z.number(),
      installation: z.number(),
      permits: z.number(),
      other: z.number(),
    }),

    // Incentives
    incentives: z.object({
      federalTaxCredit: z.number(), // 30% ITC
      stateIncentives: z.number().optional(),
      localIncentives: z.number().optional(),
      utilityRebates: z.number().optional(),
      totalIncentives: z.number(),
    }),

    netCostAfterIncentives: z.number(),
  }),

  // Savings analysis
  savings: z.object({
    // Current electricity costs
    currentMonthlyBill: z.number(),
    currentAnnualCost: z.number(),
    utilityRate: z.number(), // $ per kWh

    // Future costs with solar
    newMonthlyBill: z.number(), // Remaining grid usage
    newAnnualCost: z.number(),

    // Savings
    monthlySavings: z.number(),
    annualSavings: z.number(),
    year1Savings: z.number(),

    // Accounting for rate increases
    utilityRateEscalation: z.number(), // Annual % increase
    year25Savings: z.number(), // Over 25-year system life
  }),

  // ROI analysis
  roi: z.object({
    paybackPeriod: z.number(), // Years
    breakEvenYear: z.number(),

    // Returns
    year1ROI: z.number(), // Percentage
    year10ROI: z.number(),
    year25ROI: z.number(), // Full system life

    // NPV and IRR
    netPresentValue: z.number().optional(),
    internalRateOfReturn: z.number().optional(),

    totalSavingsLifetime: z.number(), // 25 years
  }),

  // Environmental impact
  environmentalImpact: z.object({
    annualCO2Offset: z.number(), // Pounds
    equivalentTreesPlanted: z.number(),
    equivalentCarMilesOffset: z.number(),

    year25CO2Offset: z.number(),
  }),

  // Battery storage (optional)
  batteryStorage: z.object({
    recommended: z.boolean(),
    reasoning: z.string(),

    // If included
    batteryCost: z.number().optional(),
    batteryCapacity: z.number().optional(), // kWh
    backupCapabilityHours: z.number().optional(),
    additionalSavings: z.number().optional(), // From time-of-use optimization

    totalSystemCost: z.number().optional(),
    revisedPaybackPeriod: z.number().optional(),
  }).optional(),

  // Financing options
  financingOptions: z.array(z.object({
    type: z.enum(['cash', 'loan', 'lease', 'ppa']), // PPA = Power Purchase Agreement
    provider: z.string().optional(),

    // Terms
    downPayment: z.number().optional(),
    loanAmount: z.number().optional(),
    interestRate: z.number().optional(),
    termYears: z.number().optional(),
    monthlyPayment: z.number().optional(),

    // Comparison
    netMonthlySavings: z.number(), // After loan payment
    totalCostOverTerm: z.number(),
    ownershipRetained: z.boolean(), // False for lease/PPA

    recommendation: z.enum(['not_recommended', 'viable', 'recommended', 'best_option']).optional(),
  })),

  // Installer quotes
  installerQuotes: z.array(z.object({
    installerId: z.string().optional(),
    companyName: z.string(),
    quotedPrice: z.number(),
    systemSize: z.number(),
    equipment: z.string(),
    warranty: z.string(),
    rating: z.number().min(1).max(5).optional(),
    reviewCount: z.number().optional(),
  })).optional(),

  // Recommendations
  recommendation: z.object({
    recommended: z.boolean(),
    reasoning: z.string(),
    bestFinancingOption: z.string(),
    nextSteps: z.array(z.string()),
  }),

  lastUpdated: z.date(),
});

export type SolarPotential = z.infer<typeof SolarPotentialSchema>;

// ============================================================================
// ENERGY EFFICIENCY AUDIT
// ============================================================================

/**
 * Home energy efficiency assessment and upgrade recommendations
 */
export const EnergyEfficiencyAuditSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Current energy performance
  currentPerformance: z.object({
    // Energy usage
    annualElectricityKWh: z.number(),
    annualGasTherms: z.number().optional(),
    totalEnergyBTU: z.number(),

    // Costs
    annualElectricityCost: z.number(),
    annualGasCost: z.number().optional(),
    totalAnnualEnergyCost: z.number(),

    // Intensity
    energyUseIntensity: z.number(), // BTU per sq ft per year
    vsTypicalHome: z.number(), // Percentage difference

    // Score
    energyScore: z.number().min(0).max(100), // Higher is better
    rating: z.enum(['very_poor', 'poor', 'fair', 'good', 'excellent']),
  }),

  // Component assessments
  components: z.object({
    // Insulation
    insulation: z.object({
      attic: z.object({
        rValue: z.number(),
        recommendedRValue: z.number(),
        condition: z.enum(['poor', 'fair', 'good', 'excellent']),
        needsUpgrade: z.boolean(),
      }),
      walls: z.object({
        rValue: z.number(),
        recommendedRValue: z.number(),
        condition: z.enum(['poor', 'fair', 'good', 'excellent']),
        needsUpgrade: z.boolean(),
      }),
      basement: z.object({
        rValue: z.number().optional(),
        recommendedRValue: z.number().optional(),
        condition: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        needsUpgrade: z.boolean(),
      }).optional(),
    }),

    // Windows
    windows: z.object({
      type: z.enum(['single_pane', 'double_pane', 'triple_pane']),
      uFactor: z.number().optional(), // Lower is better
      age: z.number().optional(),
      condition: z.enum(['poor', 'fair', 'good', 'excellent']),
      needsReplacement: z.boolean(),
    }),

    // HVAC
    hvac: z.object({
      heatingSystem: z.object({
        type: z.enum(['furnace_gas', 'furnace_oil', 'heat_pump', 'boiler', 'baseboard', 'other']),
        age: z.number(),
        efficiency: z.number().optional(), // AFUE or HSPF
        condition: z.enum(['poor', 'fair', 'good', 'excellent']),
        needsReplacement: z.boolean(),
      }),
      coolingSystem: z.object({
        type: z.enum(['central_ac', 'heat_pump', 'window_units', 'none']),
        age: z.number().optional(),
        seer: z.number().optional(), // Seasonal Energy Efficiency Ratio
        condition: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        needsReplacement: z.boolean(),
      }),
    }),

    // Water heating
    waterHeater: z.object({
      type: z.enum(['tank_gas', 'tank_electric', 'tankless_gas', 'tankless_electric', 'heat_pump']),
      age: z.number(),
      capacity: z.number().optional(), // Gallons
      energyFactor: z.number().optional(),
      condition: z.enum(['poor', 'fair', 'good', 'excellent']),
      needsReplacement: z.boolean(),
    }),

    // Air sealing
    airSealing: z.object({
      blowerDoorTest: z.number().optional(), // ACH50 (air changes per hour at 50 Pascals)
      leakageLevel: z.enum(['very_leaky', 'leaky', 'moderate', 'tight', 'very_tight']),
      needsSealing: z.boolean(),
    }).optional(),
  }),

  // Upgrade recommendations
  recommendations: z.array(z.object({
    id: z.string(),
    category: z.enum([
      'insulation',
      'windows',
      'hvac',
      'water_heater',
      'air_sealing',
      'smart_thermostat',
      'led_lighting',
      'appliances',
      'solar',
      'other',
    ]),

    upgrade: z.string(),
    description: z.string(),

    // Costs
    estimatedCost: z.number(),
    costRange: z.object({
      low: z.number(),
      high: z.number(),
    }),

    // Savings
    annualEnergySavings: z.number(), // kWh or therms
    annualCostSavings: z.number(),
    lifetimeSavings: z.number(),

    // ROI
    paybackPeriod: z.number(), // Years
    roi: z.number(), // Lifetime ROI percentage

    // Priority
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    impact: z.enum(['minor', 'moderate', 'major', 'transformative']),

    // Incentives available
    incentivesAvailable: z.array(z.object({
      program: z.string(),
      amount: z.number(),
      type: z.enum(['rebate', 'tax_credit', 'loan']),
    })).optional(),

    netCostAfterIncentives: z.number(),
  })),

  // Recommended upgrade packages
  packages: z.array(z.object({
    packageName: z.string(),
    description: z.string(),
    upgrades: z.array(z.string()), // IDs of recommendations

    // Combined costs/savings
    totalCost: z.number(),
    totalAnnualSavings: z.number(),
    combinedPaybackPeriod: z.number(),

    // Energy performance improvement
    newEnergyScore: z.number(),
    energyReduction: z.number(), // Percentage

    priority: z.enum(['basic', 'recommended', 'comprehensive', 'premium']),
  })).optional(),

  // Total opportunity
  totalOpportunity: z.object({
    maxAnnualSavings: z.number(), // If all recommendations implemented
    maxEnergyCostReduction: z.number(), // Percentage
    totalUpgradeCost: z.number(),
    totalIncentivesAvailable: z.number(),
  }),

  lastUpdated: z.date(),
});

export type EnergyEfficiencyAudit = z.infer<typeof EnergyEfficiencyAuditSchema>;

// ============================================================================
// GREEN FINANCING OPTIONS
// ============================================================================

/**
 * Green loans, PACE financing, and energy-efficient mortgages
 */
export const GreenFinancingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  // User situation
  scenario: z.enum(['purchase', 'refinance', 'home_improvement']),
  plannedUpgrades: z.array(z.string()).optional(),
  estimatedUpgradeCost: z.number().optional(),

  // Available programs
  programs: z.array(z.object({
    programType: z.enum([
      'energy_efficient_mortgage', // FHA, VA, or conventional
      'pace_financing', // Property Assessed Clean Energy
      'home_equity_loan',
      'home_equity_line_of_credit',
      'personal_loan',
      'manufacturer_financing', // Solar, HVAC, etc.
      'utility_financing',
    ]),

    programName: z.string(),
    provider: z.string(),

    // Eligibility
    eligible: z.boolean(),
    eligibilityRequirements: z.array(z.string()),

    // Terms
    maxLoanAmount: z.number(),
    interestRate: z.number(),
    term: z.number(), // Years
    monthlyPayment: z.number().optional(),

    // Special features
    features: z.array(z.enum([
      'tax_deductible_interest',
      'no_upfront_costs',
      'no_credit_check',
      'transferable_to_buyer',
      'tax_assessment_payment', // PACE
      'rolled_into_mortgage', // EEM
    ])).optional(),

    // Costs
    fees: z.number(),
    apr: z.number(),

    // Benefits
    benefits: z.array(z.string()),
    drawbacks: z.array(z.string()).optional(),

    // Recommendation
    recommended: z.boolean(),
    reasoning: z.string(),
  })),

  // Incentives & rebates
  incentives: z.array(z.object({
    programName: z.string(),
    type: z.enum(['federal_tax_credit', 'state_tax_credit', 'utility_rebate', 'local_incentive']),
    amount: z.number(),
    maxAmount: z.number().optional(),
    eligibleUpgrades: z.array(z.string()),

    // Requirements
    requirements: z.array(z.string()),
    deadline: z.date().optional(),

    // Application
    applicationProcess: z.string().optional(),
    processingTime: z.string().optional(),
  })),

  // Comparison
  comparison: z.object({
    // Traditional financing vs green financing
    traditionalLoan: z.object({
      interestRate: z.number(),
      monthlyPayment: z.number(),
      totalInterest: z.number(),
    }),

    bestGreenOption: z.object({
      programName: z.string(),
      interestRate: z.number(),
      monthlyPayment: z.number(),
      totalInterest: z.number(),
      netCostAfterIncentives: z.number(),
    }),

    savings: z.object({
      monthlySavings: z.number(),
      totalSavings: z.number(),
    }),
  }).optional(),

  // Energy-Efficient Mortgage (EEM) specific
  energyEfficientMortgage: z.object({
    available: z.boolean(),

    // How it works
    baseHomePrice: z.number().optional(),
    energyUpgradeCost: z.number().optional(),
    totalLoanAmount: z.number().optional(),

    // Benefits
    allowsHigherDTI: z.boolean(), // Debt-to-income ratio
    energySavingsConsidered: z.boolean(),
    noAdditionalDownPayment: z.boolean(),

    // Calculation
    maxUpgradeAmount: z.number().optional(), // Lesser of cost or increase in value
    costEffectiveImprovements: z.number().optional(),
  }).optional(),

  // PACE financing specific
  paceFinancing: z.object({
    available: z.boolean(),

    // How it works
    repaymentMethod: z.string(), // "Property tax assessment"
    transfersToNewOwner: z.boolean(),
    seniorLienStatus: z.boolean(), // May be senior to mortgage

    // Concerns
    concerns: z.array(z.string()).optional(), // "May complicate refinancing", etc.
  }).optional(),

  // Recommendations
  recommendation: z.object({
    bestOption: z.string(),
    reasoning: z.string(),
    nextSteps: z.array(z.string()),
  }),

  lastUpdated: z.date(),
});

export type GreenFinancing = z.infer<typeof GreenFinancingSchema>;

// ============================================================================
// UTILITY COST OPTIMIZATION
// ============================================================================

/**
 * Utility provider comparison and cost optimization
 */
export const UtilityCostOptimizationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  address: z.string(),

  // Current utilities
  currentUtilities: z.object({
    electricity: z.object({
      provider: z.string(),
      planName: z.string().optional(),
      rateStructure: z.enum(['fixed', 'variable', 'time_of_use']),
      averageRatePerKWh: z.number(),
      monthlyAverageCost: z.number(),
      annualCost: z.number(),
    }),

    gas: z.object({
      provider: z.string(),
      ratePerTherm: z.number(),
      monthlyAverageCost: z.number(),
      annualCost: z.number(),
    }).optional(),

    water: z.object({
      provider: z.string(),
      monthlyAverageCost: z.number(),
      annualCost: z.number(),
    }).optional(),

    totalMonthlyCost: z.number(),
    totalAnnualCost: z.number(),
  }),

  // Alternative providers (deregulated markets)
  alternativeProviders: z.array(z.object({
    utilityType: z.enum(['electricity', 'gas']),
    provider: z.string(),
    planName: z.string(),

    // Rates
    rateStructure: z.enum(['fixed', 'variable', 'time_of_use']),
    rate: z.number(),
    contractTerm: z.number().optional(), // Months

    // Costs
    estimatedMonthlyCost: z.number(),
    estimatedAnnualCost: z.number(),

    // Savings vs current
    monthlySavings: z.number(),
    annualSavings: z.number(),
    percentSavings: z.number(),

    // Features
    renewableEnergy: z.boolean(),
    renewablePercentage: z.number().optional(),
    cancellationFee: z.number().optional(),

    // Rating
    customerRating: z.number().min(1).max(5).optional(),
    reviewCount: z.number().optional(),

    recommended: z.boolean(),
  })).optional(),

  // Usage optimization
  usageOptimization: z.object({
    // Current usage patterns
    currentUsage: z.object({
      peakUsage: z.number(), // kWh or therms
      offPeakUsage: z.number(),
      totalUsage: z.number(),
    }).optional(),

    // Time-of-use optimization
    timeOfUseOpportunity: z.object({
      available: z.boolean(),
      potentialSavings: z.number(), // Annual
      requiredChanges: z.array(z.string()).optional(), // "Shift dishwasher to after 9pm"
    }).optional(),

    // Smart home optimization
    smartHomeDevices: z.array(z.object({
      device: z.string(),
      estimatedCost: z.number(),
      annualSavings: z.number(),
      paybackPeriod: z.number(),
    })).optional(),
  }).optional(),

  // Renewable energy options
  renewableOptions: z.object({
    // Community solar
    communitySolar: z.object({
      available: z.boolean(),
      providers: z.array(z.object({
        provider: z.string(),
        subscriptionCost: z.number().optional(),
        savingsPercent: z.number(),
        contractTerm: z.number(),
      })).optional(),
    }).optional(),

    // Green power plans
    greenPowerPlans: z.array(z.object({
      provider: z.string(),
      planName: z.string(),
      renewablePercent: z.number(),
      premiumCost: z.number(), // Extra cost for green power
    })).optional(),
  }).optional(),

  // Total savings opportunity
  savingsOpportunity: z.object({
    // Provider switching
    providerSwitchSavings: z.number(), // Annual

    // Usage optimization
    usageOptimizationSavings: z.number(),

    // Solar (if applicable)
    solarSavings: z.number().optional(),

    totalPotentialSavings: z.number(),
    percentReduction: z.number(),
  }),

  // Recommendations
  recommendations: z.array(z.object({
    recommendation: z.string(),
    savings: z.number(),
    effort: z.enum(['low', 'moderate', 'high']),
    priority: z.enum(['low', 'medium', 'high']),
  })),

  lastUpdated: z.date(),
});

export type UtilityCostOptimization = z.infer<typeof UtilityCostOptimizationSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const EnergySustainabilitySchemas = {
  SolarPotential: SolarPotentialSchema,
  EnergyEfficiencyAudit: EnergyEfficiencyAuditSchema,
  GreenFinancing: GreenFinancingSchema,
  UtilityCostOptimization: UtilityCostOptimizationSchema,
};
