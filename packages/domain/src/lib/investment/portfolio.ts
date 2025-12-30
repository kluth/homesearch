/**
 * Portfolio Management Schemas
 *
 * Track and manage owned investment properties.
 * Addresses User Story 3.3: Portfolio Management
 */

import { z } from 'zod';

/**
 * Property Ownership Status
 */
export enum OwnershipStatus {
  OWNED = 'owned',
  UNDER_CONTRACT = 'under_contract',
  SOLD = 'sold',
  FOR_SALE = 'for_sale',
}

/**
 * Tenant Lease Status
 */
export enum LeaseStatus {
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon', // Within 60 days
  EXPIRED = 'expired',
  MONTH_TO_MONTH = 'month_to_month',
  VACANT = 'vacant',
}

/**
 * Maintenance Category
 */
export enum MaintenanceCategory {
  REPAIR = 'repair',
  UPGRADE = 'upgrade',
  ROUTINE = 'routine',
  EMERGENCY = 'emergency',
  COSMETIC = 'cosmetic',
}

/**
 * Tenant Information
 */
export const TenantInfoSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),

  leaseStart: z.date(),
  leaseEnd: z.date(),
  monthlyRent: z.number(),
  securityDeposit: z.number(),

  status: z.nativeEnum(LeaseStatus),
  renewalLikelihood: z.enum(['low', 'medium', 'high']).optional(),

  paymentHistory: z.object({
    onTime: z.number(), // Count
    late: z.number(),
    missed: z.number(),
    averageDaysLate: z.number().optional(),
  }).optional(),

  notes: z.string().optional(),
});

export type TenantInfo = z.infer<typeof TenantInfoSchema>;

/**
 * Mortgage Information
 */
export const MortgageInfoSchema = z.object({
  lender: z.string(),
  loanNumber: z.string().optional(),

  originalPrincipal: z.number(),
  currentBalance: z.number(),
  interestRate: z.number(),
  monthlyPayment: z.number(),

  loanType: z.enum(['conventional', 'fha', 'va', 'usda', 'hard_money', 'portfolio']),
  loanTerm: z.number(), // Months
  remainingTerm: z.number(), // Months

  startDate: z.date(),
  maturityDate: z.date(),

  escrowAccount: z.object({
    hasEscrow: z.boolean(),
    monthlyEscrow: z.number(),
    includedItems: z.array(z.enum(['property_tax', 'insurance', 'hoa'])),
  }).optional(),
});

export type MortgageInfo = z.infer<typeof MortgageInfoSchema>;

/**
 * Property Expenses
 */
export const PropertyExpensesSchema = z.object({
  // Annual Expenses
  propertyTax: z.number(),
  insurance: z.number(),

  // Monthly Expenses
  hoa: z.number().default(0),
  propertyManagement: z.number().default(0), // Percentage or fixed
  utilities: z.number().default(0), // If owner-paid
  maintenance: z.number(), // Monthly average/reserve

  // Other
  other: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    frequency: z.enum(['monthly', 'annual', 'one-time']),
  })).optional(),

  // Calculated
  totalMonthly: z.number(),
  totalAnnual: z.number(),
});

export type PropertyExpenses = z.infer<typeof PropertyExpensesSchema>;

/**
 * Maintenance Record
 */
export const MaintenanceRecordSchema = z.object({
  id: z.string(),
  date: z.date(),
  description: z.string(),
  category: z.nativeEnum(MaintenanceCategory),

  cost: z.number(),
  vendor: z.string().optional(),

  warranty: z.object({
    hasWarranty: z.boolean(),
    expiresAt: z.date().optional(),
  }).optional(),

  attachments: z.array(z.object({
    type: z.enum(['receipt', 'invoice', 'photo', 'contract']),
    url: z.string().url(),
  })).optional(),

  notes: z.string().optional(),
});

export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;

/**
 * Property Document
 */
