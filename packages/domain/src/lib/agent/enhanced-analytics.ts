/**
 * Enhanced Agent Analytics
 * Provides predictive lead scoring, ROI tracking, and A/B testing for agent listings
 * Revenue opportunity: Upsell to $99/mo Premium Agent tier
 */

import { z } from 'zod';

// ============================================================================
// PREDICTIVE LEAD SCORING
// ============================================================================

/**
 * Engagement signals that indicate lead quality
 */
export const LeadEngagementSignalsSchema = z.object({
  // Viewing behavior
  propertyViewCount: z.number().default(0),
  averageTimeOnListing: z.number().default(0), // Seconds
  returnVisits: z.number().default(0),
  photoGalleryViewed: z.boolean().default(false),
  virtualTourViewed: z.boolean().default(false),

  // Interaction depth
  calculatorUsed: z.boolean().default(false),
  mapExplored: z.boolean().default(false),
  schoolsViewed: z.boolean().default(false),
  neighborhoodInsightsRead: z.boolean().default(false),

  // Contact signals
  inquiriesSent: z.number().default(0),
  phoneNumberRevealed: z.boolean().default(false),
  tourRequested: z.boolean().default(false),
  agentMessaged: z.boolean().default(false),

  // Qualification signals
  preApprovalUploaded: z.boolean().default(false),
  financialCalculatorCompleted: z.boolean().default(false),
  savedSearches: z.number().default(0),
  favoriteProperties: z.number().default(0),

  // Timeline indicators
  accountAge: z.number().default(0), // Days
  lastActivity: z.date(),
  activityFrequency: z.enum(['daily', 'weekly', 'monthly', 'sporadic']),

  // Budget alignment
  viewingPriceRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  listingPriceVsViewing: z.enum(['below', 'within', 'above', 'unknown']).default('unknown'),
});

/**
 * ML-based lead scoring with confidence and explanations
 */
export const PredictiveLeadScoreSchema = z.object({
  leadId: z.string(),
  userId: z.string(),
  propertyId: z.string(),
  agentId: z.string(),

  // Core score (0-100)
  score: z.number().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),

  // Tier classification
  tier: z.enum(['hot', 'warm', 'cold', 'inactive']),

  // Probability predictions
  predictions: z.object({
    willInquire: z.number().min(0).max(1), // 0-1 probability
    willTour: z.number().min(0).max(1),
    willOffer: z.number().min(0).max(1),
    daysToConversion: z.number().optional(), // Estimated days
  }),

  // Score breakdown
  breakdown: z.object({
    engagement: z.number().min(0).max(100), // How engaged
    intent: z.number().min(0).max(100), // Buying intent
    qualification: z.number().min(0).max(100), // Financial readiness
    timing: z.number().min(0).max(100), // Urgency
  }),

  // Signals used
  signals: LeadEngagementSignalsSchema,

  // Actionable insights
  recommendations: z.array(z.object({
    action: z.enum([
      'call_immediately',
      'send_similar_listings',
      'schedule_tour',
      'request_preapproval',
      'send_market_update',
      'nurture_with_content',
      'no_action_needed',
    ]),
    reason: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    estimatedImpact: z.string(), // e.g., "+15% conversion probability"
  })),

  // Metadata
  scoredAt: z.date(),
  modelVersion: z.string(), // For A/B testing different models
});

export type PredictiveLeadScore = z.infer<typeof PredictiveLeadScoreSchema>;

// ============================================================================
// ROI TRACKING & ATTRIBUTION
// ============================================================================

/**
 * Marketing channels that agents use
 */
export enum MarketingChannel {
  FEATURED_LISTING = 'featured_listing',
  SPONSORED_LISTING = 'sponsored_listing',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  ZILLOW_SYNDICATION = 'zillow_syndication',
  REALTOR_SYNDICATION = 'realtor_syndication',
  OPEN_HOUSE = 'open_house',
  DIRECT_MAIL = 'direct_mail',
  GOOGLE_ADS = 'google_ads',
  YARD_SIGN = 'yard_sign',
  REFERRAL = 'referral',
  ORGANIC_SEARCH = 'organic_search',
  AGENT_WEBSITE = 'agent_website',
}

