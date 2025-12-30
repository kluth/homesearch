/**
 * Community & Collaboration Features
 * Connect users for roommate matching, group viewings, and shared searches
 */


/**
 * User profile for community features
 */
export interface CommunityUserProfile {
  userId: string;
  displayName: string;
  age?: number;
  occupation?: string;
  bio?: string;
  interests?: string[];
  lifestyle?: {
    smoker: boolean;
    pets: boolean;
    workFromHome: boolean;
    nightOwl: boolean;
    organized: boolean;
    social: boolean;
  };
  languages?: string[];
  verificationStatus: VerificationStatus;
  joinedAt: Date;
  lastActive: Date;
  rating?: number; // 0-5 from other users
  reviewCount?: number;
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  ID_VERIFIED = 'id_verified',
  FULLY_VERIFIED = 'fully_verified', // Email + Phone + ID
}

/**
 * Roommate matching request
 */
export interface RoommateRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  preferences: RoommatePreferences;
  budget: {
    min: number;
    max: number;
    splitType: 'equal' | 'proportional' | 'custom';
  };
  moveInDate?: Date;
  minLeaseTerm?: number; // months
  locations: string[]; // preferred cities
  status: 'active' | 'matched' | 'inactive';
  createdAt: Date;
  expiresAt?: Date;
  matches: RoommateMatch[];
}

/**
 * Roommate preferences
 */
export interface RoommatePreferences {
  ageRange?: { min: number; max: number };
  gender?: 'male' | 'female' | 'any';
  occupation?: string[];
  mustHave: string[]; // clean, quiet, organized, social, etc.
  dealBreakers: string[]; // smoking, pets, parties, etc.
  lifestyle: {
    cleanlinessLevel: 1 | 2 | 3 | 4 | 5; // 1 = messy, 5 = very clean
    socialLevel: 1 | 2 | 3 | 4 | 5; // 1 = private, 5 = very social
    noiseLevel: 1 | 2 | 3 | 4 | 5; // 1 = quiet, 5 = loud
  };
}

/**
 * Roommate match
 */
export interface RoommateMatch {
  matchId: string;
  requestId: string;
  userId1: string;
  userId2: string;
  compatibilityScore: number; // 0-100
  matchReasons: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  respondedAt?: Date;
}

/**
 * Group viewing
 */
