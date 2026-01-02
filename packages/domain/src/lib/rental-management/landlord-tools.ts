/**
 * Rental Property Management Suite
 * Complete landlord tools - tenant management, rent collection, maintenance, reporting
 * Pain Point: 68% of small landlords use spreadsheets, lack professional tools
 * Revenue Opportunity: $10-$25/unit/month for property management software, lead gen to PMs
 */

import { z } from 'zod';

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

/**
 * Comprehensive tenant profile and lease management
 */
export const TenantProfileSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  landlordId: z.string(),

  // Tenant details
  tenants: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    dateOfBirth: z.date().optional(),

    // Emergency contact
    emergencyContact: z.object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
    }).optional(),

    // Employment
    employer: z.string().optional(),
    jobTitle: z.string().optional(),
    employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']).optional(),
  })),

  primaryTenant: z.string(), // ID of primary tenant

  // Lease information
  lease: z.object({
    leaseId: z.string(),
    leaseType: z.enum(['fixed_term', 'month_to_month', 'lease_to_own']),

    startDate: z.date(),
    endDate: z.date().optional(),
    currentTerm: z.number(), // Months

    // Rent
    monthlyRent: z.number(),
    securityDeposit: z.number(),
    securityDepositHeld: z.number(), // May be less if deductions made
    petDeposit: z.number().optional(),

    // Payment terms
    rentDueDay: z.number(), // Day of month
    lateFeeGracePeriod: z.number(), // Days
    lateFeeAmount: z.number(),

    // Renewals
    autoRenewal: z.boolean(),
    renewalNoticeRequired: z.number().optional(), // Days
    renewalStatus: z.enum(['active', 'renewal_pending', 'non_renewal_notice_given', 'expired']),
  }),

  // Occupancy
  occupancy: z.object({
    moveInDate: z.date(),
    moveOutDate: z.date().optional(),
    status: z.enum(['current', 'notice_given', 'moved_out']),
    noticeGivenDate: z.date().optional(),
    expectedMoveOutDate: z.date().optional(),
  }),

  // Pets
  pets: z.array(z.object({
    type: z.enum(['dog', 'cat', 'bird', 'fish', 'other']),
    breed: z.string().optional(),
    name: z.string(),
    weight: z.number().optional(),
  })).optional(),

  // Vehicles
  vehicles: z.array(z.object({
    make: z.string(),
    model: z.string(),
    color: z.string(),
    licensePlate: z.string(),
    parkingSpotNumber: z.string().optional(),
  })).optional(),

  // Documents
  documents: z.array(z.object({
    type: z.enum([
      'lease_agreement',
      'application',
      'background_check',
      'credit_report',
      'income_verification',
      'pet_agreement',
      'parking_agreement',
      'move_in_checklist',
      'move_out_checklist',
      'other',
    ]),
    fileName: z.string(),
    uploadDate: z.date(),
    url: z.string().url(),
  })).optional(),

  // Tenant history
  tenantHistory: z.object({
    onTimePaymentRate: z.number(), // Percentage
    latePayments: z.number(),
    maintenanceRequests: z.number(),
    leaseViolations: z.number(),
    rating: z.enum(['excellent', 'good', 'fair', 'poor']),
  }),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type TenantProfile = z.infer<typeof TenantProfileSchema>;

// ============================================================================
// RENT COLLECTION
// ============================================================================

/**
 * Rent payment tracking and collection
 */
export const RentPaymentSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  tenantId: z.string(),
  landlordId: z.string(),

  // Payment details
  dueDate: z.date(),
  amount: z.number(),
  period: z.string(), // "January 2024"

  // Payment status
  status: z.enum(['pending', 'paid', 'partial', 'late', 'failed', 'waived']),

  // Payment received
  paymentDate: z.date().optional(),
  paymentMethod: z.enum(['ach', 'credit_card', 'check', 'cash', 'money_order', 'other']).optional(),
  confirmationNumber: z.string().optional(),
  amountPaid: z.number().optional(),

  // Late fees
  daysLate: z.number().optional(),
  lateFeeAssessed: z.number().optional(),
  lateFeeWaived: z.boolean().optional(),

  // Partial payments
  partialPayments: z.array(z.object({
    date: z.date(),
    amount: z.number(),
    method: z.string(),
  })).optional(),

  // Outstanding balance
  outstandingBalance: z.number(),

  // Notes
  notes: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type RentPayment = z.infer<typeof RentPaymentSchema>;

