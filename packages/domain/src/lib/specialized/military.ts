/**
 * Military & Veteran Schemas
 *
 * Specialized features for military members and veterans.
 * Addresses User Story E2: Military Relocation (PCS)
 */

import { z } from 'zod';

/**
 * Military Branch
 */
export enum MilitaryBranch {
  ARMY = 'army',
  NAVY = 'navy',
  AIR_FORCE = 'air_force',
  MARINES = 'marines',
  COAST_GUARD = 'coast_guard',
  SPACE_FORCE = 'space_force',
  NATIONAL_GUARD = 'national_guard',
  RESERVES = 'reserves',
}

/**
 * Military Status
 */
export enum MilitaryStatus {
  ACTIVE_DUTY = 'active_duty',
  VETERAN = 'veteran',
  RETIRED = 'retired',
  RESERVES = 'reserves',
  NATIONAL_GUARD = 'national_guard',
  DEPENDENT = 'dependent',
}

/**
 * Military Base Information
 */
export const MilitaryBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  branch: z.nativeEnum(MilitaryBranch),

  // Location
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),

  // Details
  population: z.number().optional(),
  description: z.string().optional(),

  // Housing
  hasOnBaseHousing: z.boolean(),
  onBaseHousingWaitTime: z.number().optional(), // Months

  // Amenities
  amenities: z.array(z.enum([
    'commissary',
    'exchange',
    'hospital',
    'clinic',
    'school',
    'childcare',
    'gym',
    'pool',
  ])).optional(),

  // Gates/Entrances
  gates: z.array(z.object({
    name: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    restrictions: z.string().optional(),
  })).optional(),

  // Contact
  website: z.string().url().optional(),
  housingOfficePhone: z.string().optional(),
});

export type MilitaryBase = z.infer<typeof MilitaryBaseSchema>;

/**
 * BAH (Basic Allowance for Housing) Rate
 */
export const BAHRateSchema = z.object({
  zipCode: z.string(),
  payGrade: z.string(), // E1-E9, O1-O10, W1-W5
  year: z.number(),

  withDependents: z.number(),
  withoutDependents: z.number(),

  partialRate: z.number().optional(), // For partial months
});

export type BAHRate = z.infer<typeof BAHRateSchema>;

/**
 * Military User Profile
 */
export const MilitaryUserProfileSchema = z.object({
  userId: z.string(),

  // Status
  militaryStatus: z.nativeEnum(MilitaryStatus),
  branch: z.nativeEnum(MilitaryBranch).optional(),
  rank: z.string().optional(), // E5, O3, etc.

  // Current Assignment
  currentBase: z.object({
    baseId: z.string(),
    name: z.string(),
    stationedSince: z.date(),
  }).optional(),

  // PCS (Permanent Change of Station)
  upcomingPCS: z.object({
    destinationBase: z.string(),
    expectedDate: z.date(),
    ordersReceived: z.boolean(),
    ordersDate: z.date().optional(),
  }).optional(),

  // BAH
  bahEligible: z.boolean().default(false),
  bahRate: z.number().optional(),
  bahZipCode: z.string().optional(),

  // VA Loan
  vaLoanEligible: z.boolean().default(false),
  vaLoanUsed: z.boolean().default(false),
  vaLoanEntitlement: z.number().optional(),

  // Preferences
  preferProximityToBase: z.boolean().default(true),
  maxCommuteToBase: z.number().default(30), // Minutes

  // Verification
  verified: z.boolean().default(false),
  verificationMethod: z.enum(['dd214', 'military_id', 'orders']).optional(),
  verifiedAt: z.date().optional(),
});

export type MilitaryUserProfile = z.infer<typeof MilitaryUserProfileSchema>;

/**
 * Property Base Proximity
 */
