/**
 * Saved Searches & Smart Notifications
 * Intelligent property alerts with ML-powered matching
 */

import { z } from 'zod';

// ============================================================================
// SAVED SEARCH
// ============================================================================

/**
 * Search criteria that can be saved and monitored
 */
export const SavedSearchSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Search name
  name: z.string().max(100), // "3BR in Austin under $400k"
  emoji: z.string().optional(), // 🏡 for personality

  // Search criteria
  criteria: z.object({
    // Location
    locations: z.array(z.object({
      type: z.enum(['city', 'zip', 'neighborhood', 'county', 'custom_area']),
      value: z.string(),
      radius: z.number().optional(), // Miles
    })),

    // Price
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),

    // Property details
    bedrooms: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      exact: z.number().optional(),
    }).optional(),

    bathrooms: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    squareFeet: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    lotSize: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    // Property types
    propertyTypes: z.array(z.enum([
      'single_family',
      'condo',
      'townhouse',
      'multi_family',
      'land',
      'mobile',
    ])).optional(),

    // Listing status
    listingStatus: z.array(z.enum([
      'active',
      'pending',
      'under_contract',
      'coming_soon',
    ])).default(['active']),

    // Features
    features: z.object({
      pool: z.boolean().optional(),
      garage: z.boolean().optional(),
      fireplac e: z.boolean().optional(),
      waterfront: z.boolean().optional(),
      viewProperty: z.boolean().optional(),
      gatedCommunity: z.boolean().optional(),
      seniorCommunity: z.boolean().optional(),
    }).optional(),

    // Additional filters
    yearBuilt: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    hoaFeeMax: z.number().optional(),

    // Schools (if important)
    schoolRatingMin: z.number().min(1).max(10).optional(),

    // Keywords
    keywords: z.array(z.string()).optional(),
    excludeKeywords: z.array(z.string()).optional(),
  }),

  // Notification preferences
  notifications: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(['instant', 'daily_digest', 'weekly_digest']).default('daily_digest'),
    channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).default(['email', 'push']),

    // Smart filtering
    onlyShowBestMatches: z.boolean().default(false), // AI-filtered
    minimumMatchScore: z.number().min(0).max(100).default(70),

    // Notification conditions
    conditions: z.object({
      priceDrops: z.boolean().default(true),
      priceDropPercentage: z.number().default(5), // Alert if price drops 5%+
      newListings: z.boolean().default(true),
      backOnMarket: z.boolean().default(true),
      openHouses: z.boolean().default(false),
    }),
  }),

  // Activity tracking
  stats: z.object({
    totalMatches: z.number().default(0),
    newMatchesToday: z.number().default(0),
    notificationsSent: z.number().default(0),
    lastMatchDate: z.date().optional(),
    propertiesViewed: z.number().default(0), // From this search
    propertiesInquired: z.number().default(0),
  }),

  // Status
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false), // User's main search

  // Metadata
  createdAt: z.date(),
  lastModifiedAt: z.date().optional(),
  lastCheckedAt: z.date().optional(),
});

export type SavedSearch = z.infer<typeof SavedSearchSchema>;

// ============================================================================
// SEARCH MATCH
// ============================================================================

/**
 * A property that matches a saved search
 */
export const SearchMatchSchema = z.object({
  id: z.string(),
  savedSearchId: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Match details
  matchScore: z.number().min(0).max(100), // How well it matches (ML-calculated)
  matchedAt: z.date(),

  // Match explanation
  matchReasons: z.array(z.object({
    criterion: z.string(), // "Price", "Location", "Bedrooms"
    actual: z.any(), // Actual property value
    desired: z.any(), // User's criterion
    score: z.number().min(0).max(100),
    isExactMatch: z.boolean(),
  })),

  // Highlights
  highlights: z.array(z.string()), // ["Under budget by $20k", "Recently price reduced", "Excellent schools"]

  // Match type
  matchType: z.enum([
    'perfect_match', // Meets all criteria
    'strong_match', // Meets most criteria
    'good_match', // Meets important criteria
    'potential_match', // Close but not perfect
    'you_might_like', // AI suggestion based on behavior
  ]),

  // Special flags
  flags: z.object({
    newListing: z.boolean().default(false),
    priceReduced: z.boolean().default(false),
    priceReductionAmount: z.number().optional(),
    backOnMarket: z.boolean().default(false),
    hotProperty: z.boolean().default(false), // High demand
    openHouse: z.boolean().default(false),
    openHouseDate: z.date().optional(),
  }),

  // User actions
  actions: z.object({
    viewed: z.boolean().default(false),
    viewedAt: z.date().optional(),
    favorited: z.boolean().default(false),
    inquired: z.boolean().default(false),
    dismissed: z.boolean().default(false),
    dismissedReason: z.string().optional(),
  }),

  // Notification status
  notificationSent: z.boolean().default(false),
  notificationSentAt: z.date().optional(),
  notificationChannel: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).optional(),
});

export type SearchMatch = z.infer<typeof SearchMatchSchema>;

// ============================================================================
// SMART NOTIFICATION
// ============================================================================

/**
 * Intelligent notification about property matches
 */
