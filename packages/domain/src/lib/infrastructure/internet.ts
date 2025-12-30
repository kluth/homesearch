/**
 * Internet Availability Schemas
 *
 * Internet service provider and connectivity data.
 * Addresses User Story 10.2: Internet Speed Requirements
 */

import { z } from 'zod';

/**
 * Internet Service Type
 */
export enum InternetServiceType {
  FIBER = 'fiber',
  CABLE = 'cable',
  DSL = 'dsl',
  SATELLITE = 'satellite',
  FIXED_WIRELESS = 'fixed_wireless',
  FIVE_G = '5g',
  DIAL_UP = 'dial_up',
}

/**
 * Signal Strength
 */
export enum SignalStrength {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent',
}

/**
 * Internet Service Provider
 */
export const InternetProviderSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(InternetServiceType),

  // Speeds (Mbps)
  downloadSpeed: z.object({
    min: z.number(),
    max: z.number(),
    typical: z.number(),
  }),
  uploadSpeed: z.object({
    min: z.number(),
    max: z.number(),
    typical: z.number(),
  }),

  // Pricing
  price: z.object({
    min: z.number(), // Monthly
    max: z.number(),
    promotionalPrice: z.number().optional(),
    promotionalPeriod: z.number().optional(), // Months
  }),

  // Contract
  contractRequired: z.boolean(),
  contractLength: z.number().optional(), // Months
  installationFee: z.number().optional(),
  equipmentFee: z.number().optional(),

  // Availability
  availability: z.enum(['available', 'coming_soon', 'not_available']),
  estimatedAvailability: z.date().optional(),

  // Features
  features: z.array(z.enum([
    'unlimited_data',
    'data_cap',
    'bundled_tv',
    'bundled_phone',
    'static_ip',
    'business_class',
    'no_contract_option',
  ])).optional(),

  // Data Cap
  dataCap: z.number().optional(), // GB per month
  overage

Fee: z.number().optional(), // Per GB

  // Reliability
  uptimePercent: z.number().optional(),
  customerRating: z.number().min(1).max(5).optional(),

  // Contact
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

export type InternetProvider = z.infer<typeof InternetProviderSchema>;

/**
 * Cell Signal Strength by Carrier
 */
export const CellSignalSchema = z.object({
  verizon: z.nativeEnum(SignalStrength),
  att: z.nativeEnum(SignalStrength),
  tmobile: z.nativeEnum(SignalStrength),
  sprint: z.nativeEnum(SignalStrength).optional(),

  // 5G Availability
  fiveG: z.object({
    verizon: z.boolean(),
    att: z.boolean(),
    tmobile: z.boolean(),
  }).optional(),

  // Data for remote work
  suitableForHotspot: z.boolean(),
  suitableForVoip: z.boolean(),
});

export type CellSignal = z.infer<typeof CellSignalSchema>;

/**
 * Internet Availability for Address
 */
export const InternetAvailabilitySchema = z.object({
  id: z.string(),
  address: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),

  // Available Providers
  providers: z.array(InternetProviderSchema),

  // Summary
  hasFiber: z.boolean(),
  hasCable: z.boolean(),
  maxDownloadSpeed: z.number(), // Mbps
  maxUploadSpeed: z.number(), // Mbps
  minPrice: z.number(), // Monthly
  providerCount: z.number(),

  // Cell Coverage
  cellSignal: CellSignalSchema,

  // Remote Work Suitability
  remoteWorkScore: z.number().min(0).max(100),
  remoteWorkRating: z.enum(['poor', 'fair', 'good', 'excellent']),

  // Recommendations
  recommendedProviders: z.array(z.object({
    providerId: z.string(),
    name: z.string(),
    reason: z.string(),
    downloadSpeed: z.number(),
    price: z.number(),
    score: z.number(),
  })),

  // Metadata
  lastUpdated: z.date(),
  dataSource: z.string(), // "BroadbandNow API", "FCC Broadband Map", etc.
  verified: z.boolean().default(false),
});

export type InternetAvailability = z.infer<typeof InternetAvailabilitySchema>;

/**
 * Internet Speed Test Result
 */
export const SpeedTestResultSchema = z.object({
  id: z.string(),
  address: z.string(),
  provider: z.string(),

  downloadSpeed: z.number(), // Mbps
  uploadSpeed: z.number(), // Mbps
  latency: z.number(), // ms
  jitter: z.number().optional(), // ms

  testedAt: z.date(),
  testedBy: z.string(), // User ID or "verified_user"

  // Context
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
});

export type SpeedTestResult = z.infer<typeof SpeedTestResultSchema>;

/**
 * Internet Requirements for Property
 */
export const InternetRequirementsSchema = z.object({
  minDownloadSpeed: z.number(), // Mbps
  minUploadSpeed: z.number(), // Mbps
  requiresFiber: z.boolean().default(false),
  requiresUnlimitedData: z.boolean().default(false),
  maxAcceptablePrice: z.number().optional(),

  // Use case
  useCase: z.enum([
    'basic_browsing',
    'streaming',
    'remote_work',
    'video_conferencing',
    'large_file_transfers',
    'gaming',
    'multiple_users',
  ]),
});

export type InternetRequirements = z.infer<typeof InternetRequirementsSchema>;