export interface GroupViewing {
  id: string;
  propertyId: string;
  organizerId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: GroupViewingParticipant[];
  meetupLocation?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

/**
 * Group viewing participant
 */
export interface GroupViewingParticipant {
  userId: string;
  joinedAt: Date;
  status: 'pending' | 'confirmed' | 'declined';
  note?: string; // Why they're interested
}

/**
 * Shared wishlist (for couples, families, groups)
 */
export interface SharedWishlist {
  id: string;
  name: string;
  description?: string;
  members: WishlistMember[];
  properties: WishlistProperty[];
  votingEnabled: boolean;
  requiresUnanimous: boolean; // All must agree vs majority
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Wishlist member
 */
export interface WishlistMember {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  notificationsEnabled: boolean;
}

/**
 * Wishlist property
 */
export interface WishlistProperty {
  propertyId: string;
  addedBy: string;
  addedAt: Date;
  votes: PropertyVote[];
  comments: PropertyComment[];
  averageRating?: number;
  consensus?: 'love' | 'like' | 'neutral' | 'dislike' | 'no_consensus';
}

/**
 * Property vote
 */
export interface PropertyVote {
  userId: string;
  vote: 'love' | 'like' | 'neutral' | 'dislike';
  votedAt: Date;
  priority?: number; // 1-5 ranking
}

/**
 * Property comment
 */
export interface PropertyComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  replies?: PropertyComment[];
}

/**
 * Property review (community feedback)
 */
export interface PropertyReview {
  id: string;
  propertyId: string;
  userId: string;
  landlordId?: string;
  rating: number; // 1-5
  aspects: {
    location: number; // 1-5
    condition: number;
    landlordResponsiveness: number;
    valueForMoney: number;
    neighborhood: number;
  };
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  livingDuration?: number; // months lived there
  verified: boolean; // Verified former/current tenant
  helpful: number; // Helpful votes
  createdAt: Date;
  photos?: string[]; // URLs
}

/**
 * Neighborhood insights
 */
export interface CommunityNeighborhoodInsights {
  neighborhood: string;
  city: string;
  overallRating: number; // 1-5
  reviewCount: number;
  aspects: {
    safety: { rating: number; reviewCount: number };
    quietness: { rating: number; reviewCount: number };
    walkability: { rating: number; reviewCount: number };
    publicTransport: { rating: number; reviewCount: number };
    restaurants: { rating: number; reviewCount: number };
    shopping: { rating: number; reviewCount: number };
    parks: { rating: number; reviewCount: number };
    schools: { rating: number; reviewCount: number };
    nightlife: { rating: number; reviewCount: number };
  };
  tags: string[]; // family-friendly, hipster, quiet, busy, etc.
  popularWith: string[]; // families, young professionals, students, etc.
  priceLevel: 1 | 2 | 3 | 4 | 5; // 1 = cheap, 5 = expensive
  trendDirection: 'rising' | 'stable' | 'falling';
}

/**
 * Moving buddy request
 */
export interface MovingBuddyRequest {
  id: string;
  userId: string;
  moveDate: Date;
  fromLocation: string;
  toLocation: string;
  needsHelp: string[]; // packing, transport, furniture assembly, etc.
  canOfferHelp: string[];
  buddies: MovingBuddy[];
  status: 'active' | 'matched' | 'completed';
  createdAt: Date;
}

/**
 * Moving buddy
 */
export interface MovingBuddy {
  userId: string;
  helpOffered: string[];
  matchedAt: Date;
  status: 'pending' | 'accepted' | 'completed';
}

/**
 * Community Manager
 */
export class CommunityManager {
  private userProfiles: Map<string, CommunityUserProfile> = new Map();
  private roommateRequests: Map<string, RoommateRequest> = new Map();
  private groupViewings: Map<string, GroupViewing> = new Map();
  private sharedWishlists: Map<string, SharedWishlist> = new Map();
  private propertyReviews: Map<string, PropertyReview[]> = new Map(); // propertyId -> reviews
  private neighborhoodInsights: Map<string, NeighborhoodInsights> = new Map();
  private movingBuddies: Map<string, MovingBuddyRequest> = new Map();

  /**
   * Create or update user profile
   */
  public upsertUserProfile(profile: CommunityUserProfile): CommunityUserProfile {
    this.userProfiles.set(profile.userId, profile);
    return profile;
  }

  /**
   * Find roommates
   */
  public findRoommates(
    requestId: string,
    maxResults: number = 20
  ): RoommateMatch[] {
    const request = this.roommateRequests.get(requestId);
    if (request == null) return [];

    const requestingUser = this.userProfiles.get(request.userId);
    if (requestingUser == null) return [];

    const matches: RoommateMatch[] = [];

    // Find compatible users
    for (const [, otherRequest] of this.roommateRequests.entries()) {
      if (otherRequest.userId === request.userId) continue;
      if (otherRequest.status !== 'active') continue;

      const otherUser = this.userProfiles.get(otherRequest.userId);
      if (otherUser == null) continue;

      // Calculate compatibility
      const compatibility = this.calculateRoommateCompatibility(
        request,
        requestingUser,
        otherRequest,
        otherUser
      );

      if (compatibility.score >= 60) {
        // Minimum 60% compatibility
        matches.push({
          matchId: this.generateId('match'),
          requestId: request.id,
          userId1: request.userId,
          userId2: otherRequest.userId,
          compatibilityScore: compatibility.score,
          matchReasons: compatibility.reasons,
          status: 'pending',
          createdAt: new Date(),
        });
      }
    }

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return matches.slice(0, maxResults);
  }

