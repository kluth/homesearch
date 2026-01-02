/**
 * Neighborhood Reviews & Resident Insights
 * Provides authentic community feedback from actual residents
 * Addresses key learning: Reviews influence 85% of buying decisions
 */

import { z } from 'zod';

// ============================================================================
// NEIGHBORHOOD REVIEWS
// ============================================================================

/**
 * Review categories for neighborhoods
 */
export enum ReviewCategory {
  SAFETY = 'safety',
  SCHOOLS = 'schools',
  WALKABILITY = 'walkability',
  DINING = 'dining',
  SHOPPING = 'shopping',
  PARKS = 'parks',
  NIGHTLIFE = 'nightlife',
  TRANSIT = 'transit',
  COMMUNITY = 'community',
  NOISE = 'noise',
  CLEANLINESS = 'cleanliness',
  PARKING = 'parking',
}

/**
 * Rating breakdown by category
 */
export const CategoryRatingSchema = z.object({
  category: z.nativeEnum(ReviewCategory),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

/**
 * Comprehensive neighborhood review from resident
 */
export const NeighborhoodReviewSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(), // Standardized neighborhood identifier
  userId: z.string(),

  // Reviewer info
  reviewer: z.object({
    displayName: z.string(),
    avatar: z.string().url().optional(),
    residencyStatus: z.enum(['current_resident', 'former_resident', 'frequent_visitor']),
    yearsInNeighborhood: z.number().optional(),
    verified: z.boolean().default(false), // Verified via address confirmation
  }),

  // Overall rating
  overallRating: z.number().min(1).max(5),

  // Category-specific ratings
  categoryRatings: z.array(CategoryRatingSchema),

  // Written review
  title: z.string().max(100),
  content: z.string().min(50).max(5000),
  pros: z.array(z.string()).max(10).optional(),
  cons: z.array(z.string()).max(10).optional(),

  // Helpful tags
  tags: z.array(z.enum([
    'family_friendly',
    'pet_friendly',
    'quiet',
    'walkable',
    'nightlife',
    'young_professionals',
    'retirees',
    'diverse',
    'affordable',
    'luxury',
    'up_and_coming',
    'established',
    'bike_friendly',
    'car_dependent',
    'transit_accessible',
  ])).optional(),

  // Target audience
  bestFor: z.array(z.enum([
    'families_with_kids',
    'young_professionals',
    'retirees',
    'students',
    'remote_workers',
    'artists',
    'entrepreneurs',
    'outdoor_enthusiasts',
  ])).optional(),

  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
    category: z.nativeEnum(ReviewCategory).optional(),
  })).max(10).optional(),

  // Community engagement
  helpful: z.number().default(0), // Upvotes
  notHelpful: z.number().default(0), // Downvotes
  reportCount: z.number().default(0),

  // Moderation
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).default('pending'),
  moderatorNotes: z.string().optional(),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  verified: z.boolean().default(false), // Verified resident
});

export type NeighborhoodReview = z.infer<typeof NeighborhoodReviewSchema>;

// ============================================================================
// NEIGHBORHOOD INSIGHTS AGGREGATION
// ============================================================================

/**
 * Aggregated insights from all reviews for a neighborhood
 */
export const NeighborhoodInsightsSummarySchema = z.object({
  neighborhoodId: z.string(),
  neighborhoodName: z.string(),

  // Overall metrics
  totalReviews: z.number(),
  verifiedReviews: z.number(),
  averageOverallRating: z.number().min(1).max(5),

  // Category averages
  categoryAverages: z.record(z.number()), // category -> avg rating

  // Most mentioned pros/cons
  topPros: z.array(z.object({
    text: z.string(),
    mentionCount: z.number(),
  })).max(5),

  topCons: z.array(z.object({
    text: z.string(),
    mentionCount: z.number(),
  })).max(5),

  // Common tags
  popularTags: z.array(z.object({
    tag: z.string(),
    count: z.number(),
    percentage: z.number(), // % of reviews mentioning this
  })),

  // Best for analysis
  bestFor: z.array(z.object({
    audience: z.string(),
    percentage: z.number(), // % of reviews recommending for this audience
  })),

  // Sentiment analysis
  sentiment: z.object({
    positive: z.number(), // Percentage
    neutral: z.number(),
    negative: z.number(),
    trending: z.enum(['improving', 'stable', 'declining']),
  }),

  // Review distribution
  ratingDistribution: z.object({
    five_star: z.number(),
    four_star: z.number(),
    three_star: z.number(),
    two_star: z.number(),
    one_star: z.number(),
  }),

  // Recency
  recentActivity: z.object({
    last30Days: z.number(),
    last90Days: z.number(),
    lastReview: z.date().optional(),
  }),

  // Helpful highlights
  editorHighlights: z.array(z.object({
    reviewId: z.string(),
    excerpt: z.string(),
    reason: z.string(), // Why this is highlighted
  })).max(3).optional(),

  lastUpdated: z.date(),
});

export type NeighborhoodInsightsSummary = z.infer<typeof NeighborhoodInsightsSummarySchema>;

// ============================================================================
// RESIDENT Q&A
// ============================================================================

/**
 * Questions about neighborhoods from prospective buyers
 */
