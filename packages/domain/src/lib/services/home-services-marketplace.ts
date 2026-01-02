/**
 * Home Services Marketplace
 * Vetted professionals for every stage of homeownership
 * Revenue opportunity: Lead generation fees from service providers ($25-$150 per lead)
 */

import { z } from 'zod';

// ============================================================================
// SERVICE PROVIDER
// ============================================================================

/**
 * Service categories
 */
export enum ServiceCategory {
  // Pre-purchase
  HOME_INSPECTION = 'home_inspection',
  APPRAISAL = 'appraisal',
  PEST_INSPECTION = 'pest_inspection',
  RADON_TESTING = 'radon_testing',
  MOLD_INSPECTION = 'mold_inspection',
  SEWER_SCOPE = 'sewer_scope',
  SURVEYING = 'surveying',

  // Insurance & Protection
  HOME_INSURANCE = 'home_insurance',
  TITLE_INSURANCE = 'title_insurance',
  HOME_WARRANTY = 'home_warranty',
  FLOOD_INSURANCE = 'flood_insurance',

  // Contractors & Repairs
  GENERAL_CONTRACTOR = 'general_contractor',
  ROOFING = 'roofing',
  HVAC = 'hvac',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  FOUNDATION_REPAIR = 'foundation_repair',
  PEST_CONTROL = 'pest_control',
  LANDSCAPING = 'landscaping',
  PAINTING = 'painting',
  FLOORING = 'flooring',
  KITCHEN_REMODEL = 'kitchen_remodel',
  BATHROOM_REMODEL = 'bathroom_remodel',
  HANDYMAN = 'handyman',

  // Home Services
  CLEANING = 'cleaning',
  LAWN_CARE = 'lawn_care',
  SNOW_REMOVAL = 'snow_removal',
  POOL_SERVICE = 'pool_service',
  SECURITY_SYSTEM = 'security_system',
  SMART_HOME = 'smart_home',

  // Specialty
  ARCHITECTURE = 'architecture',
  INTERIOR_DESIGN = 'interior_design',
  HOME_STAGING = 'home_staging',
  ENERGY_AUDIT = 'energy_audit',
  SOLAR_INSTALLATION = 'solar_installation',
}

/**
 * Comprehensive service provider profile
 */
