/**
 * Roommate Matching Schemas
 *
 * Platform for finding compatible roommates.
 * Addresses User Story 7.3: Roommate Matching
 */

import { z } from 'zod';

/**
 * Roommate Search Status
 */
export enum RoommateSearchStatus {
  SEARCHING = 'searching',
  MATCHED = 'matched',
  INACTIVE = 'inactive',
  MOVED_IN = 'moved_in',
}

/**
 * Verification Status
 */
export const VerificationStatusSchema = z.object({
  email: z.boolean().default(false),
  phone: z.boolean().default(false),
  identity: z.boolean().default(false), // Government ID
  backgroundCheck: z.boolean().default(false),
  employmentVerification: z.boolean().default(false),
});

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Lifestyle Habits
 */
export const LifestyleHabitsSchema = z.object({
  smoker: z.boolean(),
  pets: z.boolean(),
  petTypes: z.array(z.enum(['dog', 'cat', 'bird', 'fish', 'other'])).optional(),

  cleanliness: z.enum(['very_clean', 'clean', 'moderate', 'relaxed']),
  noiseLevel: z.enum(['very_quiet', 'quiet', 'moderate', 'lively']),
  guestFrequency: z.enum(['rarely', 'occasionally', 'frequently']),
  bedtime: z.enum(['early_bird', 'normal', 'night_owl']),

  cooking: z.enum(['rarely', 'sometimes', 'often', 'daily']),
  sharedMeals: z.boolean(),
  dietaryRestrictions: z.array(z.string()).optional(),

  workSchedule: z.enum(['traditional', 'flexible', 'remote', 'night_shift', 'rotating']),
});

export type LifestyleHabits = z.infer<typeof LifestyleHabitsSchema>;

/**
 * Roommate Profile
 */
export const RoommateProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.nativeEnum(RoommateSearchStatus),

  // Basic Info
  age: z.number().min(18),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
  occupation: z.string(),
  employer: z.string().optional(),

  // Preferences
  genderPreference: z.enum(['male', 'female', 'no_preference']),
  ageRangePreference: z.object({
    min: z.number(),
    max: z.number(),
  }),

  // Budget
  budget: z.object({
    maxMonthlyRent: z.number(), // Per person share
    maxUpfrontCost: z.number(), // Deposit + first/last
  }),

  // Move-in
  moveInDate: z.object({
    earliest: z.date(),
    latest: z.date(),
    flexible: z.boolean(),
  }),

  // Location
  preferredCities: z.array(z.string()),
  preferredNeighborhoods: z.array(z.string()).optional(),
  maxCommuteMinutes: z.number().optional(),
  workLocation: z.object({
    address: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }).optional(),

  // Lifestyle
  habits: LifestyleHabitsSchema,

  // Interests
  interests: z.array(z.string()),
  hobbies: z.array(z.string()).optional(),

  // About
  bio: z.string().max(1000),
  lookingFor: z.string().max(500), // What they want in a roommate

  // Deal Breakers
  dealBreakers: z.array(z.string()).optional(),

  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    isPrimary: z.boolean(),
  })).max(5).optional(),

  // Video Intro
  videoIntroUrl: z.string().url().optional(),

  // Verification
  verified: VerificationStatusSchema,
  verificationScore: z.number().min(0).max(100),

  // Safety
  safetyPreferences: z.object({
    meetInPublic: z.boolean().default(true),
    videoCallFirst: z.boolean().default(true),
    backgroundCheckRequired: z.boolean().default(false),
  }),

  // Activity
  lastActive: z.date(),
  responseRate: z.number().optional(), // Percentage
  averageResponseTime: z.number().optional(), // Hours

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RoommateProfile = z.infer<typeof RoommateProfileSchema>;

/**
 * Compatibility Factors
 */
export const CompatibilityFactorsSchema = z.object({
  budget: z.number().min(0).max(100),
  lifestyle: z.number().min(0).max(100),
  location: z.number().min(0).max(100),
  timing: z.number().min(0).max(100),
  interests: z.number().min(0).max(100),
  cleanliness: z.number().min(0).max(100),
  schedule: z.number().min(0).max(100),
});

export type CompatibilityFactors = z.infer<typeof CompatibilityFactorsSchema>;

/**
 * Roommate Match
 */
export const RoommateMatchSchema = z.object({
  id: z.string(),
  users: z.array(z.string()).min(2).max(4), // Support 2-4 roommates

  // Compatibility
  compatibilityScore: z.number().min(0).max(100),
  compatibilityFactors: CompatibilityFactorsSchema,

  // Properties
  sharedListings: z.array(z.string()).optional(), // Property IDs both interested in

  // Communication
  conversationId: z.string().optional(),
  lastMessageAt: z.date().optional(),

  // Status
  status: z.enum([
    'matched',
    'messaging',
    'video_call_scheduled',
    'meeting_scheduled',
    'touring_together',
    'applied_together',
    'lease_signed',
    'moved_in',
    'ended',
  ]),

  // Meetings
  meetings: z.array(z.object({
    type: z.enum(['video_call', 'in_person', 'property_tour']),
    scheduledAt: z.date(),
    completedAt: z.date().optional(),
    notes: z.string().optional(),
  })).optional(),

  // Application
  jointApplication: z.object({
    propertyId: z.string(),
    submittedAt: z.date(),
    status: z.enum(['submitted', 'approved', 'denied']),
  }).optional(),

  // Metadata
  matchedAt: z.date(),
  updatedAt: z.date(),
});

export type RoommateMatch = z.infer<typeof RoommateMatchSchema>;

/**
 * Roommate Agreement Template
 */
export const RoommateAgreementSchema = z.object({
  id: z.string(),
  matchId: z.string(),

  // Rent Division
  rentSplit: z.array(z.object({
    userId: z.string(),
    percentage: z.number(),
    amount: z.number(),
  })),

  // Utilities
  utilitiesSplit: z.enum(['equal', 'proportional_to_rent', 'by_usage', 'custom']),

  // Shared Expenses
  sharedExpenses: z.array(z.object({
    item: z.string(),
    amount: z.number(),
    frequency: z.enum(['monthly', 'one-time']),
    splitEqually: z.boolean(),
  })).optional(),

  // House Rules
  rules: z.array(z.object({
    category: z.enum(['guests', 'quiet_hours', 'cleaning', 'kitchen', 'shared_spaces', 'other']),
    rule: z.string(),
    agreedBy: z.array(z.string()),
  })),

  // Move-out Terms
  noticePeriod: z.number(), // Days
  cleaningExpectations: z.string(),

  // Signatures
  signatures: z.array(z.object({
    userId: z.string(),
    signedAt: z.date(),
    ipAddress: z.string().optional(),
  })),

  createdAt: z.date(),
});

export type RoommateAgreement = z.infer<typeof RoommateAgreementSchema>;
