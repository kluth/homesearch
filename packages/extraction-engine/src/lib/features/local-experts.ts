/**
 * Local Experts & Community Q&A System
 * Connect users with verified local residents and property experts
 */

/**
 * Local expert profile
 */
export interface LocalExpert {
  userId: string;
  expertType: ExpertType[];
  areas: ExpertArea[];
  verificationLevel: ExpertVerificationLevel;
  credentials?: string[];
  yearsOfExperience?: number;
  specialties: string[];
  languages: string[];
  rating: number; // 1-5
  totalReviews: number;
  questionsAnswered: number;
  helpfulAnswers: number;
  responseTime: number; // average hours
  bio: string;
  availability: ExpertAvailability;
  pricing?: ExpertPricing;
  joinedAt: Date;
  lastActive: Date;
}

export enum ExpertType {
  LOCAL_RESIDENT = 'local_resident', // Lives in the area
  REAL_ESTATE_AGENT = 'real_estate_agent',
  PROPERTY_MANAGER = 'property_manager',
  LAWYER = 'lawyer', // Tenant rights, contracts
  INSPECTOR = 'inspector', // Property inspection
  MOVING_SPECIALIST = 'moving_specialist',
  INTERIOR_DESIGNER = 'interior_designer',
  CONTRACTOR = 'contractor', // Renovations
}

export interface ExpertArea {
  city: string;
  neighborhoods?: string[];
  radius?: number; // km
}

export enum ExpertVerificationLevel {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  RESIDENT_VERIFIED = 'resident_verified', // Proof of residence
  PROFESSIONAL_VERIFIED = 'professional_verified', // License/certification
  BACKGROUND_CHECKED = 'background_checked',
}

export interface ExpertAvailability {
  status: 'available' | 'busy' | 'away';
  schedule?: {
    monday?: TimeSlot[];
    tuesday?: TimeSlot[];
    wednesday?: TimeSlot[];
    thursday?: TimeSlot[];
    friday?: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
  timezone: string;
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface ExpertPricing {
  consultationType: 'free' | 'paid' | 'donation';
  hourlyRate?: number;
  consultationFee?: number;
  currency: string;
}

/**
 * Community question
 */
export interface CommunityQuestion {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: QuestionCategory;
  tags: string[];
  location?: {
    city?: string;
    neighborhood?: string;
  };
  propertyId?: string; // Related to specific property
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'answered' | 'resolved' | 'closed';
  answers: QuestionAnswer[];
  views: number;
  upvotes: number;
  createdAt: Date;
  lastActivityAt: Date;
  bestAnswerId?: string;
}

export enum QuestionCategory {
  NEIGHBORHOOD_INFO = 'neighborhood_info',
  PROPERTY_SPECIFIC = 'property_specific',
  LEGAL_RIGHTS = 'legal_rights',
  MOVING_TIPS = 'moving_tips',
  LANDLORD_ISSUES = 'landlord_issues',
  UTILITIES_SETUP = 'utilities_setup',
  COST_OF_LIVING = 'cost_of_living',
  COMMUTE_ADVICE = 'commute_advice',
  SCHOOL_INFO = 'school_info',
  SAFETY_CONCERNS = 'safety_concerns',
  GENERAL_ADVICE = 'general_advice',
}

/**
 * Question answer
 */
export interface QuestionAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  isExpert: boolean;
  expertType?: ExpertType;
  sources?: string[]; // URLs to supporting info
  upvotes: number;
  downvotes: number;
  verified: boolean; // Verified by moderators
  createdAt: Date;
  editedAt?: Date;
  comments: AnswerComment[];
}

/**
 * Answer comment
 */
export interface AnswerComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

/**
 * Expert consultation request
 */
export interface ConsultationRequest {
  id: string;
  userId: string;
  expertId: string;
  type: 'question' | 'viewing_assistance' | 'contract_review' | 'inspection' | 'moving_help';
  title: string;
  description: string;
  preferredDate?: Date;
  preferredTime?: string;
  duration?: number; // minutes
  location?: string;
  propertyId?: string;
  budget?: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  payment?: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded';
  };
}

