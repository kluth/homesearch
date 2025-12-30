import { z } from 'zod';

/**
 * Subscription Plan Enumeration
 */
export enum SubscriptionPlan {
  /** Free tier - basic features */
  FREE = 'free',
  /** Basic tier - $4.99/month */
  BASIC = 'basic',
  /** Premium tier - $14.99/month */
  PREMIUM = 'premium',
  /** Pro tier - $29.99/month (for agents) */
  PRO = 'pro',
  /** Enterprise tier - custom pricing */
  ENTERPRISE = 'enterprise',
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  /** Active subscription */
  ACTIVE = 'active',
  /** Trial period */
  TRIALING = 'trialing',
  /** Past due payment */
  PAST_DUE = 'past_due',
  /** Canceled but still active until period end */
  CANCELED = 'canceled',
  /** Subscription ended */
  EXPIRED = 'expired',
  /** Payment failed */
  UNPAID = 'unpaid',
}

/**
 * Billing Interval
 */
export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Subscription Plan Features Schema
 */
export const SubscriptionFeaturesSchema = z.object({
  // Search & Browse
  savedSearches: z.number().int().min(0), // Max saved searches
  favorites: z.number().int().min(0), // Max favorites
  propertyAlerts: z.boolean(), // Email alerts for new properties
  advancedFilters: z.boolean(), // Advanced search filters

  // Analytics & Insights
  priceHistory: z.boolean(), // Historical price data
  marketTrends: z.boolean(), // Market trend analysis
  neighborhoodInsights: z.boolean(), // Detailed neighborhood data
  comparativeAnalysis: z.boolean(), // Compare multiple properties
  investmentCalculator: z.boolean(), // ROI calculator

  // Premium Content
  virtualTours: z.boolean(), // 360° virtual tours
  floorPlans: z.boolean(), // Detailed floor plans
  schoolRatings: z.boolean(), // School district ratings
  crimeStatistics: z.boolean(), // Neighborhood safety data
  walkScore: z.boolean(), // Walkability scores

  // Communication
  directAgentContact: z.boolean(), // Contact agents directly
  prioritySupport: z.boolean(), // Priority customer support
  personalizedRecommendations: z.boolean(), // AI-powered recommendations

  // Agent Features (Pro/Enterprise only)
  createListings: z.boolean(), // Can create property listings
  leadGeneration: z.boolean(), // Receive qualified leads
  analyticsReports: z.boolean(), // Detailed business analytics
  crm: z.boolean(), // Built-in CRM
  teamCollaboration: z.boolean(), // Multi-user workspace

  // Platform
  adFree: z.boolean(), // No advertisements
  customBranding: z.boolean(), // Custom branding (Enterprise)
  apiAccess: z.boolean(), // API access for integrations
});

export type SubscriptionFeatures = z.infer<typeof SubscriptionFeaturesSchema>;