export const BaseProximitySchema = z.object({
  propertyId: z.string(),

  nearestBase: z.object({
    baseId: z.string(),
    name: z.string(),
    branch: z.nativeEnum(MilitaryBranch),
    distance: z.number(), // Miles
    driveTime: z.number(), // Minutes
    nearestGate: z.string().optional(),
  }),

  // All bases within radius
  nearbyBases: z.array(z.object({
    baseId: z.string(),
    name: z.string(),
    distance: z.number(),
    driveTime: z.number(),
  })).optional(),

  // BAH Considerations
  bahZone: z.string(),
  bahRate: z.number(),
  rentVsBAH: z.object({
    monthlyRent: z.number(),
    bahWithDependents: z.number(),
    bahWithoutDependents: z.number(),
    differential: z.number(), // Positive = under BAH, Negative = over BAH
  }),
});

export type BaseProximity = z.infer<typeof BaseProximitySchema>;

/**
 * Military-Friendly Features
 */
export const MilitaryFriendlyFeaturesSchema = z.object({
  // Landlord
  militaryFriendlyLandlord: z.boolean().default(false),
  scraProtectionOffered: z.boolean().default(false), // Servicemembers Civil Relief Act
  flexibleLeaseTerms: z.boolean().default(false),
  acceptsBAH: z.boolean().default(true),

  // Early Termination
  earlyTerminationClause: z.boolean(),
  pcsClause: z.boolean(), // Allows breaking lease for PCS orders
  deploymentClause: z.boolean(),

  // Fees
  reducedSecurityDeposit: z.boolean().default(false),
  militaryDiscount: z.number().optional(), // Percentage or fixed amount
  waiveApplicationFee: z.boolean().default(false),

  // Other Benefits
  furnitureIncluded: z.boolean().default(false), // Good for temporary assignments
  shortTermLeaseAvailable: z.boolean().default(false),
  monthToMonthAvailable: z.boolean().default(false),
});

export type MilitaryFriendlyFeatures = z.infer<typeof MilitaryFriendlyFeaturesSchema>;

/**
 * VA Loan Calculation
 */
export const VALoanCalculationSchema = z.object({
  homePrice: z.number(),

  // No down payment required for VA loans up to certain amount
  downPaymentRequired: z.number().default(0),
  downPaymentPercent: z.number().default(0),

  // VA Funding Fee
  fundingFee: z.object({
    percentage: z.number(),
    amount: z.number(),
    waived: z.boolean(), // Disabled veterans exempt
  }),

  // Loan Details
  loanAmount: z.number(),
  interestRate: z.number(),
  loanTerm: z.number().default(360), // Months

  // Monthly Payment
  monthlyPayment: z.object({
    principal: z.number(),
    interest: z.number(),
    propertyTax: z.number(),
    insurance: z.number(),
    total: z.number(),
  }),

  // Entitlement
  entitlementUsed: z.number(),
  entitlementRemaining: z.number(),

  // Qualification
  estimatedIncome: z.number().optional(),
  residualIncome: z.number().optional(), // Required by VA
  meetsResidualRequirement: z.boolean().optional(),
});

export type VALoanCalculation = z.infer<typeof VALoanCalculationSchema>;

/**
 * Military Relocation Assistance
 */
export const RelocationAssistanceSchema = z.object({
  userId: z.string(),
  pcsOrdersId: z.string(),

  // Timeline
  ordersDate: z.date(),
  reportDate: z.date(),
  daysUntilMove: z.number(),

  // Current & Destination
  currentBase: z.string(),
  destinationBase: z.string(),

  // Checklist
  checklist: z.array(z.object({
    task: z.string(),
    category: z.enum(['housing', 'moving', 'family', 'financial', 'administrative']),
    completed: z.boolean(),
    dueDate: z.date().optional(),
    notes: z.string().optional(),
  })),

  // Housing Search
  housingSearch: z.object({
    budget: z.number(), // Based on BAH
    savedProperties: z.array(z.string()),
    tourScheduled: z.array(z.object({
      propertyId: z.string(),
      date: z.date(),
    })).optional(),
    applicationSubmitted: z.array(z.string()).optional(),
  }),

  // Resources
  assignedRelocationSpecialist: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
  }).optional(),

  // Status
  status: z.enum(['planning', 'searching', 'application', 'approved', 'moving', 'completed']),
});

export type RelocationAssistance = z.infer<typeof RelocationAssistanceSchema>;