/**
 * Expert review
 */
export interface ExpertReview {
  id: string;
  expertId: string;
  userId: string;
  consultationId: string;
  rating: number; // 1-5
  aspects: {
    knowledge: number;
    communication: number;
    timeliness: number;
    helpfulness: number;
  };
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  createdAt: Date;
}

/**
 * Neighborhood guide
 */
export interface NeighborhoodGuide {
  id: string;
  authorId: string;
  neighborhood: string;
  city: string;
  title: string;
  summary: string;
  content: string;
  sections: GuideSection[];
  photos?: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  views: number;
  helpful: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface GuideSection {
  title: string;
  content: string;
  order: number;
}

/**
 * Local Experts Manager
 */
export class LocalExpertsManager {
  private experts: Map<string, LocalExpert> = new Map();
  private questions: Map<string, CommunityQuestion> = new Map();
  private consultations: Map<string, ConsultationRequest> = new Map();
  private expertReviews: Map<string, ExpertReview[]> = new Map(); // expertId -> reviews
  private neighborhoodGuides: Map<string, NeighborhoodGuide[]> = new Map(); // city -> guides

  /**
   * Register as local expert
   */
  public registerExpert(expert: LocalExpert): LocalExpert {
    this.experts.set(expert.userId, expert);
    return expert;
  }

  /**
   * Find experts by criteria
   */
  public findExperts(criteria: {
    city?: string;
    neighborhood?: string;
    expertType?: ExpertType[];
    minRating?: number;
    languages?: string[];
    availability?: 'now' | 'today' | 'this_week';
  }): LocalExpert[] {
    let experts = Array.from(this.experts.values());

    // Filter by location
    if (criteria.city != null) {
      experts = experts.filter((e) =>
        e.areas.some(
          (area) =>
            area.city.toLowerCase() === criteria.city?.toLowerCase()
        )
      );
    }

    if (criteria.neighborhood != null) {
      experts = experts.filter((e) =>
        e.areas.some(
          (area) =>
            area.neighborhoods?.some(
              (n) => n.toLowerCase() === criteria.neighborhood?.toLowerCase()
            )
        )
      );
    }

    // Filter by expert type
    if (criteria.expertType != null && criteria.expertType.length > 0) {
      experts = experts.filter((e) =>
        criteria.expertType?.some((type) => e.expertType.includes(type))
      );
    }

    // Filter by rating
    if (criteria.minRating != null) {
      experts = experts.filter((e) => e.rating >= criteria.minRating!);
    }

    // Filter by languages
    if (criteria.languages != null && criteria.languages.length > 0) {
      experts = experts.filter((e) =>
        criteria.languages?.some((lang) => e.languages.includes(lang))
      );
    }

    // Filter by availability
    if (criteria.availability != null) {
      experts = experts.filter((e) => e.availability.status === 'available');
    }

    // Sort by rating and response time
    experts.sort((a, b) => {
      const scoreDiff = b.rating - a.rating;
      if (Math.abs(scoreDiff) > 0.5) return scoreDiff;
      return a.responseTime - b.responseTime; // Faster response time wins
    });

    return experts;
  }

