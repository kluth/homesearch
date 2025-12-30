import { z } from 'zod';

/**
 * Mortgage Calculator & Financial Tools
 */

export enum LoanType {
  CONVENTIONAL = 'conventional',
  FHA = 'fha',
  VA = 'va',
  USDA = 'usda',
  JUMBO = 'jumbo',
  ARM = 'arm', // Adjustable Rate Mortgage
}

export const MortgageCalculationSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  propertyId: z.string().optional(),

  // Loan details
  loanType: z.nativeEnum(LoanType),
  homePrice: z.number().positive(),
  downPayment: z.number().nonnegative(),
  downPaymentPercent: z.number().min(0).max(100),
  loanAmount: z.number().positive(),

  // Interest
  interestRate: z.number().positive(), // Annual percentage
  loanTerm: z.number().positive().default(30), // years
  armDetails: z.object({
    initialRate: z.number(),
    adjustmentPeriod: z.number(), // months
    rateCapPerAdjustment: z.number(),
    lifetimeCap: z.number(),
  }).optional(),

  // Additional costs
  propertyTax: z.number().nonnegative().default(0), // Annual
  homeInsurance: z.number().nonnegative().default(0), // Annual
  hoaFees: z.number().nonnegative().default(0), // Monthly
  pmi: z.number().nonnegative().default(0), // Monthly (Private Mortgage Insurance)

  // Closing costs
  closingCosts: z.object({
    originationFee: z.number().default(0),
    appraisalFee: z.number().default(500),
    inspectionFee: z.number().default(500),
    titleInsurance: z.number().default(0),
    escrowFee: z.number().default(0),
    recordingFee: z.number().default(125),
    prepaidInterest: z.number().default(0),
    other: z.number().default(0),
    total: z.number(),
  }),

  // Monthly payment breakdown
  monthlyPayment: z.object({
    principal: z.number(),
    interest: z.number(),
    propertyTax: z.number(),
    homeInsurance: z.number(),
    hoaFees: z.number(),
    pmi: z.number(),
    total: z.number(),
  }),

  // Amortization summary
  totalPayments: z.number(),
  totalInterest: z.number(),
  totalPrincipal: z.number(),

  // Affordability checks
  affordability: z.object({
    requiredAnnualIncome: z.number(), // Based on 28% front-end ratio
    requiredMonthlyIncome: z.number(),
    frontEndRatio: z.number().optional(), // Housing expense to income
    backEndRatio: z.number().optional(), // Total debt to income
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MortgageCalculation = z.infer<typeof MortgageCalculationSchema>;

/**
 * Amortization Schedule
 */
export const AmortizationScheduleSchema = z.object({
  id: z.string(),
  mortgageCalculationId: z.string(),

  // Schedule
  schedule: z.array(z.object({
    month: z.number(),
    payment: z.number(),
    principal: z.number(),
    interest: z.number(),
    balance: z.number(),
    cumulativePrincipal: z.number(),
    cumulativeInterest: z.number(),
  })),

  // Milestones
  milestones: z.object({
    month50PercentPaid: z.number().optional(),
    monthPMIRemoved: z.number().optional(),
    totalInterestPaid: z.number(),
  }),

  createdAt: z.date(),
});

export type AmortizationSchedule = z.infer<typeof AmortizationScheduleSchema>;

/**
 * Pre-Approval
 */
export enum PreApprovalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  CONDITIONAL = 'conditional',
  DENIED = 'denied',
  EXPIRED = 'expired',
}

export const PreApprovalSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Lender information
  lenderId: z.string().optional(),
  lenderName: z.string(),
  loanOfficer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }).optional(),

  // Approval details
  approvedAmount: z.number().optional(),
  loanType: z.nativeEnum(LoanType),
  interestRate: z.number().optional(),
  conditions: z.array(z.string()).optional(),

  // Status
  status: z.nativeEnum(PreApprovalStatus),
  submittedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  expiresAt: z.date().optional(),

  // Documents
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum([
      'pay_stub',
      'w2',
      'tax_return',
      'bank_statement',
      'employment_verification',
      'credit_report',
      'other',
    ]),
    url: z.string().url(),
    uploadedAt: z.date(),
  })),

  // Financial information
  financialInfo: z.object({
    annualIncome: z.number(),
    monthlyDebts: z.number(),
    employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'other']),
    employmentYears: z.number(),
    creditScore: z.number().min(300).max(850).optional(),
  }),

  // Notes
  notes: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PreApproval = z.infer<typeof PreApprovalSchema>;