/**
 * Tracks spend and performance per marketing channel
 */
export const MarketingChannelPerformanceSchema = z.object({
  agentId: z.string(),
  propertyId: z.string().optional(), // Null = agent-level aggregate
  channel: z.nativeEnum(MarketingChannel),

  // Investment
  spend: z.number(), // Total $ spent
  startDate: z.date(),
  endDate: z.date().optional(),

  // Metrics
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  views: z.number().default(0), // Property detail views
  inquiries: z.number().default(0),
  tours: z.number().default(0),
  offers: z.number().default(0),

  // Outcomes
  leadsGenerated: z.number().default(0),
  closedDeals: z.number().default(0),
  revenue: z.number().default(0), // Commission earned

  // Calculated ROI
  ctr: z.number().default(0), // Click-through rate
  conversionRate: z.number().default(0), // Inquiries / views
  costPerLead: z.number().default(0),
  costPerAcquisition: z.number().default(0),
  roi: z.number().default(0), // (Revenue - Spend) / Spend * 100

  // Attribution
  attributionModel: z.enum(['first_touch', 'last_touch', 'linear', 'time_decay']).default('last_touch'),
});

export type MarketingChannelPerformance = z.infer<typeof MarketingChannelPerformanceSchema>;

/**
 * Agent's complete ROI dashboard
 */
export const AgentROIDashboardSchema = z.object({
  agentId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),

  // Overall performance
  summary: z.object({
    totalSpend: z.number(),
    totalRevenue: z.number(),
    totalROI: z.number(),
    totalLeads: z.number(),
    totalDeals: z.number(),
    avgDealSize: z.number(),
  }),

  // Per-channel breakdown
  channels: z.array(MarketingChannelPerformanceSchema),

  // Best/worst performers
  topChannels: z.array(z.object({
    channel: z.nativeEnum(MarketingChannel),
    roi: z.number(),
    revenue: z.number(),
  })),

  worstChannels: z.array(z.object({
    channel: z.nativeEnum(MarketingChannel),
    roi: z.number(),
    reason: z.string(), // Why it's underperforming
  })),

  // Recommendations
  budgetRecommendations: z.array(z.object({
    channel: z.nativeEnum(MarketingChannel),
    action: z.enum(['increase_spend', 'decrease_spend', 'pause', 'continue']),
    currentSpend: z.number(),
    recommendedSpend: z.number(),
    expectedImpact: z.string(),
  })),

  // Trends
  trends: z.object({
    leadQualityTrend: z.enum(['improving', 'stable', 'declining']),
    costPerLeadTrend: z.enum(['decreasing', 'stable', 'increasing']),
    roiTrend: z.enum(['improving', 'stable', 'declining']),
  }),
});

export type AgentROIDashboard = z.infer<typeof AgentROIDashboardSchema>;

// ============================================================================
// A/B TESTING FOR LISTINGS
// ============================================================================

/**
 * Variants of a listing for A/B testing
 */
export const ListingVariantSchema = z.object({
  id: z.string(),
  variantName: z.string(), // "Control", "Variant A", "Variant B"

  // What's being tested
  testingElement: z.enum([
    'headline',
    'description',
    'photos',
    'photo_order',
    'price_display',
    'virtual_tour',
    'cta_button',
    'highlights',
  ]),

  // Variant content
  headline: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(), // URLs
  priceDisplay: z.enum(['exact', 'range', 'starting_at']).optional(),
  ctaText: z.string().optional(),
  highlights: z.array(z.string()).optional(),

  // Performance
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  views: z.number().default(0),
  inquiries: z.number().default(0),
  tours: z.number().default(0),
  favorites: z.number().default(0),

  // Calculated metrics
  ctr: z.number().default(0),
  inquiryRate: z.number().default(0),
  tourRate: z.number().default(0),
  favoriteRate: z.number().default(0),
});