  /**
   * Post a question
   */
  public postQuestion(
    question: Omit<CommunityQuestion, 'id' | 'answers' | 'views' | 'upvotes' | 'createdAt' | 'lastActivityAt' | 'status'>
  ): CommunityQuestion {
    const newQuestion: CommunityQuestion = {
      ...question,
      id: this.generateId('q'),
      answers: [],
      views: 0,
      upvotes: 0,
      status: 'open',
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.questions.set(newQuestion.id, newQuestion);

    // Notify relevant experts
    this.notifyExperts(newQuestion);

    return newQuestion;
  }

  /**
   * Answer a question
   */
  public answerQuestion(
    questionId: string,
    userId: string,
    content: string,
    sources?: string[]
  ): QuestionAnswer | null {
    const question = this.questions.get(questionId);
    if (question == null) return null;

    const expert = this.experts.get(userId);
    const isExpert = expert != null;

    const answer: QuestionAnswer = {
      id: this.generateId('a'),
      questionId,
      userId,
      content,
      isExpert,
      expertType: expert?.expertType[0],
      sources,
      upvotes: 0,
      downvotes: 0,
      verified: false,
      createdAt: new Date(),
      comments: [],
    };

    question.answers.push(answer);
    question.lastActivityAt = new Date();

    if (question.status === 'open') {
      question.status = 'answered';
    }

    return answer;
  }

  /**
   * Mark best answer
   */
  public markBestAnswer(questionId: string, answerId: string, userId: string): boolean {
    const question = this.questions.get(questionId);
    if (question == null) return false;

    // Only question author can mark best answer
    if (question.userId !== userId) return false;

    const answer = question.answers.find((a) => a.id === answerId);
    if (answer == null) return false;

    question.bestAnswerId = answerId;
    question.status = 'resolved';

    // Update expert stats
    if (answer.isExpert) {
      const expert = this.experts.get(answer.userId);
      if (expert != null) {
        expert.helpfulAnswers++;
      }
    }

    return true;
  }

  /**
   * Request consultation
   */
  public requestConsultation(
    request: Omit<ConsultationRequest, 'id' | 'status' | 'createdAt'>
  ): ConsultationRequest {
    const newRequest: ConsultationRequest = {
      ...request,
      id: this.generateId('consult'),
      status: 'pending',
      createdAt: new Date(),
    };

    this.consultations.set(newRequest.id, newRequest);

    // Notify expert
    this.notifyExpertOfConsultation(newRequest);

    return newRequest;
  }

  /**
   * Accept consultation
   */
  public acceptConsultation(
    consultationId: string,
    expertId: string,
    scheduledAt: Date
  ): boolean {
    const consultation = this.consultations.get(consultationId);
    if (consultation == null) return false;

    if (consultation.expertId !== expertId) return false;

    consultation.status = 'accepted';
    consultation.scheduledAt = scheduledAt;

    return true;
  }

  /**
   * Add expert review
   */
  public addExpertReview(review: ExpertReview): ExpertReview {
    const reviews = this.expertReviews.get(review.expertId) ?? [];
    reviews.push(review);
    this.expertReviews.set(review.expertId, reviews);

    // Update expert rating
    const expert = this.experts.get(review.expertId);
    if (expert != null) {
      const allReviews = this.expertReviews.get(review.expertId) ?? [];
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      expert.rating = avgRating;
      expert.totalReviews = allReviews.length;
    }

    return review;
  }

  /**
   * Create neighborhood guide
   */
  public createNeighborhoodGuide(
    guide: Omit<NeighborhoodGuide, 'id' | 'rating' | 'reviewCount' | 'views' | 'helpful' | 'lastUpdated' | 'createdAt'>
  ): NeighborhoodGuide {
    const newGuide: NeighborhoodGuide = {
      ...guide,
      id: this.generateId('guide'),
      rating: 0,
      reviewCount: 0,
      views: 0,
      helpful: 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    const guides = this.neighborhoodGuides.get(guide.city) ?? [];
    guides.push(newGuide);
    this.neighborhoodGuides.set(guide.city, guides);

    return newGuide;
  }

  /**
   * Get neighborhood guides
   */
  public getNeighborhoodGuides(city: string, neighborhood?: string): NeighborhoodGuide[] {
    const guides = this.neighborhoodGuides.get(city) ?? [];

    if (neighborhood != null) {
      return guides.filter((g) => g.neighborhood.toLowerCase() === neighborhood.toLowerCase());
    }

    return guides;
  }

  /**
   * Get trending questions
   */
  public getTrendingQuestions(limit: number = 10): CommunityQuestion[] {
    const questions = Array.from(this.questions.values());

    // Score based on recency and engagement
    const scored = questions.map((q) => {
      const hoursSinceCreated =
        (Date.now() - q.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - hoursSinceCreated);
      const engagementScore = q.upvotes * 5 + q.answers.length * 10 + q.views;

      return {
        question: q,
        score: recencyScore + engagementScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.question);
  }

  /**
   * Get unanswered questions
   */
  public getUnansweredQuestions(
    expertType?: ExpertType,
    city?: string
  ): CommunityQuestion[] {
    let questions = Array.from(this.questions.values()).filter(
      (q) => q.status === 'open' || (q.status === 'answered' && q.bestAnswerId == null)
    );

    // Filter by location
    if (city != null) {
      questions = questions.filter((q) => q.location?.city === city);
    }

    // Sort by urgency and date
    questions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return questions;
  }

  /**
   * Search questions
   */
  public searchQuestions(query: string, filters?: {
    category?: QuestionCategory;
    city?: string;
    status?: CommunityQuestion['status'];
  }): CommunityQuestion[] {
    const lowerQuery = query.toLowerCase();
    let questions = Array.from(this.questions.values());

    // Text search
    questions = questions.filter(
      (q) =>
        q.title.toLowerCase().includes(lowerQuery) ||
        q.content.toLowerCase().includes(lowerQuery) ||
        q.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );

    // Apply filters
    if (filters?.category != null) {
      questions = questions.filter((q) => q.category === filters.category);
    }

    if (filters?.city != null) {
      questions = questions.filter((q) => q.location?.city === filters.city);
    }

    if (filters?.status != null) {
      questions = questions.filter((q) => q.status === filters.status);
    }

    // Sort by relevance (views + upvotes)
    questions.sort((a, b) => {
      const scoreA = a.views + a.upvotes * 5;
      const scoreB = b.views + b.upvotes * 5;
      return scoreB - scoreA;
    });

    return questions;
  }

  /**
   * Notify experts of new question
   */
  private notifyExperts(question: CommunityQuestion): void {
    // Find relevant experts
    const relevantExperts = Array.from(this.experts.values()).filter((expert) => {
      // Match by location
      if (question.location?.city != null) {
        const hasLocation = expert.areas.some(
          (area) => area.city === question.location?.city
        );
        if (!hasLocation) return false;
      }

      // Match by category
      // (Simplified - in production, map categories to expert types)
      return expert.availability.status === 'available';
    });

    // In production, send notifications to these experts
    console.log(`Notifying ${relevantExperts.length} experts about new question: ${question.title}`);
  }

  /**
   * Notify expert of consultation request
   */
  private notifyExpertOfConsultation(request: ConsultationRequest): void {
    const expert = this.experts.get(request.expertId);
    if (expert != null) {
      console.log(`Notifying expert ${expert.userId} of consultation request: ${request.title}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get expert stats
   */
  public getExpertStats(expertId: string): {
    totalQuestions: number;
    totalConsultations: number;
    averageRating: number;
    totalReviews: number;
    helpfulAnswers: number;
    responseRate: number;
  } {
    const expert = this.experts.get(expertId);
    if (expert == null) {
      return {
        totalQuestions: 0,
        totalConsultations: 0,
        averageRating: 0,
        totalReviews: 0,
        helpfulAnswers: 0,
        responseRate: 0,
      };
    }

    const answered = Array.from(this.questions.values()).filter((q) =>
      q.answers.some((a) => a.userId === expertId)
    ).length;

    const consultations = Array.from(this.consultations.values()).filter(
      (c) => c.expertId === expertId && c.status === 'completed'
    ).length;

    const reviews = this.expertReviews.get(expertId) ?? [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      totalQuestions: answered,
      totalConsultations: consultations,
      averageRating: avgRating,
      totalReviews: reviews.length,
      helpfulAnswers: expert.helpfulAnswers,
      responseRate: expert.questionsAnswered > 0 ? (expert.helpfulAnswers / expert.questionsAnswered) * 100 : 0,
    };
  }
}