/**
 * Rent collection overview for landlord
 */
export const RentCollectionDashboardSchema = z.object({
  landlordId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),

  // Summary metrics
  summary: z.object({
    totalUnits: z.number(),
    occupiedUnits: z.number(),
    vacantUnits: z.number(),
    occupancyRate: z.number(),

    // Financial
    totalRentDue: z.number(),
    totalRentCollected: z.number(),
    collectionRate: z.number(),
    outstandingBalance: z.number(),

    // Payment timing
    onTimePayments: z.number(),
    latePayments: z.number(),
    onTimePaymentRate: z.number(),

    // Late fees
    lateFeesDue: z.number(),
    lateFeesCollected: z.number(),
  }),

  // Property breakdown
  properties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),

    rentDue: z.number(),
    rentCollected: z.number(),
    outstanding: z.number(),
    status: z.enum(['fully_paid', 'partial', 'outstanding', 'late']),
  })),

  // Tenants needing attention
  tenantsNeedingAttention: z.array(z.object({
    tenantId: z.string(),
    name: z.string(),
    propertyAddress: z.string(),
    issue: z.enum(['late_payment', 'partial_payment', 'multiple_late_payments', 'non_payment']),
    daysLate: z.number().optional(),
    amountOwed: z.number(),
    action: z.string(), // "Send reminder", "Start eviction process"
  })),

  // Upcoming due dates
  upcomingPayments: z.array(z.object({
    tenantId: z.string(),
    propertyId: z.string(),
    dueDate: z.date(),
    amount: z.number(),
  })),

  lastUpdated: z.date(),
});

export type RentCollectionDashboard = z.infer<typeof RentCollectionDashboardSchema>;

// ============================================================================
// MAINTENANCE REQUESTS
// ============================================================================

/**
 * Tenant maintenance request tracking
 */
export const MaintenanceRequestSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  tenantId: z.string(),
  landlordId: z.string(),

  // Request details
  title: z.string(),
  description: z.string(),
  category: z.enum([
    'plumbing',
    'electrical',
    'hvac',
    'appliance',
    'structural',
    'pest_control',
    'locks_keys',
    'water_leak',
    'fire_safety',
    'other',
  ]),

  priority: z.enum(['low', 'medium', 'high', 'emergency']),
  status: z.enum(['submitted', 'acknowledged', 'scheduled', 'in_progress', 'completed', 'cancelled']),

  // Location
  location: z.string().optional(), // "Kitchen sink", "Master bedroom"
  photos: z.array(z.string().url()).optional(),

  // Assignment
  assignedTo: z.object({
    type: z.enum(['landlord', 'property_manager', 'contractor', 'vendor']),
    name: z.string(),
    company: z.string().optional(),
    phone: z.string(),
  }).optional(),

  // Scheduling
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  tenantAvailability: z.string().optional(),

  // Permission to enter
  permissionToEnter: z.boolean(),
  entryNoticeGiven: z.boolean(),
  entryNoticeDate: z.date().optional(),

  // Completion
  completedDate: z.date().optional(),
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),

  // Cost
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  paidBy: z.enum(['landlord', 'tenant']).optional(),
  tenantResponsible: z.boolean(), // Damage caused by tenant

  // Invoice
  invoiceId: z.string().optional(),
  invoiceUrl: z.string().url().optional(),

  // Communication
  messages: z.array(z.object({
    from: z.enum(['tenant', 'landlord', 'contractor']),
    message: z.string(),
    timestamp: z.date(),
  })).optional(),

  // Satisfaction
  tenantSatisfaction: z.enum(['dissatisfied', 'neutral', 'satisfied', 'very_satisfied']).optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type MaintenanceRequest = z.infer<typeof MaintenanceRequestSchema>;

