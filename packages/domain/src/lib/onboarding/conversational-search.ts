import { z } from 'zod';

/**
 * Conversational Onboarding & Natural Language Search
 */

/**
 * Onboarding Conversation
 */
export enum ConversationStage {
  GREETING = 'greeting',
  INITIAL_QUERY = 'initial_query',
  CLARIFICATION = 'clarification',
  CONFIRMATION = 'confirmation',
  AGENT_CREATION = 'agent_creation',
  COMPLETED = 'completed',
}

export const OnboardingConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Conversation state
  stage: z.nativeEnum(ConversationStage),
  status: z.enum(['active', 'completed', 'abandoned']),

  // Messages
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.date(),

    // Parsed information (from user messages)
    extractedInfo: z.object({
      location: z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        neighborhood: z.string().optional(),
        zipCode: z.string().optional(),
      }).optional(),

      propertyType: z.array(z.string()).optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        currency: z.string().optional(),
      }).optional(),

      bedrooms: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        exact: z.number().optional(),
      }).optional(),

      bathrooms: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),

      features: z.array(z.string()).optional(),
      mustHave: z.array(z.string()).optional(),
      niceToHave: z.array(z.string()).optional(),
      dealBreakers: z.array(z.string()).optional(),

      timeline: z.object({
        urgency: z.enum(['urgent', 'soon', 'flexible', 'browsing']).optional(),
        moveInDate: z.date().optional(),
      }).optional(),

      lifestyle: z.array(z.enum([
        'family_friendly',
        'walkable',
        'nightlife',
        'quiet',
        'urban',
        'suburban',
        'rural',
        'near_transit',
        'good_schools',
        'pet_friendly',
        'work_from_home',
      ])).optional(),

      budget: z.object({
        monthlyPayment: z.number().optional(),
        downPayment: z.number().optional(),
        preApproved: z.boolean().optional(),
      }).optional(),

      workLocation: z.object({
        address: z.string().optional(),
        maxCommuteMinutes: z.number().optional(),
        transportMode: z.enum(['driving', 'transit', 'walking', 'bicycling']).optional(),
      }).optional(),
    }).optional(),

    // Generated questions (from assistant messages)
    questions: z.array(z.object({
      question: z.string(),
      type: z.enum(['location', 'price', 'features', 'lifestyle', 'timeline', 'confirmation']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })).optional(),

    // User intent
    intent: z.enum([
      'provide_info',
      'ask_question',
      'confirm',
      'change_criteria',
      'skip',
      'done',
    ]).optional(),

    confidence: z.number().min(0).max(1).optional(),
  })),

  // Accumulated context
  extractedContext: z.object({
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      neighborhood: z.string().optional(),
      zipCode: z.string().optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }).optional(),

    propertyPreferences: z.object({
      types: z.array(z.string()).optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      bedroomsMin: z.number().optional(),
      bedroomsMax: z.number().optional(),
      bathroomsMin: z.number().optional(),
      bathroomsMax: z.number().optional(),
      sqftMin: z.number().optional(),
      sqftMax: z.number().optional(),
    }).optional(),

    mustHaveFeatures: z.array(z.string()).optional(),
    niceToHaveFeatures: z.array(z.string()).optional(),
    dealBreakers: z.array(z.string()).optional(),

    lifestyle: z.array(z.string()).optional(),
    timeline: z.object({
      urgency: z.string().optional(),
      moveInDate: z.date().optional(),
    }).optional(),

    budget: z.object({
      monthlyPaymentMax: z.number().optional(),
      downPayment: z.number().optional(),
      preApproved: z.boolean().optional(),
    }).optional(),

    workCommute: z.object({
      address: z.string().optional(),
      maxMinutes: z.number().optional(),
      mode: z.string().optional(),
    }).optional(),

    // Confidence scores
    confidence: z.object({
      location: z.number().min(0).max(1).optional(),
      price: z.number().min(0).max(1).optional(),
      features: z.number().min(0).max(1).optional(),
      overall: z.number().min(0).max(1),
    }),
  }).optional(),

  // Missing information
  missingInfo: z.array(z.object({
    field: z.string(),
    importance: z.enum(['required', 'important', 'optional']),
    question: z.string(),
    asked: z.boolean().default(false),
  })).optional(),

  // Generated agents
  generatedAgents: z.array(z.object({
    agentId: z.string(),
    type: z.enum(['search', 'alert', 'recommendation']),
    createdAt: z.date(),
  })).optional(),

  // Personalization setup
  waitingContentConfigured: z.boolean().default(false),
  preferencesCreated: z.boolean().default(false),

  startedAt: z.date(),
  completedAt: z.date().optional(),
  lastMessageAt: z.date(),
});

export type OnboardingConversation = z.infer<typeof OnboardingConversationSchema>;

/**
 * Natural Language Query Parser
 */
