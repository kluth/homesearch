import { z } from 'zod';

/**
 * Social & Community Features
 */

/**
 * Property Reviews & Ratings
 */
export enum ReviewType {
  PROPERTY = 'property',
  AGENT = 'agent',
  NEIGHBORHOOD = 'neighborhood',
  LANDLORD = 'landlord',
  BUILDER = 'builder',
}

export const ReviewSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ReviewType),

  // Target
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  landlordId: z.string().optional(),
  builderId: z.string().optional(),

  // Reviewer
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().optional(),
  verified: z.boolean().default(false), // Verified as actual resident/buyer

  // Review content
  rating: z.number().min(1).max(5),
  title: z.string(),
  content: z.string(),

  // Category ratings (property specific)
  categoryRatings: z.object({
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    condition: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
    management: z.number().min(1).max(5).optional(),
    neighbors: z.number().min(1).max(5).optional(),
  }).optional(),

  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
  })).optional(),

  // Helpful votes
  helpfulCount: z.number().default(0),
  notHelpfulCount: z.number().default(0),

  // Moderation
  flagged: z.boolean().default(false),
  flagReason: z.string().optional(),
  approved: z.boolean().default(false),

  // Response (from agent/landlord)
  response: z.object({
    userId: z.string(),
    userName: z.string(),
    content: z.string(),
    createdAt: z.date(),
  }).optional(),

  // Metadata
  moveInDate: z.date().optional(),
  moveOutDate: z.date().optional(),
  lengthOfResidence: z.number().optional(), // months

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Review = z.infer<typeof ReviewSchema>;

/**
 * Neighborhood Forums & Discussions
 */
export enum PostCategory {
  GENERAL = 'general',
  EVENTS = 'events',
  RECOMMENDATIONS = 'recommendations',
  SAFETY = 'safety',
  SCHOOLS = 'schools',
  LOCAL_BUSINESS = 'local_business',
  LOST_AND_FOUND = 'lost_and_found',
  FOR_SALE = 'for_sale',
  COMPLAINTS = 'complaints',
  IMPROVEMENTS = 'improvements',
}

export const ForumPostSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  category: z.nativeEnum(PostCategory),

  // Author
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  authorIsResident: z.boolean().default(false),

  // Content
  title: z.string(),
  content: z.string(),
  images: z.array(z.string().url()).optional(),

  // Tags
  tags: z.array(z.string()).optional(),

  // Engagement
  views: z.number().default(0),
  likes: z.number().default(0),
  commentCount: z.number().default(0),

  // Pinned/featured
  pinned: z.boolean().default(false),
  featured: z.boolean().default(false),

  // Moderation
  flagged: z.boolean().default(false),
  removed: z.boolean().default(false),
  locked: z.boolean().default(false), // Comments disabled

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForumPost = z.infer<typeof ForumPostSchema>;

export const ForumCommentSchema = z.object({
  id: z.string(),
  postId: z.string(),

  // Author
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  authorIsResident: z.boolean().default(false),

  // Content
  content: z.string(),
  images: z.array(z.string().url()).optional(),

  // Threading
  parentCommentId: z.string().optional(),
  depth: z.number().default(0),

  // Engagement
  likes: z.number().default(0),

  // Moderation
  flagged: z.boolean().default(false),
  removed: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForumComment = z.infer<typeof ForumCommentSchema>;

/**
 * Local Resident Insights
 */
export const ResidentInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().optional(),

  // Residency
  neighborhoodId: z.string(),
  verified: z.boolean().default(false),
  residenceDuration: z.number(), // months
  residenceType: z.enum(['owner', 'renter', 'former_resident']),

  // Insights
  insights: z.object({
    // What they love
    loves: z.array(z.string()),
    // What could be better
    improvements: z.array(z.string()),
    // Hidden gems
    hiddenGems: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      location: z.string().optional(),
    })),
    // Tips for newcomers
    tips: z.array(z.string()),
  }),

  // Ratings
  ratings: z.object({
    overall: z.number().min(1).max(5),
    walkability: z.number().min(1).max(5),
    safety: z.number().min(1).max(5),
    schools: z.number().min(1).max(5),
    restaurants: z.number().min(1).max(5),
    nightlife: z.number().min(1).max(5),
    shopping: z.number().min(1).max(5),
    parks: z.number().min(1).max(5),
    neighbors: z.number().min(1).max(5),
  }),

  // Demographics fit
  bestFor: z.array(z.enum([
    'families',
    'young_professionals',
    'retirees',
    'students',
    'singles',
    'couples',
    'pet_owners',
    'remote_workers',
  ])),

  // Engagement
  helpfulCount: z.number().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ResidentInsight = z.infer<typeof ResidentInsightSchema>;

/**
 * Property Sharing & Collaboration
 */