// ============================================================================
// PROPERTY FINANCIALS
// ============================================================================

/**
 * Financial tracking for rental property
 */
export const PropertyFinancialsSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  landlordId: z.string(),
  year: z.number(),

  // Income
  income: z.object({
    // Rental income
    rentIncome: z.number(),
    lateFeesCollected: z.number(),
    petRent: z.number().optional(),
    parkingIncome: z.number().optional(),
    storageIncome: z.number().optional(),
    otherIncome: z.number().optional(),

    totalIncome: z.number(),

    // Monthly breakdown
    monthlyBreakdown: z.array(z.object({
      month: z.enum(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
      income: z.number(),
    })),
  }),

  // Expenses
  expenses: z.object({
    // Mortgage
    mortgagePayments: z.number(),
    propertyTax: z.number(),
    insurance: z.number(),
    hoaFees: z.number().optional(),

    // Operating expenses
    repairs: z.number(),
    maintenance: z.number(),
    utilities: z.number().optional(), // If landlord pays
    propertyManagement: z.number().optional(),
    advertising: z.number().optional(),
    lawnCare: z.number().optional(),
    snowRemoval: z.number().optional(),
    pestControl: z.number().optional(),

    // Professional services
    legal: z.number().optional(),
    accounting: z.number().optional(),

    // Other
    supplies: z.number().optional(),
    travel: z.number().optional(),
    other: z.number().optional(),

    totalExpenses: z.number(),

    // Breakdown by category
    categoryBreakdown: z.array(z.object({
      category: z.string(),
      amount: z.number(),
      percentOfTotal: z.number(),
    })),
  }),

  // Net operating income
  noi: z.number(), // Income - operating expenses (excluding debt service)

  // Cash flow
  cashFlow: z.object({
    netOperatingIncome: z.number(),
    debtService: z.number(),
    cashFlowBeforeTax: z.number(),
    taxBenefit: z.number().optional(),
    cashFlowAfterTax: z.number(),
  }),

  // Performance metrics
  metrics: z.object({
    capRate: z.number(),
    cashOnCashReturn: z.number(),
    grossRentMultiplier: z.number(),
    operatingExpenseRatio: z.number(), // Expenses / Income
    debtServiceCoverageRatio: z.number(),
  }),

  // Tax information
  taxInfo: z.object({
    depreciation: z.number(),
    mortgageInterestDeduction: z.number(),
    propertyTaxDeduction: z.number(),
    totalDeductions: z.number(),
    taxableIncome: z.number(),
  }),

  // Capital expenditures (separate from operating expenses)
  capitalExpenditures: z.array(z.object({
    description: z.string(),
    category: z.enum(['roof', 'hvac', 'appliances', 'flooring', 'windows', 'other']),
    amount: z.number(),
    date: z.date(),
    depreciable: z.boolean(),
  })).optional(),

  lastUpdated: z.date(),
});

export type PropertyFinancials = z.infer<typeof PropertyFinancialsSchema>;

// ============================================================================
// LEASE COMPLIANCE & VIOLATIONS
// ============================================================================

/**
 * Track lease violations and compliance issues
 */