export const ServiceProviderSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(ServiceCategory),

  // Business info
  businessName: z.string(),
  ownerName: z.string().optional(),
  logo: z.string().url().optional(),
  tagline: z.string().optional(),
  description: z.string(),

  // Contact
  phone: z.string(),
  email: z.string().email(),
  website: z.string().url().optional(),

  // Service area
  serviceArea: z.object({
    cities: z.array(z.string()),
    zipcodes: z.array(z.string()).optional(),
    radius: z.number().optional(), // Miles from base location
    primaryLocation: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipcode: z.string(),
    }),
  }),

  // Credentials
  credentials: z.object({
    licensed: z.boolean(),
    licenseNumber: z.string().optional(),
    licenseState: z.string().optional(),
    licenseExpiration: z.date().optional(),

    insured: z.boolean(),
    insuranceCoverage: z.number().optional(), // Coverage amount
    bonded: z.boolean(),

    certifications: z.array(z.object({
      name: z.string(),
      issuingOrganization: z.string(),
      issueDate: z.date().optional(),
      expirationDate: z.date().optional(),
    })).optional(),

    backgroundCheck: z.boolean().default(false),
    backgroundCheckDate: z.date().optional(),
  }),

  // Business details
  yearsInBusiness: z.number(),
  employeeCount: z.number().optional(),
  businessType: z.enum(['individual', 'small_business', 'corporation', 'franchise']),

  // Ratings & Reviews
  ratings: z.object({
    overallRating: z.number().min(1).max(5),
    totalReviews: z.number(),
    ratingBreakdown: z.object({
      five_star: z.number(),
      four_star: z.number(),
      three_star: z.number(),
      two_star: z.number(),
      one_star: z.number(),
    }),
    categoryRatings: z.object({
      quality: z.number().min(1).max(5),
      professionalism: z.number().min(1).max(5),
      responsiveness: z.number().min(1).max(5),
      value: z.number().min(1).max(5),
    }).optional(),
  }),

  // Pricing
  pricing: z.object({
    pricingModel: z.enum(['flat_rate', 'hourly', 'per_sqft', 'quote_based']),
    hourlyRate: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    flatRate: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    freeEstimates: z.boolean(),
    emergencyFee: z.number().optional(),
    tripCharge: z.number().optional(),
  }).optional(),

  // Availability
  availability: z.object({
    acceptingNewClients: z.boolean(),
    averageResponseTime: z.number(), // Hours
    averageWaitTime: z.number().optional(), // Days until service
    emergencyService: z.boolean(),
    weekendService: z.boolean(),

    businessHours: z.object({
      monday: z.object({ open: z.string(), close: z.string() }).optional(),
      tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
      wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
      thursday: z.object({ open: z.string(), close: z.string() }).optional(),
      friday: z.object({ open: z.string(), close: z.string() }).optional(),
      saturday: z.object({ open: z.string(), close: z.string() }).optional(),
      sunday: z.object({ open: z.string(), close: z.string() }).optional(),
    }).optional(),
  }),

  // Portfolio & Work Examples
  portfolio: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    images: z.array(z.string().url()),
    projectCost: z.number().optional(),
    completionDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
  })).optional(),

  // Specialties
  specialties: z.array(z.string()),

  // Payment options
  paymentOptions: z.array(z.enum([
    'cash',
    'check',
    'credit_card',
    'debit_card',
    'financing',
    'payment_plans',
  ])),

  // Guarantees & Warranties
  guarantees: z.object({
    workmanshipWarranty: z.boolean(),
    warrantyYears: z.number().optional(),
    satisfactionGuarantee: z.boolean(),
    details: z.string().optional(),
  }).optional(),

  // Platform stats
  platformStats: z.object({
    joinedDate: z.date(),
    totalLeads: z.number().default(0),
    responseRate: z.number().default(0), // Percentage
    hireRate: z.number().default(0), // Percentage of leads that became jobs
    repeatCustomers: z.number().default(0),
  }),

  // Verification status
  verified: z.boolean().default(false),
  verifiedDate: z.date().optional(),

  // Featured status (paid promotion)
  featured: z.boolean().default(false),
  featuredUntil: z.date().optional(),

  // Status
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type ServiceProvider = z.infer<typeof ServiceProviderSchema>;

// ============================================================================
// SERVICE REQUEST
// ============================================================================

/**
 * Service request from user to provider
 */
export const ServiceRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  // Service details
  category: z.nativeEnum(ServiceCategory),
  serviceTitle: z.string(),
  description: z.string(),

  // Property details
  propertyDetails: z.object({
    address: z.string(),
    propertyType: z.enum(['single_family', 'condo', 'townhouse', 'multi_family', 'land']),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
  }).optional(),

  // Timeline
  urgency: z.enum(['emergency', 'urgent', 'moderate', 'flexible']),
  preferredStartDate: z.date().optional(),
  preferredEndDate: z.date().optional(),
  flexible: z.boolean().default(false),

  // Budget
  budget: z.object({
    min: z.number().optional(),
    max: z.number(),
    budgetType: z.enum(['firm', 'flexible', 'need_estimate']),
  }).optional(),

  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
  })).optional(),

  // Contact preferences
  contactPreferences: z.object({
    preferredMethods: z.array(z.enum(['phone', 'email', 'text', 'in_app'])),
    bestTimeToContact: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  }),

  // Quotes received
  quotesReceived: z.number().default(0),
  quotesRequested: z.number().default(3), // How many providers to contact

  // Status
  status: z.enum([
    'draft',
    'submitted',
    'quotes_pending',
    'quotes_received',
    'provider_selected',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ]).default('draft'),

  // Selected provider
  selectedProviderId: z.string().optional(),
  selectedAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;

// ============================================================================
// SERVICE QUOTE
// ============================================================================

/**
 * Quote from provider for a service request
 */