export const NeighborhoodQuestionSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  userId: z.string(),

  // Question
  question: z.string().min(10).max(500),
  category: z.nativeEnum(ReviewCategory).optional(),
  context: z.string().optional(), // "Moving with 2 kids and a dog"

  // Asker info
  asker: z.object({
    displayName: z.string(),
    avatar: z.string().url().optional(),
    isAnonymous: z.boolean().default(false),
  }),

  // Engagement
  views: z.number().default(0),
  upvotes: z.number().default(0),
  answerCount: z.number().default(0),

  // Status
  status: z.enum(['open', 'answered', 'closed']).default('open'),
  hasVerifiedAnswer: z.boolean().default(false), // At least one verified resident answered

  // Metadata
  createdAt: z.date(),
  closedAt: z.date().optional(),
});

export type NeighborhoodQuestion = z.infer<typeof NeighborhoodQuestionSchema>;

/**
 * Answers from residents and local experts
 */
export const NeighborhoodAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  userId: z.string(),

  // Answerer info
  answerer: z.object({
    displayName: z.string(),
    avatar: z.string().url().optional(),
    residencyStatus: z.enum(['current_resident', 'former_resident', 'local_expert', 'agent']),
    yearsInNeighborhood: z.number().optional(),
    verified: z.boolean().default(false),
    expertise: z.string().optional(), // "School administrator", "Local business owner"
  }),

  // Answer
  answer: z.string().min(20).max(2000),
  photos: z.array(z.string().url()).max(5).optional(),

  // Engagement
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),

  // Recognition
  isAcceptedAnswer: z.boolean().default(false), // Marked by question asker
  isFeatured: z.boolean().default(false), // Featured by moderators

  // Moderation
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type NeighborhoodAnswer = z.infer<typeof NeighborhoodAnswerSchema>;

// ============================================================================
// LOCAL EXPERT SYSTEM
// ============================================================================

/**
 * Local experts who can provide trusted neighborhood information
 */
export const LocalExpertProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatar: z.string().url().optional(),

  // Expertise
  neighborhoods: z.array(z.string()), // Neighborhood IDs they cover
  expertiseAreas: z.array(z.nativeEnum(ReviewCategory)),
  bio: z.string().max(500),

  // Credentials
  credentials: z.array(z.object({
    type: z.enum([
      'resident',
      'real_estate_agent',
      'school_administrator',
      'business_owner',
      'city_official',
      'community_organizer',
      'urban_planner',
    ]),
    title: z.string(),
    organization: z.string().optional(),
    verified: z.boolean().default(false),
  })),

  // Activity
  stats: z.object({
    reviewsWritten: z.number().default(0),
    questionsAnswered: z.number().default(0),
    helpfulVotes: z.number().default(0),
    acceptedAnswers: z.number().default(0),
  }),

  // Ranking
  expertScore: z.number().min(0).max(100),
  badges: z.array(z.enum([
    'top_contributor',
    'verified_resident',
    'helpful_guide',
    'neighborhood_champion',
    'rising_star',
  ])).optional(),

  // Availability
  available: z.boolean().default(true),
  responseTime: z.enum(['within_hours', 'within_day', 'within_week']).optional(),

  joinedAt: z.date(),
});

export type LocalExpertProfile = z.infer<typeof LocalExpertProfileSchema>;

// ============================================================================
// RESIDENT STORIES
// ============================================================================

/**
 * In-depth stories from residents about their experience
 */
export const ResidentStorySchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  userId: z.string(),

  // Story
  title: z.string().max(150),
  content: z.string().min(200).max(10000), // Longer form content
  coverImage: z.string().url(),
  photos: z.array(z.string().url()).max(20).optional(),

  // Resident info
  resident: z.object({
    displayName: z.string(),
    avatar: z.string().url().optional(),
    residencyDuration: z.string(), // "5 years", "Since 2018"
    familyType: z.enum([
      'single',
      'couple',
      'family_with_kids',
      'retirees',
      'roommates',
    ]).optional(),
    verified: z.boolean().default(false),
  }),

  // Story type
  storyType: z.enum([
    'why_i_love_it_here',
    'my_daily_routine',
    'hidden_gems',
    'moving_story',
    'raising_family',
    'retirement_paradise',
    'neighborhood_changes',
  ]),

  // Topics covered
  topics: z.array(z.nativeEnum(ReviewCategory)),

  // Engagement
  views: z.number().default(0),
  likes: z.number().default(0),
  shares: z.number().default(0),
  comments: z.number().default(0),

  // Featured
  isFeatured: z.boolean().default(false),
  featuredAt: z.date().optional(),

  // Metadata
  publishedAt: z.date(),
  updatedAt: z.date().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export type ResidentStory = z.infer<typeof ResidentStorySchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const CommunitySchemas = {
  NeighborhoodReview: NeighborhoodReviewSchema,
  NeighborhoodInsightsSummary: NeighborhoodInsightsSummarySchema,
  NeighborhoodQuestion: NeighborhoodQuestionSchema,
  NeighborhoodAnswer: NeighborhoodAnswerSchema,
  LocalExpertProfile: LocalExpertProfileSchema,
  ResidentStory: ResidentStorySchema,
};