export const LeaseViolationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  tenantId: z.string(),
  landlordId: z.string(),

  // Violation details
  violationType: z.enum([
    'late_payment',
    'noise_complaint',
    'unauthorized_occupant',
    'unauthorized_pet',
    'property_damage',
    'illegal_activity',
    'lease_terms_breach',
    'hoa_violation',
    'parking_violation',
    'smoking_violation',
    'other',
  ]),

  description: z.string(),
  severity: z.enum(['minor', 'moderate', 'serious', 'severe']),

  // Discovery
  discoveredDate: z.date(),
  reportedBy: z.enum(['landlord', 'property_manager', 'neighbor', 'hoa', 'tenant']),

  // Documentation
  evidence: z.array(z.object({
    type: z.enum(['photo', 'video', 'document', 'witness_statement']),
    url: z.string().url(),
    description: z.string().optional(),
  })).optional(),

  // Resolution
  status: z.enum(['open', 'notice_sent', 'under_review', 'resolved', 'escalated', 'legal_action']),

  // Notices sent
  notices: z.array(z.object({
    noticeType: z.enum(['verbal_warning', 'written_warning', 'cure_or_quit', 'eviction_notice']),
    sentDate: z.date(),
    dueDate: z.date().optional(), // Cure by date
    method: z.enum(['email', 'certified_mail', 'hand_delivered', 'posted']),
    tracking: z.string().optional(),
  })).optional(),

  // Resolution
  resolvedDate: z.date().optional(),
  resolutionNotes: z.string().optional(),
  resolutionAction: z.enum(['warning', 'fine', 'lease_modification', 'eviction', 'dismissed']).optional(),

  // Fines/charges
  fineAmount: z.number().optional(),
  finePaid: z.boolean().optional(),

  // Legal escalation
  legalAction: z.object({
    required: z.boolean(),
    attorney: z.string().optional(),
    caseNumber: z.string().optional(),
    courtDate: z.date().optional(),
    outcome: z.string().optional(),
  }).optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type LeaseViolation = z.infer<typeof LeaseViolationSchema>;

// ============================================================================
// VACANCY MANAGEMENT
// ============================================================================

/**
 * Track vacancies and marketing for new tenants
 */
export const VacancyManagementSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  landlordId: z.string(),

  // Vacancy details
  vacancyStatus: z.enum(['occupied', 'notice_given', 'vacant', 'being_marketed', 'application_pending']),

  // Current tenant move-out
  currentTenant: z.object({
    tenantId: z.string(),
    noticeGivenDate: z.date().optional(),
    plannedMoveOutDate: z.date(),
    actualMoveOutDate: z.date().optional(),
  }).optional(),

  // Vacancy period
  vacantDate: z.date().optional(),
  targetRentReadyDate: z.date().optional(),
  actualRentReadyDate: z.date().optional(),

  // Turnover tasks
  turnoverTasks: z.array(z.object({
    task: z.string(),
    category: z.enum(['cleaning', 'repairs', 'painting', 'flooring', 'appliances', 'inspection', 'other']),
    status: z.enum(['pending', 'in_progress', 'completed']),
    assignedTo: z.string().optional(),
    estimatedCost: z.number().optional(),
    actualCost: z.number().optional(),
    completedDate: z.date().optional(),
  })),

  totalTurnoverCost: z.number(),

  // Marketing
  marketing: z.object({
    listingActive: z.boolean(),
    listingDate: z.date().optional(),

    // Rental terms
    monthlyRent: z.number(),
    securityDeposit: z.number(),
    availableDate: z.date(),

    // Marketing channels
    channels: z.array(z.enum([
      'zillow',
      'apartments_com',
      'craigslist',
      'facebook_marketplace',
      'company_website',
      'yard_sign',
      'referral',
      'other',
    ])),

    // Listing performance
    views: z.number().optional(),
    inquiries: z.number().optional(),
    showings: z.number().optional(),
    applications: z.number().optional(),

    // Photos
    photos: z.array(z.string().url()).optional(),
    virtualTour: z.string().url().optional(),
  }).optional(),

  // Applications received
  applications: z.array(z.object({
    applicantId: z.string(),
    applicantName: z.string(),
    applicationDate: z.date(),
    status: z.enum(['submitted', 'under_review', 'approved', 'denied', 'withdrawn']),

    // Screening
    creditScore: z.number().optional(),
    income: z.number().optional(),
    employmentVerified: z.boolean().optional(),
    backgroundCheckClear: z.boolean().optional(),
    referencesChecked: z.boolean().optional(),
  })).optional(),

  // Lease signing
  newLease: z.object({
    tenantId: z.string(),
    leaseSignedDate: z.date(),
    moveInDate: z.date(),
  }).optional(),

  // Vacancy metrics
  metrics: z.object({
    vacancyStartDate: z.date().optional(),
    vacancyEndDate: z.date().optional(),
    daysVacant: z.number(),
    lostRentIncome: z.number(),

    timeToMarket: z.number().optional(), // Days from vacant to listed
    timeToLease: z.number().optional(), // Days from listed to lease signed
  }),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type VacancyManagement = z.infer<typeof VacancyManagementSchema>;

