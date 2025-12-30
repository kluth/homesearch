/**
 * Luxury Concierge Schemas
 *
 * White-glove services for high-net-worth buyers.
 * Addresses User Stories 11.2, 11.3: Concierge Service & Privacy
 */

import { z } from 'zod';

/**
 * Concierge Request Type
 */
export enum ConciergeRequestType {
  PRIVATE_SHOWING = 'private_showing',
  HELICOPTER_TOUR = 'helicopter_tour',
  MULTI_CITY_TOUR = 'multi_city_tour',
  INVESTMENT_ANALYSIS = 'investment_analysis',
  ARCHITECT_CONSULTATION = 'architect_consultation',
  INTERIOR_DESIGNER = 'interior_designer',
  OFF_MARKET_ACCESS = 'off_market_access',
  TRUST_FORMATION = 'trust_formation',
  RELOCATION_SERVICES = 'relocation_services',
  WHITE_GLOVE_CLOSING = 'white_glove_closing',
  PROPERTY_MANAGEMENT_SETUP = 'property_management_setup',
  CUSTOM_REQUEST = 'custom_request',
}

/**
 * Concierge Request Status
 */
export enum ConciergeRequestStatus {
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Concierge Request
 */
export const ConciergeRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(ConciergeRequestType),

  // Request Details
  title: z.string(),
  description: z.string(),
  propertyIds: z.array(z.string()).optional(),

  // Budget
  estimatedBudget: z.number().optional(),

  // Timeline
  requestedBy: z.date().optional(),
  flexibleTimeline: z.boolean().default(true),

  // Status
  status: z.nativeEnum(ConciergeRequestStatus),

  // Assignment
  assignedConcierge: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
  }).optional(),

  // Quote
  quote: z.object({
    amount: z.number(),
    breakdown: z.array(z.object({
      item: z.string(),
      description: z.string(),
      cost: z.number(),
    })),
    notes: z.string().optional(),
    validUntil: z.date(),
  }).optional(),

  // Payment
  paymentStatus: z.enum(['pending', 'deposit_paid', 'paid', 'refunded']).optional(),
  depositAmount: z.number().optional(),

  // Communication
  notes: z.array(z.object({
    from: z.string(),
    message: z.string(),
    timestamp: z.date(),
    private: z.boolean().default(false),
  })).optional(),

  // Attachments
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    name: z.string(),
  })).optional(),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

/**
 * Off-Market Listing Access Level
 */
export enum OffMarketAccessLevel {
  INVITATION_ONLY = 'invitation_only',
  VERIFIED_BUYERS = 'verified_buyers',
  NET_WORTH_QUALIFIED = 'net_worth_qualified',
  RELATIONSHIP_ONLY = 'relationship_only',
}

/**
 * Off-Market Listing
 */
export const OffMarketListingSchema = z.object({
  id: z.string(),

  // All standard property fields would be included here
  // Plus additional luxury fields:

  // Access Control
  accessLevel: z.nativeEnum(OffMarketAccessLevel),
  ndaRequired: z.boolean().default(true),

  // Qualification Requirements
  minimumQualification: z.object({
    netWorth: z.number().optional(),
    liquidAssets: z.number().optional(),
    proofOfFunds: z.boolean(),
    creditScore: z.number().optional(),
    bankReference: z.boolean().default(false),
  }).optional(),

  // Showing Restrictions
  showingsBy: z.enum(['appointment_only', 'concierge_only', 'agent_only']),
  minimumNotice: z.number().default(48), // Hours

  // Privacy
  addressHidden: z.boolean().default(true),
  photosTiered: z.boolean().default(true), // Some photos only after NDA
  ownerAnonymous: z.boolean().default(true),

  // Broker
  brokerExclusive: z.boolean(),
  exclusiveBrokerId: z.string().optional(),
  cobrokeAllowed: z.boolean().default(false),

  // Reason for Off-Market
  reason: z.enum([
    'privacy',
    'high_profile_owner',
    'test_market',
    'pre_listing',
    'exclusive_network',
    'estate_sale',
  ]),

  // Timeline
  listedOffMarketAt: z.date(),
  mayGoPublicAfter: z.date().optional(),

  // Access Tracking
  accessRequests: z.array(z.object({
    userId: z.string(),
    requestedAt: z.date(),
    approved: z.boolean(),
    approvedAt: z.date().optional(),
    ndaSigned: z.boolean().default(false),
  })).optional(),
});

export type OffMarketListing = z.infer<typeof OffMarketListingSchema>;

/**
 * NDA (Non-Disclosure Agreement)
 */
export const NDASchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),

  // Agreement Text
  agreementText: z.string(),

  // Signature
  signedAt: z.date(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),

  // Terms
  expiresAt: z.date().optional(),
  jurisdiction: z.string(),

  // Status
  status: z.enum(['active', 'expired', 'revoked']),

  // Revocation
  revokedAt: z.date().optional(),
  revokedReason: z.string().optional(),
});

export type NDA = z.infer<typeof NDASchema>;

/**
 * VIP Buyer Profile
 */
export const VIPBuyerProfileSchema = z.object({
  userId: z.string(),

  // Qualification
  netWorth: z.number().optional(),
  liquidAssets: z.number().optional(),
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),

  // Preferences
  conciergeAssigned: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
  }).optional(),

  // Privacy Settings
  privacyLevel: z.enum(['standard', 'high', 'maximum']),
  useAnonymousInquiries: z.boolean().default(false),
  useLLCForPurchases: z.boolean().default(false),

  // Services Used
  servicesUsed: z.array(z.nativeEnum(ConciergeRequestType)).optional(),
  totalSpent: z.number().default(0),

  // Tier
  tier: z.enum(['platinum', 'diamond', 'black_card']).default('platinum'),

  // Access
  offMarketAccess: z.boolean().default(true),
  previewNewListings: z.boolean().default(true),
});

export type VIPBuyerProfile = z.infer<typeof VIPBuyerProfileSchema>;