export const PropertyDocumentSchema = z.object({
  id: z.string(),
  type: z.enum([
    'deed',
    'title',
    'inspection',
    'appraisal',
    'survey',
    'lease',
    'tax_return',
    'insurance_policy',
    'hoa_docs',
    'renovation_plans',
    'permits',
    'warranty',
    'other',
  ]),

  name: z.string(),
  url: z.string().url(),
  uploadedAt: z.date(),
  expiresAt: z.date().optional(),

  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type PropertyDocument = z.infer<typeof PropertyDocumentSchema>;

/**
 * Property Performance Metrics
 */
export const PerformanceMetricsSchema = z.object({
  // Returns
  totalReturn: z.number(), // Percentage since purchase
  annualizedReturn: z.number(), // Percentage
  cashOnCashReturn: z.number(), // Percentage

  // Appreciation
  purchasePrice: z.number(),
  currentValue: z.number(),
  appreciation: z.number(), // Dollars
  appreciationPercent: z.number(),

  // Cash Flow
  monthlyRent: z.number(),
  monthlyExpenses: z.number(),
  monthlyCashFlow: z.number(),
  annualCashFlow: z.number(),

  // Ratios
  capRate: z.number(),
  debtServiceCoverageRatio: z.number(),
  operatingExpenseRatio: z.number(),

  // Equity
  equity: z.number(), // Current value - remaining mortgage
  equityPercent: z.number(),
  loanToValue: z.number(),

  // Tax Benefits
  estimatedAnnualDepreciation: z.number().optional(),
  estimatedTaxSavings: z.number().optional(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

/**
 * Owned Property
 */
export const OwnedPropertySchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Property Reference
  propertyId: z.string().optional(), // Link to property listing if exists
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    unit: z.string().optional(),
  }),

  // Ownership
  status: z.nativeEnum(OwnershipStatus),
  purchaseDate: z.date(),
  purchasePrice: z.number(),
  closingCosts: z.number().optional(),

  // Current Status
  currentValue: z.number(), // Updated monthly via AVM
  lastValueUpdate: z.date(),

  // Property Details
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFeet: z.number(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),

  // Investment Type
  isRental: z.boolean(),
  isPrimaryResidence: z.boolean().default(false),

  // Rental Information (if applicable)
  tenant: TenantInfoSchema.optional(),

  // Financing
  mortgage: MortgageInfoSchema.optional(),
  downPayment: z.number().optional(),

  // Expenses
  expenses: PropertyExpensesSchema,

  // Performance
  metrics: PerformanceMetricsSchema,

  // History
  maintenanceHistory: z.array(MaintenanceRecordSchema).optional(),
  documents: z.array(PropertyDocumentSchema).optional(),

  // Alerts & Reminders
  alerts: z.array(z.object({
    type: z.enum([
      'lease_expiring',
      'maintenance_due',
      'tax_due',
      'insurance_renewal',
      'inspection_due',
      'value_change',
    ]),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    dueDate: z.date().optional(),
  })).optional(),

  // Notes
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OwnedProperty = z.infer<typeof OwnedPropertySchema>;

/**
 * Portfolio Summary
 */
export const PortfolioSummarySchema = z.object({
  userId: z.string(),

  // Property Counts
  totalProperties: z.number(),
  rentalProperties: z.number(),
  primaryResidences: z.number(),
  vacantProperties: z.number(),

  // Values
  totalValue: z.number(),
  totalEquity: z.number(),
  totalDebt: z.number(),
  averagePropertyValue: z.number(),

  // Returns
  totalMonthlyRent: z.number(),
  totalMonthlyExpenses: z.number(),
  totalMonthlyCashFlow: z.number(),
  totalAnnualCashFlow: z.number(),

  // Performance
  averageCapRate: z.number(),
  averageCashOnCashReturn: z.number(),
  totalAppreciation: z.number(), // Dollars since inception
  totalAppreciationPercent: z.number(),

  // Portfolio Health
  averageOccupancyRate: z.number(),
  averageLeaseLength: z.number(), // Months
  maintenanceReserveBalance: z.number(),

  // By Location
  propertiesByState: z.record(z.number()),
  propertiesByCity: z.record(z.number()),

  // Projected
  projectedAnnualIncome: z.number(),
  projectedAnnualExpenses: z.number(),
  projectedAnnualCashFlow: z.number(),

  // Last Updated
  lastCalculated: z.date(),
});

export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

/**
 * Portfolio Dashboard
 */
export const PortfolioDashboardSchema = z.object({
  userId: z.string(),

  summary: PortfolioSummarySchema,
  properties: z.array(OwnedPropertySchema),

  // Recent Activity
  recentTransactions: z.array(z.object({
    propertyId: z.string(),
    type: z.enum(['purchase', 'sale', 'refinance', 'major_expense']),
    amount: z.number(),
    date: z.date(),
    description: z.string(),
  })).optional(),

  // Upcoming
  upcomingEvents: z.array(z.object({
    propertyId: z.string(),
    type: z.enum(['lease_expiration', 'mortgage_maturity', 'tax_payment', 'inspection']),
    date: z.date(),
    description: z.string(),
  })).optional(),

  // Alerts
  alerts: z.array(z.object({
    propertyId: z.string(),
    type: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    createdAt: z.date(),
  })),

  // Performance Over Time
  performanceHistory: z.array(z.object({
    month: z.string(), // YYYY-MM
    totalValue: z.number(),
    totalCashFlow: z.number(),
    occupancyRate: z.number(),
  })).optional(),
});

export type PortfolioDashboard = z.infer<typeof PortfolioDashboardSchema>;

/**
 * Portfolio Analysis Report
 */
export const PortfolioAnalysisReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  generatedAt: z.date(),

  // Diversification
  diversification: z.object({
    byLocation: z.object({
      concentration: z.number(), // Herfindahl index
      recommendation: z.string(),
    }),
    byPropertyType: z.object({
      concentration: z.number(),
      recommendation: z.string(),
    }),
  }),

  // Risk Assessment
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    mitigation: z.string(),
  })),

  // Opportunities
  opportunities: z.array(z.object({
    type: z.enum(['refinance', 'sell', 'renovate', 'acquire']),
    propertyId: z.string().optional(),
    description: z.string(),
    potentialGain: z.number(),
    effort: z.enum(['low', 'medium', 'high']),
  })),

  // Benchmarks
  benchmarks: z.object({
    yourCapRate: z.number(),
    marketCapRate: z.number(),
    yourCashOnCash: z.number(),
    marketCashOnCash: z.number(),
  }),

  // Recommendations
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high']),
    category: z.enum(['acquisition', 'disposition', 'financing', 'operations']),
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string(),
  })),
});

export type PortfolioAnalysisReport = z.infer<typeof PortfolioAnalysisReportSchema>;