// ============================================================================
// LANDLORD LEGAL COMPLIANCE
// ============================================================================

/**
 * Track legal compliance requirements for landlords
 */
export const LandlordComplianceSchema = z.object({
  landlordId: z.string(),
  propertyId: z.string(),
  state: z.string(),
  city: z.string(),

  // Required licenses & permits
  licenses: z.array(z.object({
    type: z.enum(['rental_license', 'business_license', 'tax_registration', 'other']),
    licenseNumber: z.string().optional(),
    issuedDate: z.date().optional(),
    expirationDate: z.date().optional(),
    status: z.enum(['required', 'applied', 'active', 'expired', 'not_required']),
    renewalReminder: z.boolean(),
  })),

  // Required disclosures
  requiredDisclosures: z.array(z.object({
    disclosure: z.enum([
      'lead_paint',
      'mold',
      'radon',
      'flood_zone',
      'bedbug_history',
      'sex_offender_registry',
      'utility_costs',
      'smoking_policy',
      'bed_bug_disclosure',
      'other',
    ]),
    required: z.boolean(),
    provided: z.boolean(),
    dateProvided: z.date().optional(),
  })),

  // Required inspections
  inspections: z.array(z.object({
    type: z.enum(['habitability', 'fire_safety', 'health', 'annual', 'move_in', 'move_out']),
    required: z.boolean(),
    frequency: z.enum(['one_time', 'annual', 'biennial', 'as_needed']).optional(),
    lastInspectionDate: z.date().optional(),
    nextInspectionDue: z.date().optional(),
    passed: z.boolean().optional(),
    notes: z.string().optional(),
  })),

  // Security deposit rules
  securityDepositRules: z.object({
    maxDeposit: z.number().optional(), // In months of rent or fixed amount
    separateAccount: z.boolean(), // Required in some states
    interestRequired: z.boolean(),
    returnDeadline: z.number(), // Days after move-out
    itemizedListRequired: z.boolean(),
    walkThroughRequired: z.boolean(),
  }),

  // Notice requirements
  noticeRequirements: z.object({
    entryNotice: z.number(), // Hours/days required
    rentIncrease: z.number(), // Days notice
    leaseTermination: z.number(), // Days notice
    eviction: z.number(), // Days for cure or quit
  }),

  // Fair housing compliance
  fairHousing: z.object({
    trainingCompleted: z.boolean(),
    trainingDate: z.date().optional(),
    lastUpdated: z.date().optional(),

    // Compliance checklist
    checklist: z.array(z.object({
      requirement: z.string(),
      compliant: z.boolean(),
      notes: z.string().optional(),
    })).optional(),
  }),

  // Insurance requirements
  insurance: z.object({
    landlordInsuranceActive: z.boolean(),
    policyNumber: z.string().optional(),
    expirationDate: z.date().optional(),
    coverageAmount: z.number().optional(),

    umbrellaPolicy: z.boolean(),
    umbrellaAmount: z.number().optional(),

    tenantInsuranceRequired: z.boolean(),
    tenantInsuranceVerified: z.boolean().optional(),
  }),

  // Compliance status
  overallCompliance: z.enum(['compliant', 'needs_attention', 'non_compliant']),
  complianceIssues: z.array(z.object({
    issue: z.string(),
    severity: z.enum(['minor', 'moderate', 'serious']),
    dueDate: z.date().optional(),
  })).optional(),

  lastReviewDate: z.date(),
});

export type LandlordCompliance = z.infer<typeof LandlordComplianceSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const RentalManagementSchemas = {
  TenantProfile: TenantProfileSchema,
  RentPayment: RentPaymentSchema,
  RentCollectionDashboard: RentCollectionDashboardSchema,
  MaintenanceRequest: MaintenanceRequestSchema,
  PropertyFinancials: PropertyFinancialsSchema,
  LeaseViolation: LeaseViolationSchema,
  VacancyManagement: VacancyManagementSchema,
  LandlordCompliance: LandlordComplianceSchema,
};
