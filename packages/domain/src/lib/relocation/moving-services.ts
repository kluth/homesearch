/**
 * Moving & Relocation Hub
 * Comprehensive moving coordination - one of life's top 5 stressors
 * Addresses massive pain point: 80% of movers report the process as "very stressful"
 */

import { z } from 'zod';

// ============================================================================
// MOVING PLAN
// ============================================================================

/**
 * Comprehensive moving plan for a user
 */
export const MovingPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Move details
  moveType: z.enum(['local', 'long_distance', 'international']),
  currentAddress: z.string(),
  newAddress: z.string(),
  distance: z.number(), // Miles

  // Timeline
  moveDate: z.date(),
  flexibleDates: z.boolean().default(false),
  flexibilityWindow: z.number().optional(), // Days before/after
  createdDate: z.date(),

  // Move size
  homeSize: z.enum(['studio', '1br', '2br', '3br', '4br', '5br_plus']),
  estimatedWeight: z.number().optional(), // Pounds
  rooms: z.number(),

  // Inventory
  furniture: z.array(z.object({
    item: z.string(),
    quantity: z.number(),
    weight: z.number().optional(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
    requiresDisassembly: z.boolean().default(false),
    fragile: z.boolean().default(false),
  })).optional(),

  // Special requirements
  specialItems: z.object({
    piano: z.boolean(),
    pool_table: z.boolean(),
    art: z.boolean(),
    antiques: z.boolean(),
    safes: z.boolean(),
    hot_tub: z.boolean(),
  }).optional(),

  // Services needed
  servicesNeeded: z.array(z.enum([
    'full_service_packing',
    'partial_packing',
    'loading_unloading',
    'storage',
    'vehicle_transport',
    'pet_transport',
    'piano_moving',
    'cleaning',
  ])),

  // Budget
  budget: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),

  // Status
  status: z.enum(['planning', 'quotes_requested', 'mover_booked', 'in_progress', 'completed']),

  // Progress tracking
  progress: z.object({
    moverBooked: z.boolean().default(false),
    utilitiesScheduled: z.boolean().default(false),
    addressChanged: z.boolean().default(false),
    packingStarted: z.boolean().default(false),
    cleaningScheduled: z.boolean().default(false),
    completionPercentage: z.number().min(0).max(100).default(0),
  }),
});

export type MovingPlan = z.infer<typeof MovingPlanSchema>;

// ============================================================================
// MOVING COMPANY QUOTES
// ============================================================================

/**
 * Quote from a moving company
 */
export const MovingQuoteSchema = z.object({
  id: z.string(),
  movingPlanId: z.string(),
  userId: z.string(),

  // Moving company
  company: z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string().url().optional(),
    rating: z.number().min(1).max(5),
    reviewCount: z.number(),
    yearsInBusiness: z.number(),

    // Credentials
    licensed: z.boolean(),
    insured: z.boolean(),
    bonded: z.boolean(),
    dotNumber: z.string().optional(), // DOT number for interstate movers
    mcNumber: z.string().optional(), // MC number

    // Certifications
    certifications: z.array(z.enum([
      'amsa', // American Moving & Storage Association
      'bbb_accredited',
      'pro_mover',
      'certified_professional_mover',
    ])).optional(),
  }),

  // Quote details
  quoteType: z.enum(['binding', 'non_binding', 'binding_not_to_exceed']),

  // Pricing
  pricing: z.object({
    baseRate: z.number(),
    packingMaterials: z.number().optional(),
    packingService: z.number().optional(),
    storage: z.number().optional(),
    insurance: z.number().optional(),
    fuelSurcharge: z.number().optional(),
    longCarry: z.number().optional(), // Extra for distance from truck to door
    stairs: z.number().optional(),
    elevator: z.number().optional(),
    disassemblyReassembly: z.number().optional(),

    subtotal: z.number(),
    taxes: z.number(),
    total: z.number(),
  }),

  // Estimate range (for non-binding quotes)
  estimateRange: z.object({
    low: z.number(),
    high: z.number(),
  }).optional(),

  // Services included
  servicesIncluded: z.array(z.string()),

  // Timeline
  estimatedDuration: z.object({
    loadingHours: z.number(),
    transitDays: z.number().optional(),
    unloadingHours: z.number(),
  }),

  // Insurance coverage
  insurance: z.object({
    basicCoverage: z.number(), // Per pound (typically $0.60/lb)
    fullValueProtection: z.object({
      available: z.boolean(),
      cost: z.number(),
      coverage: z.number(),
    }).optional(),
  }),

  // Availability
  availability: z.object({
    canAccommodateDate: z.boolean(),
    alternativeDates: z.array(z.date()).optional(),
  }),

  // Payment terms
  paymentTerms: z.object({
    depositRequired: z.number(), // Percentage
    depositDue: z.date().optional(),
    balanceDue: z.enum(['before_move', 'at_delivery', 'after_delivery']),
    acceptedPayments: z.array(z.enum(['cash', 'check', 'credit_card', 'debit_card', 'wire_transfer'])),
  }),

  // Quote validity
  validUntil: z.date(),

  // Status
  status: z.enum(['pending', 'received', 'accepted', 'declined', 'expired']),

  // User actions
  userNotes: z.string().optional(),

  receivedAt: z.date(),
  respondedAt: z.date().optional(),
});

