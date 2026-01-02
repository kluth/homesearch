/**
 * Mortgage & Financing Hub
 * Comprehensive mortgage shopping, pre-approval, and lender comparison
 * Revenue opportunity: $25-$150 per qualified lead to lenders
 * Critical need: Mortgage shopping is confusing and time-consuming for buyers
 */

import { z } from 'zod';

// ============================================================================
// LENDER PROFILE
// ============================================================================

/**
 * Mortgage lender profile
 */
export const MortgageLenderSchema = z.object({
  id: z.string(),

  // Lender info
  name: z.string(),
  logo: z.string().url().optional(),
  lenderType: z.enum([
    'bank', // Traditional banks
    'credit_union',
    'mortgage_company', // Non-bank lenders
    'online_lender',
    'broker', // Mortgage broker representing multiple lenders
  ]),

  // Credentials
  nmlsId: z.string(), // Nationwide Multistate Licensing System ID
  licensed: z.boolean(),
  licenseStates: z.array(z.string()),

  // Contact
  phone: z.string(),
  email: z.string().email(),
  website: z.string().url(),

  // Ratings & Reviews
  ratings: z.object({
    overallRating: z.number().min(1).max(5),
    totalReviews: z.number(),

    categoryRatings: z.object({
      ratesAndFees: z.number().min(1).max(5),
      customerService: z.number().min(1).max(5),
      closingSpeed: z.number().min(1).max(5),
      transparency: z.number().min(1).max(5),
    }).optional(),
  }),

  // Loan types offered
  loanTypes: z.array(z.enum([
    'conventional',
    'fha',
    'va',
    'usda',
    'jumbo',
    'arm_5_1',
    'arm_7_1',
    'arm_10_1',
    'heloc',
    'home_equity_loan',
    'construction',
    'renovation',
    'reverse_mortgage',
  ])),

  // Special programs
  specialPrograms: z.array(z.enum([
    'first_time_buyer',
    'low_down_payment',
    'down_payment_assistance',
    'physician_loan',
    'teacher_loan',
    'veteran_friendly',
    'self_employed',
    'foreign_national',
    'investor_loans',
  ])).optional(),

  // Statistics
  stats: z.object({
    averageClosingDays: z.number(),
    onTimeClosingRate: z.number(), // Percentage
    approvalRate: z.number().optional(), // Percentage
    volumeLastYear: z.number().optional(), // $ volume
  }),

  // Service details
  service: z.object({
    preApprovalSameDay: z.boolean(),
    onlineApplication: z.boolean(),
    mobileApp: z.boolean(),
    dedicatedLoanOfficer: z.boolean(),
    twentyFourSevenSupport: z.boolean(),
  }),

  // Platform presence
  featured: z.boolean().default(false),
  verified: z.boolean().default(false),

  status: z.enum(['active', 'inactive']).default('active'),

  joinedAt: z.date(),
});

export type MortgageLender = z.infer<typeof MortgageLenderSchema>;

// ============================================================================
// MORTGAGE RATE QUOTE
// ============================================================================

/**
 * Real-time mortgage rate quote from lender
 */