  /**
   * Calculate roommate compatibility
   */
  private calculateRoommateCompatibility(
    request1: RoommateRequest,
    user1: CommunityUserProfile,
    request2: RoommateRequest,
    user2: CommunityUserProfile
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Budget compatibility (30%)
    const budgetOverlap = this.calculateBudgetOverlap(request1.budget, request2.budget);
    score += budgetOverlap * 30;
    if (budgetOverlap > 0.7) {
      reasons.push('Compatible budgets');
    }

    // Location overlap (20%)
    const locationOverlap = request1.locations.filter((loc) =>
      request2.locations.includes(loc)
    );
    const locationScore = Math.min(1, locationOverlap.length / Math.max(request1.locations.length, request2.locations.length));
    score += locationScore * 20;
    if (locationOverlap.length > 0) {
      reasons.push(`Both interested in ${locationOverlap[0]}`);
    }

    // Age compatibility (10%)
    if (user1.age != null && user2.age != null) {
      const ageDiff = Math.abs(user1.age - user2.age);
      const ageScore = Math.max(0, 1 - ageDiff / 20); // Perfect match within 0-10 years
      score += ageScore * 10;
      if (ageDiff <= 5) {
        reasons.push('Similar age');
      }
    }

    // Lifestyle compatibility (25%)
    if (user1.lifestyle != null && user2.lifestyle != null) {
      let lifestyleScore = 0;
      let matches = 0;

      if (user1.lifestyle.smoker === user2.lifestyle.smoker) {
        lifestyleScore += 0.2;
        matches++;
      }
      if (user1.lifestyle.pets === user2.lifestyle.pets) {
        lifestyleScore += 0.2;
        matches++;
      }
      if (user1.lifestyle.nightOwl === user2.lifestyle.nightOwl) {
        lifestyleScore += 0.15;
        if (user1.lifestyle.nightOwl) {
          reasons.push('Both night owls');
        }
      }
      if (user1.lifestyle.organized === user2.lifestyle.organized) {
        lifestyleScore += 0.25;
        if (user1.lifestyle.organized) {
          reasons.push('Both organized');
        }
      }
      if (user1.lifestyle.social === user2.lifestyle.social) {
        lifestyleScore += 0.2;
        if (user1.lifestyle.social) {
          reasons.push('Both social');
        }
      }

      score += (lifestyleScore / 1) * 25;
    }

    // Common interests (15%)
    if (user1.interests != null && user2.interests != null) {
      const commonInterests = user1.interests.filter((i) =>
        user2.interests?.includes(i)
      );
      const interestScore = Math.min(1, commonInterests.length / 3); // Perfect match at 3+ common interests
      score += interestScore * 15;
      if (commonInterests.length > 0) {
        reasons.push(`Shared interests: ${commonInterests.slice(0, 2).join(', ')}`);
      }
    }

    return { score: Math.round(score), reasons };
  }

  /**
   * Calculate budget overlap
   */
  private calculateBudgetOverlap(
    budget1: RoommateRequest['budget'],
    budget2: RoommateRequest['budget']
  ): number {
    const overlap =
      Math.min(budget1.max, budget2.max) - Math.max(budget1.min, budget2.min);
    const totalRange =
      Math.max(budget1.max, budget2.max) - Math.min(budget1.min, budget2.min);

    return overlap > 0 ? overlap / totalRange : 0;
  }

  /**
   * Create group viewing
   */
  public createGroupViewing(viewing: Omit<GroupViewing, 'id' | 'createdAt'>): GroupViewing {
    const newViewing: GroupViewing = {
      ...viewing,
      id: this.generateId('viewing'),
      createdAt: new Date(),
    };

    this.groupViewings.set(newViewing.id, newViewing);
    return newViewing;
  }

  /**
   * Join group viewing
   */
  public joinGroupViewing(
    viewingId: string,
    userId: string,
    note?: string
  ): boolean {
    const viewing = this.groupViewings.get(viewingId);
    if (viewing == null) return false;

    if (viewing.currentParticipants.length >= viewing.maxParticipants) {
      return false; // Full
    }

    // Check if already joined
    if (viewing.currentParticipants.some((p) => p.userId === userId)) {
      return false;
    }

    viewing.currentParticipants.push({
      userId,
      joinedAt: new Date(),
      status: 'pending',
      note,
    });

    return true;
  }