export type MovingQuote = z.infer<typeof MovingQuoteSchema>;

// ============================================================================
// UTILITIES COORDINATION
// ============================================================================

/**
 * Utility service to be set up or disconnected
 */
export const UtilityServiceSchema = z.object({
  id: z.string(),
  movingPlanId: z.string(),
  userId: z.string(),

  // Service type
  serviceType: z.enum([
    'electricity',
    'natural_gas',
    'water',
    'sewer',
    'trash',
    'internet',
    'cable_tv',
    'phone',
    'security_system',
  ]),

  // Location
  address: z.string(),
  action: z.enum(['disconnect', 'transfer', 'new_setup']),

  // Provider
  provider: z.object({
    name: z.string(),
    phone: z.string(),
    accountNumber: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),

  // Scheduling
  scheduledDate: z.date().optional(),
  preferredTimeWindow: z.enum(['morning', 'afternoon', 'all_day']).optional(),
  confirmationNumber: z.string().optional(),

  // Status
  status: z.enum([
    'not_started',
    'researching_providers',
    'provider_selected',
    'scheduled',
    'in_progress',
    'completed',
    'issue',
  ]).default('not_started'),

  // Costs
  setupFee: z.number().optional(),
  deposit: z.number().optional(),
  monthlyEstimate: z.number().optional(),

  // Notes
  notes: z.string().optional(),

  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type UtilityService = z.infer<typeof UtilityServiceSchema>;

/**
 * Utility provider comparison
 */
export const UtilityProviderComparisonSchema = z.object({
  serviceType: z.enum(['electricity', 'natural_gas', 'internet', 'cable_tv']),
  address: z.string(),
  zipCode: z.string(),

  providers: z.array(z.object({
    name: z.string(),
    logo: z.string().url().optional(),

    // Plans
    plans: z.array(z.object({
      name: z.string(),
      monthlyPrice: z.number(),

      // Service-specific details
      speed: z.number().optional(), // Mbps for internet
      dataLimit: z.number().optional(), // GB for internet
      channels: z.number().optional(), // For cable TV
      contractLength: z.number().optional(), // Months

      features: z.array(z.string()),
    })),

    // Ratings
    rating: z.number().min(1).max(5).optional(),
    reviewCount: z.number().optional(),

    // Fees
    installationFee: z.number().optional(),
    equipmentRental: z.number().optional(),
    deposit: z.number().optional(),

    // Availability
    available: z.boolean(),
    installationWait: z.number().optional(), // Days
  })),

  recommendations: z.array(z.object({
    providerId: z.string(),
    reason: z.string(),
    estimatedMonthlySavings: z.number().optional(),
  })).optional(),

  generatedAt: z.date(),
});

export type UtilityProviderComparison = z.infer<typeof UtilityProviderComparisonSchema>;

// ============================================================================
// CHANGE OF ADDRESS
// ============================================================================

/**
 * Change of address management
 */
export const ChangeOfAddressSchema = z.object({
  id: z.string(),
  movingPlanId: z.string(),
  userId: z.string(),

  // Addresses
  oldAddress: z.string(),
  newAddress: z.string(),
  effectiveDate: z.date(),

  // USPS mail forwarding
  uspsForwarding: z.object({
    status: z.enum(['not_started', 'in_progress', 'submitted', 'active']),
    duration: z.enum(['temporary_6months', 'permanent']),
    confirmationNumber: z.string().optional(),
    submittedDate: z.date().optional(),
    cost: z.number().optional(), // ~$1.10 verification fee
  }).optional(),

  // Organizations to notify
  notifications: z.array(z.object({
    category: z.enum([
      'government', // IRS, DMV, voter registration, passport
      'financial', // Banks, credit cards, investment accounts
      'insurance', // Auto, health, life, home/renters
      'subscriptions', // Magazines, streaming services, memberships
      'healthcare', // Doctors, dentists, pharmacies
      'education', // Schools, student loans
      'employment', // Employer, payroll
      'automotive', // Car registration, insurance, AAA
      'professional', // Professional licenses, bar association
      'utilities', // Already handled by UtilityService
      'other',
    ]),
    organization: z.string(),
    accountNumber: z.string().optional(),

    // Contact methods
    updateMethod: z.enum(['online', 'phone', 'mail', 'in_person']),
    website: z.string().url().optional(),
    phone: z.string().optional(),

    // Status
    status: z.enum(['pending', 'in_progress', 'completed', 'not_applicable']),
    completedDate: z.date().optional(),
    notes: z.string().optional(),
  })),

  // Auto-generated checklist completion
  completionPercentage: z.number().min(0).max(100).default(0),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type ChangeOfAddress = z.infer<typeof ChangeOfAddressSchema>;

// ============================================================================
// MOVING CHECKLIST & TASKS
// ============================================================================

/**
 * Comprehensive moving checklist
 */
export const MovingChecklistSchema = z.object({
  id: z.string(),
  movingPlanId: z.string(),
  userId: z.string(),

  // Timeline-based tasks
  tasks: z.array(z.object({
    id: z.string(),

    // Task details
    title: z.string(),
    description: z.string().optional(),
    category: z.enum([
      'planning',
      'packing',
      'utilities',
      'address_change',
      'cleaning',
      'services',
      'kids_pets',
      'day_of_move',
      'settling_in',
    ]),

    // Timing
    dueDate: z.date().optional(),
    daysBeforeMove: z.number().optional(), // E.g., 60 days before
    priority: z.enum(['low', 'medium', 'high', 'critical']),

    // Status
    status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
    completedDate: z.date().optional(),

    // Assignment
    assignedTo: z.string().optional(), // userId for shared moves

    // Resources
    estimatedTime: z.number().optional(), // Minutes
    estimatedCost: z.number().optional(),
    resources: z.array(z.object({
      type: z.enum(['link', 'document', 'video', 'checklist']),
      title: z.string(),
      url: z.string().url(),
    })).optional(),

    // Notes
    notes: z.string().optional(),
  })),

  // Overall progress
  totalTasks: z.number(),
  completedTasks: z.number(),
  completionPercentage: z.number().min(0).max(100),

  // Milestones
  milestones: z.array(z.object({
    name: z.string(),
    date: z.date(),
    completed: z.boolean(),
  })).optional(),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type MovingChecklist = z.infer<typeof MovingChecklistSchema>;

// ============================================================================
// STORAGE SOLUTIONS
// ============================================================================

/**
 * Storage facility options
 */
export const StorageFacilitySchema = z.object({
  id: z.string(),
  movingPlanId: z.string().optional(),

  // Facility info
  name: z.string(),
  address: z.string(),
  distance: z.number(), // Miles from property

  // Contact
  phone: z.string(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),

  // Ratings
  rating: z.number().min(1).max(5).optional(),
  reviewCount: z.number().optional(),

  // Available units
  units: z.array(z.object({
    size: z.enum(['5x5', '5x10', '10x10', '10x15', '10x20', '10x25', '10x30']),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number().optional(),
    }),
    squareFeet: z.number(),

    // Pricing
    monthlyRate: z.number(),
    promotionalRate: z.number().optional(),
    securityDeposit: z.number().optional(),
    adminFee: z.number().optional(),

    // Features
    climateControlled: z.boolean(),
    indoor: z.boolean(),
    driveUp: z.boolean(),

    // Availability
    available: z.boolean(),
    availableDate: z.date().optional(),
  })),

  // Facility features
  features: z.object({
    twentyFourHourAccess: z.boolean(),
    securityCameras: z.boolean(),
    gatedAccess: z.boolean(),
    onSiteManager: z.boolean(),
    elevator: z.boolean(),
    movingTruckRental: z.boolean(),
    packingSupplies: z.boolean(),
    insurance: z.boolean(),
  }),

  // Operating hours
  accessHours: z.object({
    type: z.enum(['24/7', 'business_hours', 'extended_hours']),
    details: z.string().optional(),
  }),
});

export type StorageFacility = z.infer<typeof StorageFacilitySchema>;

// ============================================================================
// MOVING INSURANCE
// ============================================================================

/**
 * Additional moving insurance options
 */
export const MovingInsuranceSchema = z.object({
  id: z.string(),
  movingPlanId: z.string(),
  userId: z.string(),

  // Insurance provider
  provider: z.object({
    name: z.string(),
    rating: z.number().min(1).max(5).optional(),
    phone: z.string(),
    website: z.string().url().optional(),
  }),

  // Coverage options
  coverageType: z.enum([
    'basic_liability', // Included with movers, usually $0.60/lb
    'full_value_protection', // Mover-provided
    'third_party_insurance', // Separate insurance company
  ]),

  // Coverage details
  coverage: z.object({
    totalValue: z.number(), // Declared value of items
    premium: z.number(),
    deductible: z.number(),
    perItemLimit: z.number().optional(),
  }),

  // What's covered
  itemsCovered: z.array(z.object({
    item: z.string(),
    declaredValue: z.number(),
    category: z.enum(['furniture', 'electronics', 'art', 'jewelry', 'antiques', 'other']),
    requiresAppraisal: z.boolean().default(false),
  })).optional(),

  // Policy period
  effectiveDate: z.date(),
  expirationDate: z.date(),

  // Status
  status: z.enum(['quote', 'purchased', 'active', 'expired', 'claimed']),
  policyNumber: z.string().optional(),

  purchasedAt: z.date().optional(),
});

export type MovingInsurance = z.infer<typeof MovingInsuranceSchema>;

// ============================================================================
// RELOCATION PACKAGE (For corporate moves)
// ============================================================================

/**
 * Corporate relocation package
 */
export const RelocationPackageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  employerId: z.string().optional(),

  // Package details
  packageType: z.enum(['standard', 'mid_level', 'executive', 'custom']),

  // Benefits included
  benefits: z.object({
    // Moving
    fullServiceMove: z.boolean(),
    movingBudget: z.number().optional(),
    storageMonths: z.number().optional(),

    // Travel
    househuntingTrips: z.number().optional(),
    flightsCovered: z.boolean(),
    hotelNights: z.number().optional(),
    rentalCar: z.boolean(),

    // Home sale/purchase
    homeSaleAssistance: z.boolean(),
    homeSaleGuarantee: z.boolean(),
    closingCostAssistance: z.number().optional(),

    // Temporary housing
    temporaryHousingMonths: z.number().optional(),
    temporaryHousingBudget: z.number().optional(),

    // Spouse/partner
    spouseCareerAssistance: z.boolean(),

    // Tax
    taxGrossUp: z.boolean(), // Company pays taxes on relocation benefits

    // Miscellaneous
    miscellaneousAllowance: z.number().optional(),
  }),

  // Total package value
  totalValue: z.number(),
  employerPaid: z.number(),
  employeeResponsible: z.number(),

  // Repayment terms (if employee leaves)
  repaymentClause: z.object({
    hasClause: z.boolean(),
    repaymentPeriod: z.number().optional(), // Months employee must stay
    repaymentPercentage: z.number().optional(), // % to repay if leaving early
  }).optional(),

  // Status
  status: z.enum(['offered', 'accepted', 'in_progress', 'completed']),

  createdAt: z.date(),
});

export type RelocationPackage = z.infer<typeof RelocationPackageSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const RelocationSchemas = {
  MovingPlan: MovingPlanSchema,
  MovingQuote: MovingQuoteSchema,
  UtilityService: UtilityServiceSchema,
  UtilityProviderComparison: UtilityProviderComparisonSchema,
  ChangeOfAddress: ChangeOfAddressSchema,
  MovingChecklist: MovingChecklistSchema,
  StorageFacility: StorageFacilitySchema,
  MovingInsurance: MovingInsuranceSchema,
  RelocationPackage: RelocationPackageSchema,
};