export const SmartNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  savedSearchId: z.string(),

  // Notification type
  type: z.enum([
    'new_matches',
    'price_alert',
    'hot_property',
    'market_update',
    'search_suggestion',
    'digest',
  ]),

  // Content
  title: z.string(),
  message: z.string(),
  properties: z.array(z.string()), // Property IDs

  // Priority
  priority: z.enum(['low', 'medium', 'high', 'urgent']),

  // Delivery
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])),
  scheduledFor: z.date(),
  sentAt: z.date().optional(),

  // Engagement
  opened: z.boolean().default(false),
  openedAt: z.date().optional(),
  clicked: z.boolean().default(false),
  clickedAt: z.date().optional(),
  actionsT aken: z.number().default(0), // Views, favorites, inquiries from this notification

  // Personalization
  personalizedContent: z.object({
    greeting: z.string().optional(), // "Good morning, Sarah!"
    insight: z.string().optional(), // "Based on your recent activity..."
    urgency: z.string().optional(), // "3 new homes in your price range"
    cta: z.string(), // "View matches now"
  }).optional(),

  // Metadata
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

export type SmartNotification = z.infer<typeof SmartNotificationSchema>;

// ============================================================================
// MARKET UPDATE
// ============================================================================

/**
 * Market insights for saved search area
 */
export const SearchMarketUpdateSchema = z.object({
  savedSearchId: z.string(),
  userId: z.string(),

  period: z.object({
    start: z.date(),
    end: z.date(),
  }),

  // Inventory changes
  inventory: z.object({
    totalActiveListings: z.number(),
    newListingsThisPeriod: z.number(),
    changedStatus: z.number(),
    averageDaysOnMarket: z.number(),
    trend: z.enum(['increasing', 'stable', 'decreasing']),
  }),

  // Price trends
  pricing: z.object({
    medianPrice: z.number(),
    priceChange: z.number(), // Percentage change
    pricePerSqFt: z.number(),
    medianPriceChange: z.number(), // $ change
    trend: z.enum(['rising', 'stable', 'falling']),
  }),

  // Competition
  competition: z.object({
    marketType: z.enum(['sellers_market', 'balanced', 'buyers_market']),
    averageOffersPerProperty: z.number().optional(),
    percentageOverAsking: z.number().optional(),
    demandScore: z.number().min(0).max(100), // How competitive
  }),

  // Opportunities
  opportunities: z.array(z.object({
    type: z.enum(['price_drop', 'new_listing', 'reduced_competition', 'seasonal_opportunity']),
    description: z.string(),
    actionSuggestion: z.string(),
  })),

  // Recommendations
  recommendations: z.array(z.object({
    type: z.enum(['adjust_budget', 'expand_area', 'adjust_criteria', 'act_quickly', 'wait_and_watch']),
    reason: z.string(),
    details: z.string(),
  })),

  generatedAt: z.date(),
});

export type SearchMarketUpdate = z.infer<typeof SearchMarketUpdateSchema>;

// ============================================================================
// SEARCH OPTIMIZATION SUGGESTIONS
// ============================================================================

/**
 * AI suggestions to improve search results
 */
export const SearchOptimizationSchema = z.object({
  savedSearchId: z.string(),
  userId: z.string(),

  // Current search performance
  currentPerformance: z.object({
    matchCount: z.number(),
    qualityScore: z.number().min(0).max(100), // How good the matches are
    viewRate: z.number(), // % of matches viewed
    inquiryRate: z.number(), // % of matches inquired about
  }),

  // Issues identified
  issues: z.array(z.object({
    type: z.enum([
      'too_narrow', // Very few matches
      'too_broad', // Too many irrelevant matches
      'unrealistic_criteria', // Impossible combination
      'outdated_preferences', // Based on old behavior
      'missing_opportunities', // Could expand slightly for better options
    ]),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    impact: z.string(),
  })),

  // Suggestions
  suggestions: z.array(z.object({
    type: z.enum([
      'increase_budget',
      'decrease_budget',
      'expand_location',
      'reduce_bedrooms',
      'increase_bedrooms',
      'adjust_sqft',
      'consider_property_types',
      'relax_feature_requirements',
    ]),
    description: z.string(),
    expectedImpact: z.string(), // "+15 more properties in your range"
    newMatchCount: z.number(), // Estimated new matches
    priority: z.enum(['low', 'medium', 'high']),
    oneClickApply: z.boolean(), // Can be applied with one click
  })),

  // Alternative searches
  alternativeSearches: z.array(z.object({
    name: z.string(),
    criteria: z.any(), // Modified search criteria
    estimatedMatches: z.number(),
    tradeoff: z.string(), // "Slightly higher budget but better schools"
  })),

  generatedAt: z.date(),
});

export type SearchOptimization = z.infer<typeof SearchOptimizationSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const SearchSchemas = {
  SavedSearch: SavedSearchSchema,
  SearchMatch: SearchMatchSchema,
  SmartNotification: SmartNotificationSchema,
  SearchMarketUpdate: SearchMarketUpdateSchema,
  SearchOptimization: SearchOptimizationSchema,
};