  /**
   * Create shared wishlist
   */
  public createSharedWishlist(
    wishlist: Omit<SharedWishlist, 'id' | 'createdAt' | 'lastUpdated'>
  ): SharedWishlist {
    const newWishlist: SharedWishlist = {
      ...wishlist,
      id: this.generateId('wishlist'),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.sharedWishlists.set(newWishlist.id, newWishlist);
    return newWishlist;
  }

  /**
   * Add property to shared wishlist
   */
  public addToWishlist(
    wishlistId: string,
    propertyId: string,
    userId: string
  ): boolean {
    const wishlist = this.sharedWishlists.get(wishlistId);
    if (wishlist == null) return false;

    // Check if user is a member
    if (!wishlist.members.some((m) => m.userId === userId)) {
      return false;
    }

    // Check if already added
    if (wishlist.properties.some((p) => p.propertyId === propertyId)) {
      return false;
    }

    wishlist.properties.push({
      propertyId,
      addedBy: userId,
      addedAt: new Date(),
      votes: [],
      comments: [],
    });

    wishlist.lastUpdated = new Date();

    return true;
  }

  /**
   * Vote on wishlist property
   */
  public voteOnProperty(
    wishlistId: string,
    propertyId: string,
    userId: string,
    vote: PropertyVote['vote'],
    priority?: number
  ): boolean {
    const wishlist = this.sharedWishlists.get(wishlistId);
    if (wishlist == null) return false;

    const property = wishlist.properties.find((p) => p.propertyId === propertyId);
    if (property == null) return false;

    // Remove existing vote from this user
    property.votes = property.votes.filter((v) => v.userId !== userId);

    // Add new vote
    property.votes.push({
      userId,
      vote,
      votedAt: new Date(),
      priority,
    });

    // Update consensus
    property.consensus = this.calculateConsensus(property.votes);
    property.averageRating = this.calculateAverageRating(property.votes);

    wishlist.lastUpdated = new Date();

    return true;
  }

  /**
   * Calculate vote consensus
   */
  private calculateConsensus(votes: PropertyVote[]): PropertyVote['vote'] | 'no_consensus' {
    if (votes.length === 0) return 'no_consensus';

    const voteCounts = {
      love: votes.filter((v) => v.vote === 'love').length,
      like: votes.filter((v) => v.vote === 'like').length,
      neutral: votes.filter((v) => v.vote === 'neutral').length,
      dislike: votes.filter((v) => v.vote === 'dislike').length,
    };

    const majority = votes.length / 2;

    if (voteCounts.love > majority) return 'love';
    if (voteCounts.like > majority) return 'like';
    if (voteCounts.neutral > majority) return 'neutral';
    if (voteCounts.dislike > majority) return 'dislike';

    return 'no_consensus';
  }

  /**
   * Calculate average rating from votes
   */
  private calculateAverageRating(votes: PropertyVote[]): number {
    if (votes.length === 0) return 0;

    const voteValues = {
      love: 5,
      like: 4,
      neutral: 3,
      dislike: 1,
    };

    const sum = votes.reduce((acc, v) => acc + voteValues[v.vote], 0);
    return sum / votes.length;
  }

  /**
   * Add property review
   */
  public addPropertyReview(review: PropertyReview): PropertyReview {
    const reviews = this.propertyReviews.get(review.propertyId) ?? [];
    reviews.push(review);
    this.propertyReviews.set(review.propertyId, reviews);

    // Update neighborhood insights
    this.updateNeighborhoodInsights(review);

    return review;
  }

  /**
   * Get property reviews
   */
  public getPropertyReviews(propertyId: string): PropertyReview[] {
    return this.propertyReviews.get(propertyId) ?? [];
  }

  /**
   * Update neighborhood insights based on review
   */
  private updateNeighborhoodInsights(review: PropertyReview): void {
    // Extract neighborhood from property (simplified)
    const key = `${review.propertyId.split('-')[0]}`; // Placeholder

    const insights = this.neighborhoodInsights.get(key) ?? this.createEmptyInsights(key);

    // Update aspects
    insights.aspects.location.rating =
      (insights.aspects.location.rating * insights.aspects.location.reviewCount +
        review.aspects.location) /
      (insights.aspects.location.reviewCount + 1);
    insights.aspects.location.reviewCount++;

    insights.aspects.safety.rating =
      (insights.aspects.safety.rating * insights.aspects.safety.reviewCount + 4) /
      (insights.aspects.safety.reviewCount + 1); // Placeholder
    insights.aspects.safety.reviewCount++;

    insights.reviewCount++;
    insights.overallRating = review.rating; // Simplified

    this.neighborhoodInsights.set(key, insights);
  }

  /**
   * Create empty neighborhood insights
   */
  private createEmptyInsights(neighborhood: string): CommunityNeighborhoodInsights {
    return {
      neighborhood,
      city: 'Unknown',
      overallRating: 0,
      reviewCount: 0,
      aspects: {
        safety: { rating: 0, reviewCount: 0 },
        quietness: { rating: 0, reviewCount: 0 },
        walkability: { rating: 0, reviewCount: 0 },
        publicTransport: { rating: 0, reviewCount: 0 },
        restaurants: { rating: 0, reviewCount: 0 },
        shopping: { rating: 0, reviewCount: 0 },
        parks: { rating: 0, reviewCount: 0 },
        schools: { rating: 0, reviewCount: 0 },
        nightlife: { rating: 0, reviewCount: 0 },
      },
      tags: [],
      popularWith: [],
      priceLevel: 3,
      trendDirection: 'stable',
    };
  }

  /**
   * Create moving buddy request
   */
  public createMovingBuddyRequest(
    request: Omit<MovingBuddyRequest, 'id' | 'buddies' | 'status' | 'createdAt'>
  ): MovingBuddyRequest {
    const newRequest: MovingBuddyRequest = {
      ...request,
      id: this.generateId('moving'),
      buddies: [],
      status: 'active',
      createdAt: new Date(),
    };

    this.movingBuddies.set(newRequest.id, newRequest);
    return newRequest;
  }

  /**
   * Find moving buddies
   */
  public findMovingBuddies(
    requestId: string
  ): Array<{ userId: string; matchScore: number; helpOffered: string[] }> {
    const request = this.movingBuddies.get(requestId);
    if (request == null) return [];

    const matches: Array<{ userId: string; matchScore: number; helpOffered: string[] }> =
      [];

    for (const [, otherRequest] of this.movingBuddies.entries()) {
      if (otherRequest.id === requestId) continue;
      if (otherRequest.status !== 'active') continue;

      // Check location match
      if (
        otherRequest.fromLocation !== request.toLocation &&
        otherRequest.toLocation !== request.fromLocation
      ) {
        continue; // Not in same area
      }

      // Check date proximity (within 2 weeks)
      const dateDiff = Math.abs(
        otherRequest.moveDate.getTime() - request.moveDate.getTime()
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

      if (daysDiff > 14) continue;

      // Calculate match score
      const helpOverlap = otherRequest.canOfferHelp.filter((help) =>
        request.needsHelp.includes(help)
      );

      const matchScore = (helpOverlap.length / request.needsHelp.length) * 100;

      if (matchScore > 30) {
        matches.push({
          userId: otherRequest.userId,
          matchScore,
          helpOffered: helpOverlap,
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get user statistics
   */
  public getUserStats(userId: string): {
    roommateRequests: number;
    groupViewingsOrganized: number;
    groupViewingsJoined: number;
    sharedWishlistsCreated: number;
    sharedWishlistsJoined: number;
    reviewsWritten: number;
    helpfulReviews: number;
  } {
    return {
      roommateRequests: Array.from(this.roommateRequests.values()).filter(
        (r) => r.userId === userId
      ).length,
      groupViewingsOrganized: Array.from(this.groupViewings.values()).filter(
        (v) => v.organizerId === userId
      ).length,
      groupViewingsJoined: Array.from(this.groupViewings.values()).filter((v) =>
        v.currentParticipants.some((p) => p.userId === userId)
      ).length,
      sharedWishlistsCreated: Array.from(this.sharedWishlists.values()).filter(
        (w) => w.createdBy === userId
      ).length,
      sharedWishlistsJoined: Array.from(this.sharedWishlists.values()).filter((w) =>
        w.members.some((m) => m.userId === userId)
      ).length,
      reviewsWritten: Array.from(this.propertyReviews.values())
        .flat()
        .filter((r) => r.userId === userId).length,
      helpfulReviews: Array.from(this.propertyReviews.values())
        .flat()
        .filter((r) => r.userId === userId)
        .reduce((sum, r) => sum + r.helpful, 0),
    };
  }
}