export const ServiceQuoteSchema = z.object({
  id: z.string(),
  serviceRequestId: z.string(),
  providerId: z.string(),
  userId: z.string(),

  // Quote details
  quoteType: z.enum(['fixed_price', 'estimate', 'hourly']),

  // Pricing
  pricing: z.object({
    subtotal: z.number(),
    materials: z.number().optional(),
    labor: z.number().optional(),
    permits: z.number().optional(),
    taxes: z.number().optional(),
    total: z.number(),

    // For hourly quotes
    hourlyRate: z.number().optional(),
    estimatedHours: z.number().optional(),

    // Price range (for estimates)
    priceRange: z.object({
      low: z.number(),
      high: z.number(),
    }).optional(),
  }),

  // Scope of work
  scopeOfWork: z.string(),
  itemizedBreakdown: z.array(z.object({
    item: z.string(),
    quantity: z.number().optional(),
    unitCost: z.number().optional(),
    totalCost: z.number(),
  })).optional(),

  // Timeline
  timeline: z.object({
    startDate: z.date().optional(),
    completionDate: z.date().optional(),
    estimatedDuration: z.string(), // "3-5 days", "2 weeks"
  }),

  // Terms & Conditions
  terms: z.object({
    paymentSchedule: z.array(z.object({
      milestone: z.string(),
      percentage: z.number(),
      amount: z.number(),
    })),
    warranty: z.string().optional(),
    cancellationPolicy: z.string().optional(),
  }),

  // Validity
  validUntil: z.date(),

  // Attachments
  attachments: z.array(z.object({
    type: z.enum(['contract', 'terms', 'warranty', 'permit', 'other']),
    filename: z.string(),
    url: z.string().url(),
  })).optional(),

  // Status
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']),

  sentAt: z.date().optional(),
  viewedAt: z.date().optional(),
  respondedAt: z.date().optional(),

  // User response
  userNotes: z.string().optional(),

  createdAt: z.date(),
});

export type ServiceQuote = z.infer<typeof ServiceQuoteSchema>;

// ============================================================================
// SERVICE REVIEW
// ============================================================================

/**
 * User review of service provider
 */
export const ServiceReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string(),
  serviceRequestId: z.string().optional(),

  // Ratings
  overallRating: z.number().min(1).max(5),
  categoryRatings: z.object({
    quality: z.number().min(1).max(5),
    professionalism: z.number().min(1).max(5),
    responsiveness: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }),

  // Review content
  title: z.string(),
  content: z.string().min(50).max(5000),

  // Project details
  projectType: z.string().optional(),
  projectCost: z.number().optional(),
  projectDate: z.date().optional(),

  // Recommendations
  wouldRecommend: z.boolean(),
  wouldHireAgain: z.boolean(),

  // Helpful tags
  pros: z.array(z.string()).max(10).optional(),
  cons: z.array(z.string()).max(10).optional(),

  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
    beforeAfter: z.enum(['before', 'after']).optional(),
  })).max(10).optional(),

  // Engagement
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),

  // Provider response
  providerResponse: z.object({
    response: z.string(),
    respondedAt: z.date(),
  }).optional(),

  // Verification
  verified: z.boolean().default(false), // Verified purchase
  verifiedDate: z.date().optional(),

  // Moderation
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).default('pending'),
  moderatorNotes: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type ServiceReview = z.infer<typeof ServiceReviewSchema>;

// ============================================================================
// HOME WARRANTY
// ============================================================================

/**
 * Home warranty plan
 */
