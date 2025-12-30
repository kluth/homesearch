import { z } from 'zod';

/**
 * Promotion Type
 */
export enum PromotionType {
  /** Featured on homepage */
  FEATURED = 'featured',
  /** Top of search results */
  SPONSORED = 'sponsored',
  /** Highlighted in listings */
  HIGHLIGHTED = 'highlighted',
  /** Premium placement */
  PREMIUM = 'premium',
}

/**
 * Promotion Status
 */
export enum PromotionStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
}

/**
 * Promotion Pricing
 */
export const PROMOTION_PRICING: Record<PromotionType, {
  name: string;
  description: string;
  basePrice: number; // Per day
  features: string[];
}> = {
  [PromotionType.HIGHLIGHTED]: {
    name: 'Highlighted',
    description: 'Stand out with a highlighted border',
    basePrice: 2.99,
    features: [
      'Yellow highlighted border',
      'Appears in standard search results',
      '2x more visibility',
    ],
  },

  [PromotionType.SPONSORED]: {
    name: 'Sponsored',
    description: 'Top of search results',
    basePrice: 9.99,
    features: [
      'Top 3 positions in search',
      '"Sponsored" badge',
      'Highlighted border',
      '5x more visibility',
    ],
  },

  [PromotionType.FEATURED]: {
    name: 'Featured',
    description: 'Homepage featured listing',
    basePrice: 19.99,
    features: [
      'Homepage carousel',
      'Top of search results',
      'Premium badge',
      'Social media sharing',
      '10x more visibility',
    ],
  },

  [PromotionType.PREMIUM]: {
    name: 'Premium',
    description: 'Maximum exposure everywhere',
    basePrice: 39.99,
    features: [
      'All Featured benefits',
      'Email newsletter inclusion',
      'Push notifications to relevant users',
      'Dedicated property page',
      'Virtual tour included',
      '20x more visibility',
    ],
  },
};

/**
 * Promoted Listing Schema
 */
export const PromotedListingSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(), // Agent/owner who paid for promotion
  workspaceId: z.string(),

  // Promotion details
  type: z.nativeEnum(PromotionType),
  status: z.nativeEnum(PromotionStatus),

  // Duration
  startDate: z.date(),
  endDate: z.date(),
  durationDays: z.number().int().positive(),

  // Pricing
  dailyRate: z.number().positive(),
  totalCost: z.number().positive(),
  currency: z.string().length(3).default('USD'),

  // Payment
  paymentId: z.string().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),

  // Performance tracking
  stats: z.object({
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    inquiries: z.number().int().min(0).default(0),
    favorites: z.number().int().min(0).default(0),
  }),

  // Auto-renewal
  autoRenew: z.boolean().default(false),
  renewalPaymentMethodId: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PromotedListing = z.infer<typeof PromotedListingSchema>;

/**
 * Ad Placement Schema
 * For displaying ads to free users
 */
export const AdPlacementSchema = z.object({
  id: z.string(),

  // Ad details
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url().optional(),
  destinationUrl: z.string().url(),
  callToAction: z.string().optional(),

  // Targeting
  targetAudience: z.object({
    plans: z.array(z.string()), // ['free', 'basic']
    locations: z.array(z.string()).optional(), // Cities
    propertyTypes: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }),

  // Placement
  position: z.enum([
    'top_banner',
    'sidebar',
    'between_listings',
    'bottom',
    'modal',
  ]),
  priority: z.number().int().min(1).max(10).default(5),

  // Campaign details
  advertiserId: z.string(),
  budget: z.object({
    daily: z.number().positive(),
    total: z.number().positive(),
    spent: z.number().min(0).default(0),
  }),

  // Pricing model
  pricingModel: z.enum(['cpm', 'cpc', 'cpa']), // Cost per mille/click/action
  costPerAction: z.number().positive(),

  // Schedule
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),

  // Performance
  stats: z.object({
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    conversions: z.number().int().min(0).default(0),
    ctr: z.number().min(0).default(0), // Click-through rate
  }),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdPlacement = z.infer<typeof AdPlacementSchema>;
