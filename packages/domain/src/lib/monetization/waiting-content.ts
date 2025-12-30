import { z } from 'zod';

/**
 * Waiting Content Type
 * Fun and educational content while users search for their dream home
 */
export enum WaitingContentType {
  /** Language lessons for the target location */
  LANGUAGE_LESSON = 'language_lesson',
  /** Local traditions and culture */
  CULTURAL_INSIGHT = 'cultural_insight',
  /** Local cuisine and recipes */
  FOOD_CULTURE = 'food_culture',
  /** Neighborhood hidden gems */
  LOCAL_TIPS = 'local_tips',
  /** Moving checklist items */
  MOVING_TIP = 'moving_tip',
  /** Interior design inspiration */
  DESIGN_INSPIRATION = 'design_inspiration',
  /** Home maintenance tips */
  HOME_MAINTENANCE = 'home_maintenance',
  /** Local events and festivals */
  LOCAL_EVENTS = 'local_events',
}

/**
 * Content Difficulty Level
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/**
 * Language Lesson Schema
 */
export const LanguageLessonSchema = z.object({
  id: z.string(),
  language: z.string(), // e.g., "German", "Spanish"
  title: z.string(),
  difficulty: z.nativeEnum(DifficultyLevel),

  // Lesson content
  vocabulary: z.array(z.object({
    word: z.string(),
    translation: z.string(),
    pronunciation: z.string().optional(),
    audioUrl: z.string().url().optional(),
  })),

  phrases: z.array(z.object({
    phrase: z.string(),
    translation: z.string(),
    context: z.string(), // When to use it
    audioUrl: z.string().url().optional(),
  })),

  // Practical scenarios
  scenario: z.string(), // e.g., "At the real estate office", "Talking to neighbors"
  tips: z.array(z.string()),

  // Gamification
  points: z.number().int().positive().default(10),
  quiz: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number().int(),
    explanation: z.string().optional(),
  })).optional(),

  estimatedMinutes: z.number().int().positive(),
  createdAt: z.date(),
});

export type LanguageLesson = z.infer<typeof LanguageLessonSchema>;

/**
 * Cultural Insight Schema
 */
export const CulturalInsightSchema = z.object({
  id: z.string(),
  country: z.string(),
  city: z.string().optional(),
  title: z.string(),
  category: z.enum([
    'etiquette',
    'holidays',
    'traditions',
    'social_norms',
    'business_culture',
    'daily_life',
  ]),

  // Content
  description: z.string(),
  dosList: z.array(z.string()), // Things to do
  dontsList: z.array(z.string()), // Things to avoid
  funFacts: z.array(z.string()),

  // Media
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),

  // Engagement
  relatedInsights: z.array(z.string()), // Related insight IDs
  userRating: z.number().min(0).max(5).optional(),
  estimatedMinutes: z.number().int().positive(),

  createdAt: z.date(),
});

export type CulturalInsight = z.infer<typeof CulturalInsightSchema>;

/**
 * Food Culture Schema
 */
export const FoodCultureSchema = z.object({
  id: z.string(),
  country: z.string(),
  city: z.string().optional(),
  dishName: z.string(),

  // Recipe
  description: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    localName: z.string().optional(),
  })),
  instructions: z.array(z.string()),

  // Cultural context
  culturalSignificance: z.string(),
  whenToEat: z.string(), // Breakfast, lunch, dinner, special occasions
  whereToFind: z.array(z.string()), // Restaurant names or neighborhoods

  // Media
  imageUrl: z.string().url(),
  videoUrl: z.string().url().optional(),

  // Metadata
  prepTime: z.number().int().positive(), // minutes
  difficulty: z.nativeEnum(DifficultyLevel),
  servings: z.number().int().positive(),

  // Diet tags
  tags: z.array(z.enum([
    'vegetarian',
    'vegan',
    'gluten_free',
    'dairy_free',
    'traditional',
    'street_food',
    'holiday_special',
  ])),

  createdAt: z.date(),
});

export type FoodCulture = z.infer<typeof FoodCultureSchema>;

/**
 * Local Tips Schema
 */
