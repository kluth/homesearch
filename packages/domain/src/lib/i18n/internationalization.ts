import { z } from 'zod';

/**
 * Internationalization & Accessibility Features
 */

/**
 * Supported Languages
 */
export enum SupportedLanguage {
  ENGLISH_US = 'en-US',
  ENGLISH_GB = 'en-GB',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  RUSSIAN = 'ru',
  ARABIC = 'ar',
  HINDI = 'hi',
  DUTCH = 'nl',
}

/**
 * Translation
 */
export const TranslationSchema = z.object({
  id: z.string(),
  key: z.string(), // Translation key: 'property.bedrooms.label'
  namespace: z.string(), // Grouping: 'property', 'navigation', 'errors'

  // Translations by language
  translations: z.record(z.string()), // locale -> translated text

  // Context
  description: z.string().optional(), // For translators
  context: z.string().optional(), // Additional context

  // Pluralization
  pluralRules: z.record(z.object({
    zero: z.string().optional(),
    one: z.string(),
    two: z.string().optional(),
    few: z.string().optional(),
    many: z.string().optional(),
    other: z.string(),
  })).optional(),

  // Variables
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    example: z.string().optional(),
  })).optional(),

  // Status
  status: z.enum(['draft', 'in_review', 'approved', 'published']),
  lastReviewedAt: z.date().optional(),

  // Metadata
  category: z.enum(['ui', 'content', 'email', 'notification', 'error']),
  tags: z.array(z.string()).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Translation = z.infer<typeof TranslationSchema>;

/**
 * Locale Configuration
 */
export const LocaleConfigSchema = z.object({
  id: z.string(),
  locale: z.nativeEnum(SupportedLanguage),

  // Display info
  name: z.string(), // "English (US)"
  nativeName: z.string(), // "English"
  flag: z.string().optional(), // Country flag emoji

  // Formatting
  dateFormat: z.string().default('MM/DD/YYYY'),
  timeFormat: z.string().default('h:mm A'),
  firstDayOfWeek: z.number().min(0).max(6).default(0), // 0 = Sunday
  currency: z.string().default('USD'),
  currencySymbol: z.string().default('$'),
  currencyPosition: z.enum(['before', 'after']).default('before'),
  decimalSeparator: z.string().default('.'),
  thousandsSeparator: z.string().default(','),

  // Text direction
  direction: z.enum(['ltr', 'rtl']).default('ltr'),

  // Number formatting
  numberFormat: z.object({
    decimals: z.number().default(2),
    grouping: z.boolean().default(true),
  }),

  // Status
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  completeness: z.number().min(0).max(100), // Translation completeness percentage

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;

/**
 * User Language Preferences
 */
export const UserLanguagePreferenceSchema = z.object({
  userId: z.string(),

  // Primary language
  preferredLanguage: z.nativeEnum(SupportedLanguage),

  // Secondary languages (fallback order)
  secondaryLanguages: z.array(z.nativeEnum(SupportedLanguage)).optional(),

  // Auto-detect
  autoDetect: z.boolean().default(true),

  // Content translation
  autoTranslateContent: z.boolean().default(false),
  translatePropertyDescriptions: z.boolean().default(false),

  updatedAt: z.date(),
});

export type UserLanguagePreference = z.infer<typeof UserLanguagePreferenceSchema>;

/**
 * Accessibility Settings
 */
export const AccessibilitySettingsSchema = z.object({
  userId: z.string(),

  // Visual
  visual: z.object({
    // High contrast
    highContrast: z.boolean().default(false),
    contrastLevel: z.enum(['normal', 'high', 'maximum']).default('normal'),

    // Font size
    fontSize: z.enum(['small', 'medium', 'large', 'x-large']).default('medium'),
    fontScaling: z.number().min(0.8).max(2.0).default(1.0),

    // Colors
    colorBlindMode: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']).default('none'),
    reduceMotion: z.boolean().default(false),
    reduceTransparency: z.boolean().default(false),

    // Focus
    focusIndicator: z.enum(['default', 'enhanced', 'high_visibility']).default('default'),
  }),

  // Auditory
  auditory: z.object({
    // Captions
    alwaysShowCaptions: z.boolean().default(false),
    captionSize: z.enum(['small', 'medium', 'large']).default('medium'),

    // Sound
    soundEffects: z.boolean().default(true),
    hapticFeedback: z.boolean().default(true),
  }),

  // Motor
  motor: z.object({
    // Keyboard
    keyboardNavigation: z.boolean().default(true),
    stickyKeys: z.boolean().default(false),

    // Mouse
    clickDelay: z.number().min(0).max(1000).default(0), // milliseconds
    doubleClickSpeed: z.enum(['slow', 'medium', 'fast']).default('medium'),

    // Touch
    touchAccommodations: z.boolean().default(false),
    touchDwellTime: z.number().min(0).max(2000).default(500), // milliseconds
  }),

  // Cognitive
  cognitive: z.object({
    // Reading
    simplifiedInterface: z.boolean().default(false),
    dislexiaFriendlyFont: z.boolean().default(false),
    readingGuide: z.boolean().default(false),

    // Focus
    reduceDistractions: z.boolean().default(false),
    hideNonEssentialElements: z.boolean().default(false),
  }),

  // Screen reader
  screenReader: z.object({
    enabled: z.boolean().default(false),
    announceNotifications: z.boolean().default(true),
    verbosity: z.enum(['minimal', 'moderate', 'detailed']).default('moderate'),
  }),

  updatedAt: z.date(),
});

export type AccessibilitySettings = z.infer<typeof AccessibilitySettingsSchema>;

/**
 * Content Translation Request
 */
export const ContentTranslationRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Content to translate
  contentType: z.enum(['property_description', 'review', 'forum_post', 'message']),
  contentId: z.string(),
  sourceText: z.string(),
  sourceLanguage: z.nativeEnum(SupportedLanguage),
  targetLanguage: z.nativeEnum(SupportedLanguage),

  // Translation
  translatedText: z.string().optional(),
  translationMethod: z.enum(['machine', 'human', 'hybrid']).optional(),
  confidence: z.number().min(0).max(1).optional(),

  // Status
  status: z.enum(['pending', 'translating', 'completed', 'failed']),
  error: z.string().optional(),

  // Cost tracking (if using paid translation API)
  characterCount: z.number(),
  cost: z.number().optional(),

  // Caching
  cacheKey: z.string(),
  cached: z.boolean().default(false),

  requestedAt: z.date(),
  completedAt: z.date().optional(),
});