export const MortgageRateQuoteSchema = z.object({
  id: z.string(),
  lenderId: z.string(),
  userId: z.string(),

  // Loan details
  loanAmount: z.number(),
  homePrice: z.number(),
  downPayment: z.number(),
  loanToValue: z.number(), // Percentage
  loanType: z.enum([
    'conventional',
    'fha',
    'va',
    'usda',
    'jumbo',
    'arm_5_1',
    'arm_7_1',
    'arm_10_1',
  ]),
  loanTerm: z.number(), // Years (15, 20, 30)

  // Property details
  propertyType: z.enum(['single_family', 'condo', 'townhouse', 'multi_family']),
  occupancy: z.enum(['primary', 'second_home', 'investment']),
  propertyState: z.string(),
  propertyZip: z.string(),

  // Borrower info
  creditScore: z.number().min(300).max(850).optional(),
  creditRange: z.enum(['excellent_740_plus', 'good_700_739', 'fair_660_699', 'poor_below_660']).optional(),

  // Rate details
  interestRate: z.number(), // APR
  aprWithFees: z.number(), // APR including all fees

  // Points
  points: z.object({
    count: z.number(), // 0, 0.5, 1, 1.5, 2, etc.
    cost: z.number(),
    description: z.string(), // "1 point = 1% of loan amount"
  }).optional(),

  // Monthly payment breakdown
  monthlyPayment: z.object({
    principalAndInterest: z.number(),
    propertyTax: z.number().optional(),
    homeInsurance: z.number().optional(),
    pmi: z.number().optional(), // Private Mortgage Insurance (if LTV > 80%)
    hoaDues: z.number().optional(),
    total: z.number(),
  }),

  // Closing costs
  closingCosts: z.object({
    lenderFees: z.object({
      originationFee: z.number(),
      applicationFee: z.number().optional(),
      underwritingFee: z.number(),
      processingFee: z.number(),
      creditReportFee: z.number(),
    }),

    thirdPartyFees: z.object({
      appraisalFee: z.number(),
      titleSearch: z.number(),
      titleInsurance: z.number(),
      surveyFee: z.number().optional(),
      recordingFees: z.number(),
      attorneyFees: z.number().optional(),
    }),

    prepaidCosts: z.object({
      homeInsurance: z.number(),
      propertyTax: z.number(),
      prepaidInterest: z.number(),
    }).optional(),

    totalClosingCosts: z.number(),
    cashToClose: z.number(), // Down payment + closing costs
  }),

  // Rate lock
  rateLock: z.object({
    lockPeriod: z.number(), // Days (30, 45, 60)
    lockFee: z.number().optional(),
    floatDownOption: z.boolean(), // Can take lower rate if rates drop
  }).optional(),

  // Conditions & Requirements
  requirements: z.object({
    minimumCreditScore: z.number(),
    minimumDownPayment: z.number(), // Percentage
    reserveMonths: z.number().optional(), // Months of payments in reserve
    employmentVerification: z.boolean(),
    incomeDocumentation: z.enum(['full', 'reduced', 'bank_statement', 'stated']),
  }),

  // Special features
  features: z.object({
    noPrepayme ntPenalty: z.boolean(),
    assumable: z.boolean(), // Can transfer to buyer when selling
    portability: z.boolean(), // Can transfer to new property
    biWeeklyPaymentOption: z.boolean(),
  }).optional(),

  // Quote metadata
  quoteNumber: z.string(),
  validUntil: z.date(),
  asOfDate: z.date(),

  // Status
  status: z.enum(['active', 'expired', 'applied', 'withdrawn']),

  // Comparison rank
  competitiveRank: z.number().optional(), // 1 = best rate, 2 = second best, etc.

  createdAt: z.date(),
});

export type MortgageRateQuote = z.infer<typeof MortgageRateQuoteSchema>;

// ============================================================================
// PRE-APPROVAL APPLICATION
// ============================================================================

/**
 * Mortgage pre-approval application
 */