export const NLQuerySchema = z.object({
  id: z.string(),
  userId: z.string(),
  conversationId: z.string().optional(),

  // Original query
  rawQuery: z.string(),
  language: z.string().default('en'),

  // Parsed components
  parsed: z.object({
    // Location extraction
    location: z.object({
      mentioned: z.boolean(),
      entities: z.array(z.object({
        text: z.string(),
        type: z.enum(['city', 'state', 'country', 'neighborhood', 'zipcode', 'landmark']),
        confidence: z.number().min(0).max(1),
        normalized: z.string().optional(),
      })).optional(),
    }).optional(),

    // Price extraction
    price: z.object({
      mentioned: z.boolean(),
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
    }).optional(),

    // Property type
    propertyType: z.object({
      mentioned: z.boolean(),
      types: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
    }).optional(),

    // Rooms
    bedrooms: z.object({
      mentioned: z.boolean(),
      min: z.number().optional(),
      max: z.number().optional(),
      exact: z.number().optional(),
      confidence: z.number().min(0).max(1).optional(),
    }).optional(),

    bathrooms: z.object({
      mentioned: z.boolean(),
      min: z.number().optional(),
      max: z.number().optional(),
      confidence: z.number().min(0).max(1).optional(),
    }).optional(),

    // Features and amenities
    features: z.object({
      mentioned: z.boolean(),
      mustHave: z.array(z.string()).optional(),
      preferred: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
    }).optional(),

    // Timeline
    timeline: z.object({
      mentioned: z.boolean(),
      urgency: z.enum(['urgent', 'soon', 'flexible', 'browsing']).optional(),
      moveInDate: z.date().optional(),
      keywords: z.array(z.string()).optional(), // "asap", "within 3 months", etc.
    }).optional(),

    // Lifestyle indicators
    lifestyle: z.object({
      mentioned: z.boolean(),
      indicators: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
    }).optional(),

    // Commute
    commute: z.object({
      mentioned: z.boolean(),
      workLocation: z.string().optional(),
      maxTime: z.number().optional(),
      mode: z.string().optional(),
    }).optional(),
  }),

  // Intent classification
  intent: z.object({
    primary: z.enum([
      'search_property',
      'provide_criteria',
      'ask_question',
      'modify_criteria',
      'confirm',
      'reject',
    ]),
    confidence: z.number().min(0).max(1),
    secondary: z.array(z.string()).optional(),
  }),

  // Entities extracted
  entities: z.array(z.object({
    text: z.string(),
    type: z.string(),
    value: z.unknown(),
    confidence: z.number().min(0).max(1),
    position: z.object({
      start: z.number(),
      end: z.number(),
    }),
  })).optional(),

  // Sentiment
  sentiment: z.object({
    score: z.number().min(-1).max(1), // -1 negative, 0 neutral, 1 positive
    label: z.enum(['negative', 'neutral', 'positive']),
    confidence: z.number().min(0).max(1),
  }).optional(),

  // Processing metadata
  processingTime: z.number().optional(), // milliseconds
  model: z.string().optional(),
  version: z.string().optional(),

  createdAt: z.date(),
});

export type NLQuery = z.infer<typeof NLQuerySchema>;

/**
 * Search Agent (Auto-created from conversation)
 */
export enum SearchAgentType {
  PRIMARY = 'primary', // Main search based on conversation
  ALTERNATIVE = 'alternative', // Slightly different criteria
  EXPANDED = 'expanded', // Broader criteria
  ASPIRATIONAL = 'aspirational', // Stretch goals
}

export const SearchAgentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  conversationId: z.string(),

  // Agent details
  name: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(SearchAgentType),

  // Search criteria (derived from conversation)
  criteria: z.object({
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      neighborhood: z.string().optional(),
      zipCode: z.string().optional(),
      radius: z.number().optional(), // km
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }),

    propertyTypes: z.array(z.string()),

    price: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default('USD'),
    }).optional(),

    bedrooms: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    bathrooms: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    sqft: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    features: z.object({
      required: z.array(z.string()).optional(),
      preferred: z.array(z.string()).optional(),
      excluded: z.array(z.string()).optional(),
    }).optional(),

    yearBuilt: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),

    lotSize: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      unit: z.enum(['sqft', 'acres']).optional(),
    }).optional(),
  }),

  // Scoring weights (what matters most to user)
  weights: z.object({
    price: z.number().min(0).max(10).default(8),
    location: z.number().min(0).max(10).default(9),
    size: z.number().min(0).max(10).default(6),
    features: z.number().min(0).max(10).default(7),
    condition: z.number().min(0).max(10).default(5),
    schools: z.number().min(0).max(10).default(5),
    commute: z.number().min(0).max(10).default(6),
  }),

  // Automated actions
  actions: z.object({
    autoAlert: z.boolean().default(true),
    alertFrequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
    autoSave: z.boolean().default(true),
    emailDigest: z.boolean().default(true),
  }),

  // Execution
  active: z.boolean().default(true),
  lastRun: z.date().optional(),
  nextRun: z.date().optional(),
  runFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),

  // Results
  totalMatches: z.number().default(0),
  newMatches: z.number().default(0),
  lastMatchAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SearchAgent = z.infer<typeof SearchAgentSchema>;