export type ListingVariant = z.infer<typeof ListingVariantSchema>;

/**
 * A/B test configuration and results
 */
export const ListingABTestSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  agentId: z.string(),

  status: z.enum(['draft', 'running', 'paused', 'completed']),

  // Test setup
  hypothesis: z.string(), // "Changing the headline will increase inquiries by 20%"
  primaryMetric: z.enum(['ctr', 'inquiries', 'tours', 'favorites']),

  variants: z.array(ListingVariantSchema).min(2).max(5),

  // Test configuration
  trafficAllocation: z.record(z.number()), // variantId -> percentage (must sum to 100)
  startDate: z.date(),
  endDate: z.date().optional(),
  minimumSampleSize: z.number().default(100), // Views before declaring winner
  confidenceLevel: z.number().default(0.95), // Statistical significance

  // Results
  winner: z.object({
    variantId: z.string(),
    improvement: z.number(), // Percentage improvement over control
    confidence: z.number(), // Statistical confidence
    declaredAt: z.date(),
  }).optional(),

  // Statistical analysis
  analysis: z.object({
    sampleSize: z.number(),
    statisticalSignificance: z.boolean(),
    pValue: z.number().optional(),
    effect: z.string(), // "12% increase in inquiries"
  }).optional(),

  // Insights
  learnings: z.array(z.object({
    insight: z.string(),
    application: z.string(), // How to apply this learning
  })).optional(),
});

export type ListingABTest = z.infer<typeof ListingABTestSchema>;

// ============================================================================
// AGENT PERFORMANCE BENCHMARKING
// ============================================================================

/**
 * Compare agent performance to market averages
 */
export const AgentBenchmarkSchema = z.object({
  agentId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),

  metrics: z.object({
    // Time to close
    avgDaysToClose: z.object({
      agent: z.number(),
      market: z.number(),
      percentile: z.number(), // Where agent ranks (0-100)
    }),

    // List to sale ratio
    listToSaleRatio: z.object({
      agent: z.number(), // Avg sale price / list price
      market: z.number(),
      percentile: z.number(),
    }),

    // Inquiry response time
    avgResponseTime: z.object({
      agent: z.number(), // Minutes
      market: z.number(),
      percentile: z.number(),
    }),

    // Tour to offer ratio
    tourToOfferRatio: z.object({
      agent: z.number(),
      market: z.number(),
      percentile: z.number(),
    }),

    // Client satisfaction
    averageRating: z.object({
      agent: z.number(),
      market: z.number(),
      percentile: z.number(),
    }),

    // Marketing effectiveness
    viewsPerListing: z.object({
      agent: z.number(),
      market: z.number(),
      percentile: z.number(),
    }),
  }),

  // Overall ranking
  overallScore: z.number().min(0).max(100),
  tier: z.enum(['top_10', 'top_25', 'top_50', 'average', 'below_average']),

  // Improvement opportunities
  improvements: z.array(z.object({
    metric: z.string(),
    currentValue: z.number(),
    marketAverage: z.number(),
    potentialGain: z.string(), // "Improving response time could generate 3 more deals/month"
    actionItems: z.array(z.string()),
  })),
});

export type AgentBenchmark = z.infer<typeof AgentBenchmarkSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const EnhancedAnalyticsSchemas = {
  LeadEngagementSignals: LeadEngagementSignalsSchema,
  PredictiveLeadScore: PredictiveLeadScoreSchema,
  MarketingChannelPerformance: MarketingChannelPerformanceSchema,
  AgentROIDashboard: AgentROIDashboardSchema,
  ListingVariant: ListingVariantSchema,
  ListingABTest: ListingABTestSchema,
  AgentBenchmark: AgentBenchmarkSchema,
};