export const PreApprovalApplicationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lenderId: z.string(),

  // Personal information
  borrowerInfo: z.object({
    firstName: z.string(),
    middleName: z.string().optional(),
    lastName: z.string(),
    suffix: z.string().optional(),

    dateOfBirth: z.date(),
    ssn: z.string(), // Encrypted
    phone: z.string(),
    email: z.string().email(),

    maritalStatus: z.enum(['single', 'married', 'separated', 'divorced', 'widowed']),
    dependents: z.number(),
    citizenship: z.enum(['us_citizen', 'permanent_resident', 'non_permanent_resident', 'foreign_national']),
  }),

  // Co-borrower (if applicable)
  coBorrowerInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.date(),
    ssn: z.string(),
    relationship: z.enum(['spouse', 'domestic_partner', 'other']),
  }).optional(),

  // Current address
  currentAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipcode: z.string(),
    yearsAtAddress: z.number(),
    residencyStatus: z.enum(['own', 'rent', 'living_with_family', 'other']),
    monthlyPayment: z.number().optional(),
  }),

  // Employment & Income
  employment: z.array(z.object({
    isCurrent: z.boolean(),
    employerName: z.string(),
    position: z.string(),
    employerPhone: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    yearsEmployed: z.number(),

    income: z.object({
      baseSalary: z.number(), // Annual
      overtime: z.number().optional(),
      bonuses: z.number().optional(),
      commission: z.number().optional(),
      other: z.number().optional(),
      total: z.number(),
    }),

    employmentType: z.enum(['full_time', 'part_time', 'self_employed', 'contract', 'retired', 'unemployed']),
  })),

  // Additional income
  additionalIncome: z.array(z.object({
    type: z.enum(['rental_income', 'investment_income', 'social_security', 'pension', 'alimony', 'child_support', 'other']),
    amount: z.number(), // Monthly
    description: z.string().optional(),
  })).optional(),

  // Assets
  assets: z.object({
    checkingAccounts: z.array(z.object({
      institution: z.string(),
      accountNumber: z.string().optional(),
      balance: z.number(),
    })),

    savingsAccounts: z.array(z.object({
      institution: z.string(),
      accountNumber: z.string().optional(),
      balance: z.number(),
    })),

    investmentAccounts: z.array(z.object({
      type: z.enum(['stocks', 'bonds', 'mutual_funds', '401k', 'ira', 'other']),
      institution: z.string(),
      balance: z.number(),
    })).optional(),

    realEstate: z.array(z.object({
      address: z.string(),
      currentValue: z.number(),
      mortgageBalance: z.number().optional(),
    })).optional(),

    vehicles: z.array(z.object({
      makeModel: z.string(),
      year: z.number(),
      value: z.number(),
      loanBalance: z.number().optional(),
    })).optional(),

    otherAssets: z.array(z.object({
      description: z.string(),
      value: z.number(),
    })).optional(),

    totalAssets: z.number(),
  }),

  // Liabilities
  liabilities: z.object({
    creditCards: z.array(z.object({
      creditor: z.string(),
      accountNumber: z.string().optional(),
      balance: z.number(),
      monthlyPayment: z.number(),
      creditLimit: z.number().optional(),
    })),

    loans: z.array(z.object({
      type: z.enum(['auto', 'student', 'personal', 'home_equity', 'other']),
      creditor: z.string(),
      balance: z.number(),
      monthlyPayment: z.number(),
      payoffDate: z.date().optional(),
    })).optional(),

    alimonyChildSupport: z.number().optional(), // Monthly payment

    totalMonthlyDebt: z.number(),
    totalLiabilities: z.number(),
  }),

  // Loan details requested
  loanDetails: z.object({
    loanAmount: z.number(),
    loanType: z.enum(['conventional', 'fha', 'va', 'usda', 'jumbo']),
    loanPurpose: z.enum(['purchase', 'refinance', 'cash_out_refinance']),
    propertyType: z.enum(['single_family', 'condo', 'townhouse', 'multi_family']),
    occupancy: z.enum(['primary', 'second_home', 'investment']),
    estimatedPropertyValue: z.number().optional(),
    downPaymentAmount: z.number(),
    downPaymentPercentage: z.number(),
  }),

  // Credit authorization
  creditCheckAuthorization: z.boolean(),
  creditCheckDate: z.date().optional(),

  // Documents uploaded
  documents: z.array(z.object({
    type: z.enum([
      'pay_stub',
      'w2',
      'tax_return',
      'bank_statement',
      'id',
      'proof_of_income',
      'employment_verification',
      'asset_statement',
      'other',
    ]),
    filename: z.string(),
    url: z.string().url(),
    uploadedAt: z.date(),
  })).optional(),

  // Application status
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'additional_docs_requested',
    'approved',
    'conditionally_approved',
    'denied',
    'withdrawn',
    'expired',
  ]).default('draft'),

  // Pre-approval result
  preApproval: z.object({
    approvedAmount: z.number(),
    approvedAt: z.date(),
    expiresAt: z.date(),
    conditions: z.array(z.string()).optional(),
    letterUrl: z.string().url().optional(),
  }).optional(),

  // Denial information
  denialReason: z.string().optional(),

  // Timeline
  submittedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  decidedAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type PreApprovalApplication = z.infer<typeof PreApprovalApplicationSchema>;

// ============================================================================
// DOWN PAYMENT ASSISTANCE PROGRAMS
// ============================================================================

/**
 * Down payment assistance program
 */