/**
 * Down Payment Assistance Programs
 */
export const AssistanceProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  // Eligibility
  eligibility: z.object({
    minCreditScore: z.number().optional(),
    maxIncome: z.number().optional(),
    firstTimeBuyerOnly: z.boolean().default(false),
    locations: z.array(z.object({
      city: z.string().optional(),
      state: z.string(),
      zipCodes: z.array(z.string()).optional(),
    })),
    occupancyRequirement: z.enum(['primary', 'secondary', 'investment']).optional(),
  }),

  // Assistance details
  assistance: z.object({
    type: z.enum(['grant', 'forgivable_loan', 'deferred_loan', 'low_interest_loan']),
    maxAmount: z.number(),
    percentageOfPurchase: z.number().optional(),
    repaymentTerms: z.string().optional(),
  }),

  // Provider
  provider: z.object({
    name: z.string(),
    type: z.enum(['federal', 'state', 'local', 'nonprofit', 'private']),
    website: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }),

  // Application
  applicationUrl: z.string().url().optional(),
  documentsRequired: z.array(z.string()),

  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssistanceProgram = z.infer<typeof AssistanceProgramSchema>;

/**
 * Closing Cost Estimator
 */
export const ClosingCostEstimateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  homePrice: z.number().positive(),
  location: z.object({
    state: z.string(),
    county: z.string().optional(),
  }),

  // Buyer costs
  buyerCosts: z.object({
    // Loan costs
    loanOriginationFee: z.object({
      amount: z.number(),
      percentage: z.number(),
      description: z.string(),
    }),
    appraisalFee: z.object({
      amount: z.number(),
      description: z.string(),
    }),
    creditReportFee: z.object({
      amount: z.number(),
      description: z.string(),
    }),
    floodCertification: z.object({
      amount: z.number(),
      description: z.string(),
    }),

    // Title and escrow
    titleSearch: z.object({
      amount: z.number(),
      description: z.string(),
    }),
    titleInsurance: z.object({
      amount: z.number(),
      percentage: z.number(),
      description: z.string(),
    }),
    escrowFee: z.object({
      amount: z.number(),
      description: z.string(),
    }),

    // Government fees
    recordingFee: z.object({
      amount: z.number(),
      description: z.string(),
    }),
    transferTax: z.object({
      amount: z.number(),
      percentage: z.number(),
      description: z.string(),
    }),

    // Prepaids
    prepaidInterest: z.object({
      amount: z.number(),
      days: z.number(),
      description: z.string(),
    }),
    prepaidPropertyTax: z.object({
      amount: z.number(),
      months: z.number(),
      description: z.string(),
    }),
    prepaidHomeInsurance: z.object({
      amount: z.number(),
      months: z.number(),
      description: z.string(),
    }),

    // Inspection
    homeInspection: z.object({
      amount: z.number(),
      description: z.string(),
    }),
    pestInspection: z.object({
      amount: z.number().optional(),
      description: z.string(),
    }).optional(),

    // Other
    surveyCost: z.object({
      amount: z.number().optional(),
      description: z.string(),
    }).optional(),
    attorneyFees: z.object({
      amount: z.number().optional(),
      description: z.string(),
    }).optional(),

    total: z.number(),
  }),

  // Seller concessions (if any)
  sellerConcessions: z.number().default(0),

  // Net closing costs
  netClosingCosts: z.number(),
  totalCashNeeded: z.number(), // Down payment + closing costs

  // Estimates breakdown
  estimateRange: z.object({
    low: z.number(),
    high: z.number(),
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClosingCostEstimate = z.infer<typeof ClosingCostEstimateSchema>;

/**
 * Rent vs Buy Calculator
 */
export const RentVsBuyAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Buying scenario
  buying: z.object({
    homePrice: z.number(),
    downPayment: z.number(),
    interestRate: z.number(),
    loanTerm: z.number(),
    closingCosts: z.number(),
    monthlyPayment: z.number(),
    propertyTax: z.number(),
    homeInsurance: z.number(),
    hoaFees: z.number(),
    maintenance: z.number(), // Annual percentage of home value
    homeAppreciation: z.number().default(3), // Annual percentage
  }),

  // Renting scenario
  renting: z.object({
    monthlyRent: z.number(),
    rentersInsurance: z.number(),
    rentIncrease: z.number().default(3), // Annual percentage
  }),

  // Investment scenario (for down payment if renting)
  investment: z.object({
    initialInvestment: z.number(), // Would-be down payment
    monthlyInvestment: z.number(), // Monthly savings from renting vs buying
    annualReturn: z.number().default(7), // Annual percentage
  }),

  // Analysis results
  results: z.object({
    breakEvenMonths: z.number(),
    breakEvenYears: z.number(),

    // Costs over time
    year1: z.object({
      buyingCost: z.number(),
      rentingCost: z.number(),
      difference: z.number(),
    }),
    year5: z.object({
      buyingCost: z.number(),
      rentingCost: z.number(),
      buyingEquity: z.number(),
      investmentValue: z.number(),
      netDifference: z.number(),
    }),
    year10: z.object({
      buyingCost: z.number(),
      rentingCost: z.number(),
      buyingEquity: z.number(),
      investmentValue: z.number(),
      netDifference: z.number(),
    }),
    year30: z.object({
      buyingCost: z.number(),
      rentingCost: z.number(),
      buyingEquity: z.number(),
      investmentValue: z.number(),
      netDifference: z.number(),
    }),
  }),

  // Recommendation
  recommendation: z.enum(['buy', 'rent', 'depends']),
  recommendationReason: z.string(),

  // Additional considerations
  considerations: z.array(z.object({
    category: z.enum(['financial', 'lifestyle', 'market', 'personal']),
    factor: z.string(),
    favorsBuying: z.boolean().optional(),
  })),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RentVsBuyAnalysis = z.infer<typeof RentVsBuyAnalysisSchema>;

/**
 * Affordability Calculator
 */
export const AffordabilityCalculationSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),

  // Income
  grossMonthlyIncome: z.number().positive(),
  otherIncome: z.number().nonnegative().default(0),
  totalMonthlyIncome: z.number(),

  // Debts
  monthlyDebts: z.object({
    carPayment: z.number().default(0),
    studentLoans: z.number().default(0),
    creditCards: z.number().default(0),
    otherDebts: z.number().default(0),
    total: z.number(),
  }),

  // Down payment
  availableDownPayment: z.number().nonnegative(),
  downPaymentPercent: z.number().min(0).max(100).default(20),

  // Loan assumptions
  interestRate: z.number().positive().default(7),
  loanTerm: z.number().default(30),

  // Results
  results: z.object({
    // Debt-to-income ratios
    frontEndRatio: z.number(), // Housing expense / Income (should be < 28%)
    backEndRatio: z.number(), // Total debt / Income (should be < 36-43%)

    // Maximum affordable
    maxMonthlyPayment: z.number(),
    maxHomePrice: z.number(),

    // Comfortable range
    comfortableMonthlyPayment: z.number(),
    comfortableHomePrice: z.number(),

    // Price ranges by DTI
    conservative: z.object({
      // 28% front-end ratio
      maxHomePrice: z.number(),
      monthlyPayment: z.number(),
      downPayment: z.number(),
    }),
    moderate: z.object({
      // 33% front-end ratio
      maxHomePrice: z.number(),
      monthlyPayment: z.number(),
      downPayment: z.number(),
    }),
    aggressive: z.object({
      // 43% back-end ratio
      maxHomePrice: z.number(),
      monthlyPayment: z.number(),
      downPayment: z.number(),
    }),
  }),

  // Recommendations
  recommendations: z.array(z.string()),

  createdAt: z.date(),
});

export type AffordabilityCalculation = z.infer<typeof AffordabilityCalculationSchema>;