export const SharedPropertyListSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Properties
  propertyIds: z.array(z.string()),

  // Collaborators
  collaborators: z.array(z.object({
    userId: z.string(),
    email: z.string().email(),
    accessLevel: z.enum(['view', 'comment', 'edit']),
    invitedAt: z.date(),
    acceptedAt: z.date().optional(),
  })),

  // Comments/notes
  notes: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    propertyId: z.string().optional(),
    content: z.string(),
    createdAt: z.date(),
  })),

  // Voting/ranking
  votes: z.array(z.object({
    userId: z.string(),
    propertyId: z.string(),
    vote: z.enum(['love', 'like', 'maybe', 'no']),
  })).optional(),

  // Privacy
  visibility: z.enum(['private', 'shared', 'public']),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SharedPropertyList = z.infer<typeof SharedPropertyListSchema>;

/**
 * Agent Profiles & Performance
 */
export const AgentProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Professional info
  licenseNumber: z.string(),
  licenseState: z.string(),
  brokerage: z.string(),
  yearsExperience: z.number(),

  // Specializations
  specializations: z.array(z.enum([
    'buyer_agent',
    'seller_agent',
    'luxury',
    'first_time_buyers',
    'investment',
    'relocation',
    'foreclosures',
    'new_construction',
    'senior_housing',
    'condos',
  ])),

  // Service areas
  serviceAreas: z.array(z.object({
    city: z.string(),
    state: z.string(),
    neighborhoods: z.array(z.string()).optional(),
  })),

  // Languages
  languages: z.array(z.string()),

  // Statistics
  stats: z.object({
    totalSales: z.number(),
    totalVolume: z.number(),
    averagePrice: z.number(),
    currentListings: z.number(),
    avgDaysOnMarket: z.number(),
    listPriceAccuracy: z.number(), // Percentage
  }),

  // Ratings
  ratings: z.object({
    overall: z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
    professionalism: z.number().min(0).max(5),
    knowledge: z.number().min(0).max(5),
    negotiation: z.number().min(0).max(5),
    totalReviews: z.number(),
  }),

  // Verification
  verified: z.boolean().default(false),
  backgroundChecked: z.boolean().default(false),

  // Availability
  availability: z.object({
    acceptingClients: z.boolean().default(true),
    responseTime: z.string().optional(), // "Within 1 hour"
  }),

  // Featured/premium
  featured: z.boolean().default(false),
  premiumMember: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

/**
 * User Activity Feed
 */
export enum ActivityType {
  FAVORITED_PROPERTY = 'favorited_property',
  VIEWED_PROPERTY = 'viewed_property',
  MADE_OFFER = 'made_offer',
  SCHEDULED_SHOWING = 'scheduled_showing',
  WROTE_REVIEW = 'wrote_review',
  JOINED_NEIGHBORHOOD = 'joined_neighborhood',
  SHARED_PROPERTY = 'shared_property',
  COMPLETED_LESSON = 'completed_lesson',
  EARNED_BADGE = 'earned_badge',
}

export const ActivityFeedItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(ActivityType),

  // Activity details
  propertyId: z.string().optional(),
  reviewId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  badgeId: z.string().optional(),

  // Display
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),

  // Privacy
  visibility: z.enum(['private', 'friends', 'public']).default('private'),

  // Engagement
  likes: z.number().default(0),
  comments: z.number().default(0),

  timestamp: z.date(),
});

export type ActivityFeedItem = z.infer<typeof ActivityFeedItemSchema>;

/**
 * User Connections & Network
 */
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked',
}

export const UserConnectionSchema = z.object({
  id: z.string(),
  requesterId: z.string(),
  addresseeId: z.string(),

  status: z.nativeEnum(ConnectionStatus),

  // Connection context
  source: z.enum([
    'search',
    'neighborhood',
    'shared_property',
    'suggestion',
    'email_invite',
  ]).optional(),

  message: z.string().optional(),

  requestedAt: z.date(),
  respondedAt: z.date().optional(),
  updatedAt: z.date(),
});

export type UserConnection = z.infer<typeof UserConnectionSchema>;

/**
 * Referral Program
 */
export const ReferralSchema = z.object({
  id: z.string(),
  referrerId: z.string(), // Person who referred
  refereeId: z.string().optional(), // Person who was referred
  refereeEmail: z.string().email(),

  // Status
  status: z.enum(['invited', 'signed_up', 'qualified', 'rewarded']),
  invitedAt: z.date(),
  signedUpAt: z.date().optional(),
  qualifiedAt: z.date().optional(),

  // Rewards
  referrerReward: z.object({
    type: z.enum(['credit', 'discount', 'cash', 'premium_months']),
    amount: z.number(),
    claimed: z.boolean().default(false),
    claimedAt: z.date().optional(),
  }).optional(),

  refereeReward: z.object({
    type: z.enum(['credit', 'discount', 'cash', 'premium_months']),
    amount: z.number(),
    claimed: z.boolean().default(false),
    claimedAt: z.date().optional(),
  }).optional(),

  // Qualifying action (e.g., purchased subscription, closed deal)
  qualifyingAction: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Referral = z.infer<typeof ReferralSchema>;