export const DownPaymentAssistanceSchema = z.object({
  id: z.string(),

  // Program details
  programName: z.string(),
  state: z.string(),
  county: z.string().optional(),
  city: z.string().optional(),

  // Administering agency
  agency: z.object({
    name: z.string(),
    website: z.string().url(),
    phone: z.string(),
  }),

  // Program type
  assistanceType: z.array(z.enum([
    'grant', // Free money, no repayment
    'forgivable_loan', // Forgiven after X years
    'deferred_loan', // No payments until sale/refinance
    'low_interest_loan',
    'matched_savings',
    'tax_credit',
  ])),

  // Assistance amount
  assistanceAmount: z.object({
    type: z.enum(['fixed_amount', 'percentage', 'up_to']),
    amount: z.number().optional(),
    percentage: z.number().optional(), // Of home price or down payment
    max: z.number(),
  }),

  // Eligibility requirements
  eligibility: z.object({
    firstTimeBuyer: z.boolean(),
    firstTimeBuyerDefinition: z.string().optional(), // "No ownership in last 3 years"

    incomeLimit: z.object({
      single: z.number().optional(),
      family: z.number().optional(),
      areaMedianIncomePercentage: z.number().optional(), // E.g., 80% of AMI
    }).optional(),

    purchasePriceLimit: z.number().optional(),

    creditScoreMinimum: z.number().optional(),

    employmentRequirement: z.boolean(),
    residencyRequirement: z.string().optional(), // "Must live in home for 5 years"

    homeownerEducationRequired: z.boolean(),

    propertyTypesAllowed: z.array(z.enum([
      'single_family',
      'condo',
      'townhouse',
      'multi_family_2_4units',
    ])),

    occupancyRequirement: z.enum(['primary_residence_only', 'allows_second_home']),

    specialEligibility: z.array(z.enum([
      'teachers',
      'first_responders',
      'veterans',
      'healthcare_workers',
      'low_income',
      'disabled',
      'native_american',
    ])).optional(),
  }),

  // Restrictions & Requirements
  restrictions: z.object({
    mustUseParticipatingLender: z.boolean(),
    participatingLenders: z.array(z.string()).optional(),

    mustUseCertainLoanTypes: z.array(z.enum(['fha', 'conventional', 'va', 'usda'])).optional(),

    mustCompleteHousingCounseling: z.boolean(),

    repaymentTerms: z.string().optional(), // "Forgiven after 5 years"
    interestRate: z.number().optional(),
  }),

  // Funding status
  funding: z.object({
    currentlyAccepting: z.boolean(),
    waitlistAvailable: z.boolean(),
    nextFundingDate: z.date().optional(),
    annualFunding: z.number().optional(),
  }),

  // Application process
  applicationProcess: z.object({
    applicationUrl: z.string().url().optional(),
    applicationFee: z.number(),
    processingTime: z.string(), // "4-6 weeks"
    documentsRequired: z.array(z.string()),
  }),

  // Program benefits
  benefits: z.array(z.string()),

  status: z.enum(['active', 'inactive', 'waitlist', 'depleted']),

  lastUpdated: z.date(),
});

export type DownPaymentAssistance = z.infer<typeof DownPaymentAssistanceSchema>;

// ============================================================================
// RATE LOCK STRATEGY
// ============================================================================

/**
 * Rate lock timing strategy and recommendations
 */
export const RateLockStrategySchema = z.object({
  userId: z.string(),
  quoteId: z.string(),

  // Current market conditions
  marketConditions: z.object({
    currentTrend: z.enum(['rising', 'stable', 'falling']),
    volatility: z.enum(['low', 'moderate', 'high']),
    fedPolicy: z.enum(['raising', 'holding', 'lowering']),

    recentRateMovement: z.object({
      last7Days: z.number(), // Basis points change
      last30Days: z.number(),
      direction: z.enum(['up', 'down', 'flat']),
    }),
  }),

  // Lock period options
  lockOptions: z.array(z.object({
    period: z.number(), // Days (30, 45, 60)
    lockFee: z.number(),
    floatDownAvailable: z.boolean(),
    floatDownFee: z.number().optional(),
    extendable: z.boolean(),
    extensionFee: z.number().optional(),
  })),

  // Recommendation
  recommendation: z.object({
    recommendedAction: z.enum(['lock_now', 'float_and_monitor', 'wait'],
    reasoning: z.array(z.string()),
    recommendedLockPeriod: z.number().optional(),

    riskAssessment: z.object({
      lockNowRisk: z.enum(['low', 'moderate', 'high']),
      floatRisk: z.enum(['low', 'moderate', 'high']),
      analysis: z.string(),
    }),

    potentialSavings: z.object({
      ifRatesRise: z.number(), // Monthly payment difference
      ifRatesFall: z.number(),
    }),
  }),

  // User's timeline
  userTimeline: z.object({
    expectedClosingDate: z.date(),
    daysUntilClosing: z.number(),
    underContract: z.boolean(),
  }),

  generatedAt: z.date(),
});

export type RateLockStrategy = z.infer<typeof RateLockStrategySchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const MortgageSchemas = {
  MortgageLender: MortgageLenderSchema,
  MortgageRateQuote: MortgageRateQuoteSchema,
  PreApprovalApplication: PreApprovalApplicationSchema,
  DownPaymentAssistance: DownPaymentAssistanceSchema,
  RateLockStrategy: RateLockStrategySchema,
};