export const LocalTipsSchema = z.object({
  id: z.string(),
  city: z.string(),
  neighborhood: z.string().optional(),
  title: z.string(),

  category: z.enum([
    'hidden_gems',
    'best_coffee',
    'parks_recreation',
    'shopping',
    'nightlife',
    'family_activities',
    'workspaces',
    'transportation',
  ]),

  // Content
  description: z.string(),
  location: z.object({
    name: z.string(),
    address: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),

  // Practical info
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  bestTime: z.string().optional(), // "Early morning", "Weekday afternoons"
  localTip: z.string(), // Insider tip

  // Media
  imageUrl: z.string().url().optional(),
  mapUrl: z.string().url().optional(),

  // Engagement
  upvotes: z.number().int().min(0).default(0),
  contributedBy: z.enum(['local', 'resident', 'team']),

  createdAt: z.date(),
});

export type LocalTips = z.infer<typeof LocalTipsSchema>;

/**
 * Moving Checklist Item Schema
 */
export const MovingChecklistSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),

  category: z.enum([
    'before_move',
    'during_move',
    'after_move',
    'utilities',
    'paperwork',
    'packing',
  ]),

  // Timeline
  recommendedWeeksBefore: z.number().int().min(-4).max(12), // Negative for after move
  priority: z.enum(['low', 'medium', 'high', 'critical']),

  // Actionable
  actionItems: z.array(z.string()),
  estimatedTime: z.string(), // "30 minutes", "2 hours"
  costEstimate: z.string().optional(), // "$0-50", "$100-200"

  // Tips
  proTips: z.array(z.string()),
  commonMistakes: z.array(z.string()),

  // Resources
  resourceLinks: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
  })).optional(),

  createdAt: z.date(),
});

export type MovingChecklist = z.infer<typeof MovingChecklistSchema>;

/**
 * Design Inspiration Schema
 */
export const DesignInspirationSchema = z.object({
  id: z.string(),
  title: z.string(),
  style: z.enum([
    'modern',
    'traditional',
    'minimalist',
    'industrial',
    'scandinavian',
    'bohemian',
    'mid_century',
  ]),

  // Content
  description: z.string(),
  room: z.enum(['living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'outdoor']),

  // Budget
  budgetRange: z.enum(['budget_friendly', 'mid_range', 'luxury']),
  estimatedCost: z.string().optional(),

  // Items featured
  items: z.array(z.object({
    name: z.string(),
    description: z.string(),
    estimatedPrice: z.string().optional(),
    whereToBy: z.string().optional(),
  })),

  // Media
  images: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
  })),

  // DIY
  diyTips: z.array(z.string()).optional(),
  shoppingList: z.array(z.string()).optional(),

  // Engagement
  saves: z.number().int().min(0).default(0),
  tags: z.array(z.string()),

  createdAt: z.date(),
});

export type DesignInspiration = z.infer<typeof DesignInspirationSchema>;

/**
 * User Progress Tracking
 */
export const WaitingContentProgressSchema = z.object({
  userId: z.string(),

  // Language learning
  languagePoints: z.number().int().min(0).default(0),
  lessonsCompleted: z.array(z.string()), // Lesson IDs
  currentStreak: z.number().int().min(0).default(0), // Days
  longestStreak: z.number().int().min(0).default(0),

  // Content engagement
  articlesRead: z.array(z.string()),
  recipiesTried: z.array(z.string()),
  tipsBookmarked: z.array(z.string()),
  designsSaved: z.array(z.string()),

  // Moving checklist
  checklistItems: z.array(z.object({
    itemId: z.string(),
    completed: z.boolean(),
    completedAt: z.date().optional(),
  })),

  // Gamification
  totalPoints: z.number().int().min(0).default(0),
  badges: z.array(z.object({
    id: z.string(),
    earnedAt: z.date(),
  })),

  // Preferences
  favoriteContentTypes: z.array(z.nativeEnum(WaitingContentType)),
  preferredLanguage: z.string().optional(),

  lastActive: z.date(),
  createdAt: z.date(),
});

export type WaitingContentProgress = z.infer<typeof WaitingContentProgressSchema>;

/**
 * Achievement Badges
 */
export const ACHIEVEMENT_BADGES = {
  POLYGLOT: {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Complete 10 language lessons',
    icon: '🌍',
    points: 100,
  },
  CULTURAL_EXPLORER: {
    id: 'cultural_explorer',
    name: 'Cultural Explorer',
    description: 'Read 20 cultural insights',
    icon: '🎭',
    points: 75,
  },
  HOME_CHEF: {
    id: 'home_chef',
    name: 'Home Chef',
    description: 'Try 5 local recipes',
    icon: '👨‍🍳',
    points: 50,
  },
  LOCAL_EXPERT: {
    id: 'local_expert',
    name: 'Local Expert',
    description: 'Bookmark 15 local tips',
    icon: '🗺️',
    points: 60,
  },
  MOVE_READY: {
    id: 'move_ready',
    name: 'Move Ready',
    description: 'Complete entire moving checklist',
    icon: '📦',
    points: 150,
  },
  DESIGN_GURU: {
    id: 'design_guru',
    name: 'Design Guru',
    description: 'Save 10 design inspirations',
    icon: '🎨',
    points: 40,
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain 7-day learning streak',
    icon: '🔥',
    points: 100,
  },
};