export type ContentTranslationRequest = z.infer<typeof ContentTranslationRequestSchema>;

/**
 * RTL (Right-to-Left) Support
 */
export const RTLSettingSchema = z.object({
  locale: z.nativeEnum(SupportedLanguage),

  // RTL configuration
  direction: z.enum(['ltr', 'rtl']),

  // Layout adjustments
  mirrorLayout: z.boolean().default(true),
  flipIcons: z.boolean().default(true),

  // Text alignment
  defaultTextAlign: z.enum(['left', 'right', 'start', 'end']),

  // CSS overrides
  cssOverrides: z.record(z.string()).optional(),
});

export type RTLSetting = z.infer<typeof RTLSettingSchema>;

/**
 * Keyboard Shortcuts
 */
export const KeyboardShortcutSchema = z.object({
  id: z.string(),
  action: z.string(), // 'search', 'navigate_next', 'favorite', etc.
  category: z.enum(['navigation', 'actions', 'editor', 'accessibility']),

  // Shortcut keys
  keys: z.object({
    key: z.string(),
    modifiers: z.object({
      ctrl: z.boolean().default(false),
      alt: z.boolean().default(false),
      shift: z.boolean().default(false),
      meta: z.boolean().default(false), // Cmd on Mac, Win on Windows
    }),
  }),

  // Platform-specific
  platformOverrides: z.record(z.object({
    key: z.string(),
    modifiers: z.record(z.boolean()),
  })).optional(),

  // Customization
  customizable: z.boolean().default(true),
  userCustomized: z.boolean().default(false),

  // Display
  label: z.string(),
  description: z.string(),
  displaySequence: z.string(), // "Ctrl+K" or "⌘K"

  enabled: z.boolean().default(true),
});

export type KeyboardShortcut = z.infer<typeof KeyboardShortcutSchema>;

/**
 * WCAG Compliance Report
 */
export const WCAGComplianceReportSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  wcagLevel: z.enum(['A', 'AA', 'AAA']),

  // Compliance results
  passed: z.number(),
  failed: z.number(),
  warnings: z.number(),
  incomplete: z.number(),

  // Issues by category
  issues: z.array(z.object({
    id: z.string(),
    impact: z.enum(['minor', 'moderate', 'serious', 'critical']),
    category: z.string(),
    description: z.string(),
    wcagCriteria: z.string(), // e.g., "1.1.1"
    help: z.string(),
    helpUrl: z.string().url(),

    // Elements affected
    elements: z.array(z.object({
      target: z.string(), // CSS selector
      html: z.string(),
      failureSummary: z.string(),
    })).optional(),
  })),

  // Summary by principle
  byPrinciple: z.object({
    perceivable: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.number(),
    }),
    operable: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.number(),
    }),
    understandable: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.number(),
    }),
    robust: z.object({
      passed: z.number(),
      failed: z.number(),
      warnings: z.number(),
    }),
  }),

  // Overall score
  score: z.number().min(0).max(100),
  compliance: z.enum(['compliant', 'partial', 'non_compliant']),

  generatedAt: z.date(),
});

export type WCAGComplianceReport = z.infer<typeof WCAGComplianceReportSchema>;

/**
 * Text-to-Speech Settings
 */
export const TextToSpeechSettingsSchema = z.object({
  userId: z.string(),

  // Voice
  voice: z.object({
    voiceId: z.string(),
    name: z.string(),
    language: z.nativeEnum(SupportedLanguage),
    gender: z.enum(['male', 'female', 'neutral']).optional(),
  }),

  // Speech parameters
  rate: z.number().min(0.5).max(2.0).default(1.0), // Speaking rate
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  volume: z.number().min(0).max(1).default(0.8),

  // Reading preferences
  autoReadNotifications: z.boolean().default(false),
  autoReadMessages: z.boolean().default(false),
  highlightSpokenText: z.boolean().default(true),

  // Customization
  skipPunctuation: z.boolean().default(false),
  pauseBetweenParagraphs: z.number().default(500), // milliseconds

  updatedAt: z.date(),
});

export type TextToSpeechSettings = z.infer<typeof TextToSpeechSettingsSchema>;

/**
 * Translation Memory (for translators)
 */
export const TranslationMemorySchema = z.object({
  id: z.string(),

  // Source and target
  sourceText: z.string(),
  targetText: z.string(),
  sourceLanguage: z.nativeEnum(SupportedLanguage),
  targetLanguage: z.nativeEnum(SupportedLanguage),

  // Context
  domain: z.string().optional(), // 'real_estate', 'legal', 'marketing'
  context: z.string().optional(),

  // Quality
  quality: z.enum(['draft', 'reviewed', 'approved', 'professional']),
  translatedBy: z.string().optional(),
  reviewedBy: z.string().optional(),

  // Usage tracking
  usageCount: z.number().default(0),
  lastUsedAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TranslationMemory = z.infer<typeof TranslationMemorySchema>;
