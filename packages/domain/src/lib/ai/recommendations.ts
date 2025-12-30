import { z } from 'zod';

/**
 * AI-Powered Property Recommendations
 */

export enum RecommendationReason {
  PRICE_MATCH = 'price_match',
  LOCATION_PREFERENCE = 'location_preference',
  SIMILAR_TO_FAVORITES = 'similar_to_favorites',
  MARKET_VALUE = 'market_value',
  GROWING_NEIGHBORHOOD = 'growing_neighborhood',
  SCHOOL_DISTRICT = 'school_district',
  COMMUTE_TIME = 'commute_time',
  PRICE_DROP = 'price_drop',
  NEW_LISTING = 'new_listing',
  TRENDING = 'trending',
}

export const PropertyRecommendationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),
  score: z.number().min(0).max(100), // 0-100 match score
  reasons: z.array(z.nativeEnum(RecommendationReason)),
  explanation: z.string(),
  createdAt: z.date(),
  viewedAt: z.date().optional(),
  dismissedAt: z.date().optional(),
  savedAt: z.date().optional(),
});

export type PropertyRecommendation = z.infer<typeof PropertyRecommendationSchema>;

/**
 * User Preferences for ML Model
 */
export const UserPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Explicit preferences
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  locations: z.array(z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    radius: z.number().optional(), // km
  })),
  propertyTypes: z.array(z.string()),
  bedrooms: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  bathrooms: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),

  // Lifestyle preferences
  mustHaveFeatures: z.array(z.string()).optional(), // ['garage', 'pool', 'garden']
  avoidFeatures: z.array(z.string()).optional(),

  // Commute preferences
  workLocations: z.array(z.object({
    address: z.string(),
    maxCommuteMinutes: z.number(),
    transportMode: z.enum(['driving', 'transit', 'walking', 'bicycling']),
  })).optional(),

  // Neighborhood preferences
  neighborhoodPriorities: z.object({
    schools: z.number().min(0).max(10).optional(),
    safety: z.number().min(0).max(10).optional(),
    walkability: z.number().min(0).max(10).optional(),
    nightlife: z.number().min(0).max(10).optional(),
    restaurants: z.number().min(0).max(10).optional(),
    parks: z.number().min(0).max(10).optional(),
    shopping: z.number().min(0).max(10).optional(),
    publicTransit: z.number().min(0).max(10).optional(),
  }).optional(),

  // Implicit preferences (learned from behavior)
  implicitPreferences: z.object({
    viewedPropertyTypes: z.record(z.number()).optional(),
    favoritePropertyTypes: z.record(z.number()).optional(),
    averageViewTime: z.number().optional(), // seconds
    mostViewedNeighborhoods: z.array(z.string()).optional(),
  }).optional(),

  updatedAt: z.date(),
  createdAt: z.date(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * AI Chat Bot Interactions
 */
export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.nativeEnum(ChatMessageRole),
  content: z.string(),
  timestamp: z.date(),

  // Context
  propertyId: z.string().optional(),
  searchQuery: z.string().optional(),

  // AI metadata
  model: z.string().optional(),
  tokens: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().optional(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  archived: z.boolean().default(false),
});

export type ChatConversation = z.infer<typeof ChatConversationSchema>;

/**
 * Automated Property Valuation
 */
export const PropertyValuationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),

  // Valuation results
  estimatedValue: z.number(),
  confidenceInterval: z.object({
    low: z.number(),
    high: z.number(),
  }),
  confidence: z.number().min(0).max(1),

  // Comparable properties
  comparables: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    soldPrice: z.number(),
    soldDate: z.date(),
    similarity: z.number().min(0).max(1),
    adjustments: z.record(z.number()).optional(),
  })),

  // Market factors
  marketFactors: z.object({
    neighborhoodTrend: z.enum(['declining', 'stable', 'growing', 'hot']),
    daysOnMarket: z.number(),
    pricePerSqFt: z.number(),
    marketPricePerSqFt: z.number(),
  }),

  // Value breakdown
  valueFactors: z.object({
    location: z.number(),
    condition: z.number(),
    size: z.number(),
    features: z.number(),
    market: z.number(),
  }),

  createdAt: z.date(),
  expiresAt: z.date(),
});

export type PropertyValuation = z.infer<typeof PropertyValuationSchema>;

/**
 * Smart Alerts
 */
export enum AlertType {
  PRICE_DROP = 'price_drop',
  NEW_MATCH = 'new_match',
  OPEN_HOUSE = 'open_house',
  STATUS_CHANGE = 'status_change',
  MARKET_UPDATE = 'market_update',
  SAVED_SEARCH_MATCH = 'saved_search_match',
  SIMILAR_PROPERTY = 'similar_property',
}

export const SmartAlertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(AlertType),

  // Alert details
  title: z.string(),
  message: z.string(),
  propertyId: z.string().optional(),
  searchId: z.string().optional(),

  // Alert data
  data: z.record(z.unknown()).optional(),

  // Delivery
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])),
  sentAt: z.date().optional(),
  readAt: z.date().optional(),
  clickedAt: z.date().optional(),

  // Scheduling
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  createdAt: z.date(),
});

export type SmartAlert = z.infer<typeof SmartAlertSchema>;