/**
 * Question Generation Engine
 */
export const GeneratedQuestionSchema = z.object({
  id: z.string(),
  conversationId: z.string(),

  // Question details
  question: z.string(),
  category: z.enum([
    'location',
    'price',
    'property_type',
    'size',
    'features',
    'lifestyle',
    'timeline',
    'budget',
    'commute',
    'confirmation',
  ]),

  // Context
  context: z.object({
    missingField: z.string(),
    currentKnowledge: z.record(z.unknown()).optional(),
    relatedInfo: z.array(z.string()).optional(),
  }),

  // Question type
  type: z.enum([
    'yes_no',
    'multiple_choice',
    'number_range',
    'free_text',
    'confirmation',
  ]),

  // Answer options (for multiple choice)
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),

  // Validation
  validation: z.object({
    required: z.boolean(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),

  // Importance
  importance: z.enum(['critical', 'important', 'nice_to_have']),
  priority: z.number().min(0).max(100),

  // State
  asked: z.boolean().default(false),
  askedAt: z.date().optional(),
  answered: z.boolean().default(false),
  answeredAt: z.date().optional(),
  answer: z.unknown().optional(),
  skipped: z.boolean().default(false),

  createdAt: z.date(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

/**
 * Conversation Context Aggregator
 */
export const ConversationContextSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),

  // Completeness tracking
  completeness: z.object({
    overall: z.number().min(0).max(100),
    byCategory: z.object({
      location: z.number().min(0).max(100),
      price: z.number().min(0).max(100),
      propertyType: z.number().min(0).max(100),
      size: z.number().min(0).max(100),
      features: z.number().min(0).max(100),
      lifestyle: z.number().min(0).max(100),
      timeline: z.number().min(0).max(100),
      budget: z.number().min(0).max(100),
    }),
  }),

  // Required vs optional
  required: z.object({
    collected: z.array(z.string()),
    missing: z.array(z.string()),
  }),

  optional: z.object({
    collected: z.array(z.string()),
    missing: z.array(z.string()),
  }),

  // Confidence in collected information
  confidence: z.object({
    location: z.number().min(0).max(1),
    price: z.number().min(0).max(1),
    features: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
  }),

  // Ready for agent creation
  readyForAgents: z.boolean(),
  readinessScore: z.number().min(0).max(100),

  // Suggested next questions
  suggestedQuestions: z.array(z.string()),

  updatedAt: z.date(),
});

export type ConversationContext = z.infer<typeof ConversationContextSchema>;

/**
 * Onboarding Template (for different user types)
 */
export const OnboardingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  // User type
  targetUserType: z.enum([
    'first_time_buyer',
    'experienced_buyer',
    'investor',
    'renter',
    'seller',
    'browsing',
  ]),

  // Question flow
  questionFlow: z.array(z.object({
    order: z.number(),
    category: z.string(),
    question: z.string(),
    type: z.string(),
    required: z.boolean(),
    condition: z.string().optional(), // When to ask this question
  })),

  // Initial greeting
  greeting: z.string(),

  // Suggested follow-ups
  followUps: z.array(z.string()),

  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OnboardingTemplate = z.infer<typeof OnboardingTemplateSchema>;

/**
 * Smart Suggestion (during conversation)
 */
export const SmartSuggestionSchema = z.object({
  id: z.string(),
  conversationId: z.string(),

  // Suggestion type
  type: z.enum([
    'location_refinement',
    'price_adjustment',
    'alternative_area',
    'feature_addition',
    'timeline_consideration',
    'budget_option',
  ]),

  // Suggestion content
  title: z.string(),
  description: z.string(),
  reason: z.string(),

  // Supporting data
  data: z.object({
    alternativeLocation: z.object({
      name: z.string(),
      averagePrice: z.number(),
      availableProperties: z.number(),
      commuteTime: z.number().optional(),
    }).optional(),

    priceAdjustment: z.object({
      suggested: z.number(),
      currentlyAvailable: z.number(),
      percentageIncrease: z.number(),
    }).optional(),

    similarAreas: z.array(z.object({
      name: z.string(),
      averagePrice: z.number(),
      matchScore: z.number(),
    })).optional(),
  }).optional(),

  // User interaction
  shown: z.boolean().default(false),
  shownAt: z.date().optional(),
  accepted: z.boolean().default(false),
  rejected: z.boolean().default(false),
  respondedAt: z.date().optional(),

  createdAt: z.date(),
});

export type SmartSuggestion = z.infer<typeof SmartSuggestionSchema>;