/**
 * Subscription Plan Details
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, {
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  currency: string;
  features: SubscriptionFeatures;
  popular?: boolean;
}> = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    description: 'Perfect for casual browsing',
    price: { monthly: 0, yearly: 0 },
    currency: 'USD',
    features: {
      savedSearches: 3,
      favorites: 10,
      propertyAlerts: false,
      advancedFilters: false,
      priceHistory: false,
      marketTrends: false,
      neighborhoodInsights: false,
      comparativeAnalysis: false,
      investmentCalculator: false,
      virtualTours: false,
      floorPlans: false,
      schoolRatings: false,
      crimeStatistics: false,
      walkScore: false,
      directAgentContact: false,
      prioritySupport: false,
      personalizedRecommendations: false,
      createListings: false,
      leadGeneration: false,
      analyticsReports: false,
      crm: false,
      teamCollaboration: false,
      adFree: false,
      customBranding: false,
      apiAccess: false,
    },
  },

  [SubscriptionPlan.BASIC]: {
    name: 'Basic',
    description: 'For serious home seekers',
    price: { monthly: 4.99, yearly: 49.99 }, // 2 months free on yearly
    currency: 'USD',
    features: {
      savedSearches: 10,
      favorites: 50,
      propertyAlerts: true,
      advancedFilters: true,
      priceHistory: true,
      marketTrends: false,
      neighborhoodInsights: false,
      comparativeAnalysis: false,
      investmentCalculator: false,
      virtualTours: false,
      floorPlans: false,
      schoolRatings: true,
      crimeStatistics: false,
      walkScore: true,
      directAgentContact: true,
      prioritySupport: false,
      personalizedRecommendations: true,
      createListings: false,
      leadGeneration: false,
      analyticsReports: false,
      crm: false,
      teamCollaboration: false,
      adFree: true,
      customBranding: false,
      apiAccess: false,
    },
  },

  [SubscriptionPlan.PREMIUM]: {
    name: 'Premium',
    description: 'Complete home-finding experience',
    price: { monthly: 14.99, yearly: 149.99 },
    currency: 'USD',
    popular: true,
    features: {
      savedSearches: -1, // Unlimited
      favorites: -1, // Unlimited
      propertyAlerts: true,
      advancedFilters: true,
      priceHistory: true,
      marketTrends: true,
      neighborhoodInsights: true,
      comparativeAnalysis: true,
      investmentCalculator: true,
      virtualTours: true,
      floorPlans: true,
      schoolRatings: true,
      crimeStatistics: true,
      walkScore: true,
      directAgentContact: true,
      prioritySupport: true,
      personalizedRecommendations: true,
      createListings: false,
      leadGeneration: false,
      analyticsReports: false,
      crm: false,
      teamCollaboration: false,
      adFree: true,
      customBranding: false,
      apiAccess: false,
    },
  },

  [SubscriptionPlan.PRO]: {
    name: 'Pro',
    description: 'For real estate professionals',
    price: { monthly: 29.99, yearly: 299.99 },
    currency: 'USD',
    features: {
      savedSearches: -1,
      favorites: -1,
      propertyAlerts: true,
      advancedFilters: true,
      priceHistory: true,
      marketTrends: true,
      neighborhoodInsights: true,
      comparativeAnalysis: true,
      investmentCalculator: true,
      virtualTours: true,
      floorPlans: true,
      schoolRatings: true,
      crimeStatistics: true,
      walkScore: true,
      directAgentContact: true,
      prioritySupport: true,
      personalizedRecommendations: true,
      createListings: true,
      leadGeneration: true,
      analyticsReports: true,
      crm: true,
      teamCollaboration: false,
      adFree: true,
      customBranding: false,
      apiAccess: false,
    },
  },

  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Enterprise',
    description: 'Custom solutions for agencies',
    price: { monthly: 99.99, yearly: 999.99 },
    currency: 'USD',
    features: {
      savedSearches: -1,
      favorites: -1,
      propertyAlerts: true,
      advancedFilters: true,
      priceHistory: true,
      marketTrends: true,
      neighborhoodInsights: true,
      comparativeAnalysis: true,
      investmentCalculator: true,
      virtualTours: true,
      floorPlans: true,
      schoolRatings: true,
      crimeStatistics: true,
      walkScore: true,
      directAgentContact: true,
      prioritySupport: true,
      personalizedRecommendations: true,
      createListings: true,
      leadGeneration: true,
      analyticsReports: true,
      crm: true,
      teamCollaboration: true,
      adFree: true,
      customBranding: true,
      apiAccess: true,
    },
  },
};

/**
 * Subscription Schema
 */
export const SubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Plan details
  plan: z.nativeEnum(SubscriptionPlan),
  status: z.nativeEnum(SubscriptionStatus),
  interval: z.nativeEnum(BillingInterval),

  // Pricing
  amount: z.number().min(0),
  currency: z.string().length(3).default('USD'),

  // Billing dates
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean().default(false),

  // Trial
  trialStart: z.date().optional(),
  trialEnd: z.date().optional(),

  // Payment
  paymentProvider: z.enum(['stripe', 'paypal', 'apple_pay', 'google_pay']),
  paymentProviderCustomerId: z.string().optional(),
  paymentProviderSubscriptionId: z.string().optional(),

  // Metadata
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    canceledAt: z.date().optional(),
    cancelReason: z.string().optional(),
  }),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Usage Tracking Schema
 * Track feature usage against limits
 */
export const UsageTrackingSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
  period: z.string(), // e.g., "2025-12"

  // Usage counters
  savedSearches: z.number().int().min(0).default(0),
  favorites: z.number().int().min(0).default(0),
  propertyViews: z.number().int().min(0).default(0),
  agentContacts: z.number().int().min(0).default(0),
  reportDownloads: z.number().int().min(0).default(0),
  apiCalls: z.number().int().min(0).default(0),

  lastUpdated: z.date(),
});

export type UsageTracking = z.infer<typeof UsageTrackingSchema>;