export const HomeWarrantyPlanSchema = z.object({
  id: z.string(),
  providerId: z.string(),

  // Provider
  provider: z.object({
    name: z.string(),
    logo: z.string().url().optional(),
    rating: z.number().min(1).max(5).optional(),
    reviewCount: z.number(),
    yearsInBusiness: z.number(),
    aRating: z.string().optional(), // "A+", "A", etc. from BBB
  }),

  // Plan details
  planName: z.string(),
  planType: z.enum(['basic', 'standard', 'premium', 'custom']),
  description: z.string(),

  // Pricing
  pricing: z.object({
    annualCost: z.number(),
    monthlyCost: z.number().optional(),
    serviceCallFee: z.number(), // Per visit
    cancelationFee: z.number().optional(),
  }),

  // Coverage
  coverage: z.object({
    // Systems
    electrical: z.boolean(),
    plumbing: z.boolean(),
    hvacCooling: z.boolean(),
    hvacHeating: z.boolean(),
    waterHeater: z.boolean(),
    garageDoorOpener: z.boolean(),
    doorbellChime: z.boolean(),

    // Appliances
    refrigerator: z.boolean(),
    oven: z.boolean(),
    cooktop: z.boolean(),
    builtInMicrowave: z.boolean(),
    dishwasher: z.boolean(),
    garbageDisposal: z.boolean(),
    washer: z.boolean(),
    dryer: z.boolean(),

    // Optional add-ons
    pool: z.boolean(),
    spa: z.boolean(),
    roofLeak: z.boolean(),
    septicSystem: z.boolean(),
    well: z.boolean(),
    additionalRefrigerator: z.boolean(),
    standAloneFreezer: z.boolean(),
  }),

  // Coverage limits
  limits: z.object({
    perItem: z.number().optional(), // Max payout per item
    perYear: z.number().optional(), // Max annual payout
    hvacCapPerYear: z.number().optional(),
    unlimitedRepairs: z.boolean(),
  }),

  // Waiting period
  waitingPeriod: z.number().optional(), // Days before coverage starts

  // Pre-existing conditions
  preExistingCovered: z.boolean(),

  // Service
  serviceNetwork: z.object({
    contractorChoice: z.enum(['assigned', 'choose_from_network', 'use_your_own']),
    networkSize: z.number().optional(),
    twentyFourSevenSupport: z.boolean(),
  }),

  // Contract terms
  contractLength: z.number(), // Months
  renewalDiscount: z.number().optional(), // Percentage

  // What's NOT covered (common exclusions)
  exclusions: z.array(z.string()),

  // Additional benefits
  additionalBenefits: z.array(z.string()).optional(),
});

export type HomeWarrantyPlan = z.infer<typeof HomeWarrantyPlanSchema>;

// ============================================================================
// HOME INSURANCE QUOTE
// ============================================================================

/**
 * Home insurance quote
 */
export const HomeInsuranceQuoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),

  // Insurance provider
  provider: z.object({
    name: z.string(),
    logo: z.string().url().optional(),
    rating: z.object({
      amBest: z.string().optional(), // "A++", "A+", etc.
      jdPower: z.number().min(1).max(5).optional(),
    }).optional(),
  }),

  // Coverage details
  coverage: z.object({
    dwellingCoverage: z.number(), // Rebuild cost
    personalProperty: z.number(),
    liabilityCoverage: z.number(),
    medicalPayments: z.number(),
    lossOfUse: z.number(),

    // Additional coverage
    waterBackup: z.boolean(),
    earthquakeRider: z.boolean(),
    floodInsurance: z.boolean(), // Usually separate NFIP policy
    replacementCost: z.boolean(), // vs Actual Cash Value
    extendedReplacementCost: z.boolean(),
    inflationGuard: z.boolean(),
  }),

  // Deductible
  deductible: z.object({
    standard: z.number(),
    windHail: z.number().optional(), // Higher in hurricane zones
    hurricane: z.number().optional(), // Percentage in coastal areas
  }),

  // Premium
  premium: z.object({
    annualPremium: z.number(),
    monthlyPremium: z.number(),

    // Discounts applied
    discounts: z.array(z.object({
      type: z.enum([
        'multi_policy',
        'security_system',
        'smoke_detectors',
        'new_home',
        'claims_free',
        'loyalty',
        'automatic_payment',
      ]),
      amount: z.number(),
      percentage: z.number(),
    })).optional(),

    priorDiscounts: z.number(), // Total before discounts
  }),

  // Quote validity
  validUntil: z.date(),

  // Status
  status: z.enum(['quote', 'accepted', 'bound', 'expired']),

  createdAt: z.date(),
});

export type HomeInsuranceQuote = z.infer<typeof HomeInsuranceQuoteSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const ServicesSchemas = {
  ServiceProvider: ServiceProviderSchema,
  ServiceRequest: ServiceRequestSchema,
  ServiceQuote: ServiceQuoteSchema,
  ServiceReview: ServiceReviewSchema,
  HomeWarrantyPlan: HomeWarrantyPlanSchema,
  HomeInsuranceQuote: HomeInsuranceQuoteSchema,
};
