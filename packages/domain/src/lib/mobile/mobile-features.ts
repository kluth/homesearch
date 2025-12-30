import { z } from 'zod';

/**
 * Mobile-Specific Features
 */

/**
 * Augmented Reality (AR) Property Viewing
 */
export const ARSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),

  // Session details
  sessionType: z.enum([
    'furniture_placement', // Place virtual furniture in empty rooms
    'renovation_preview', // Preview renovations/changes
    'measurement', // Measure rooms and spaces
    'property_info_overlay', // See property info overlaid on camera view
    'neighborhood_discovery', // Point camera to see nearby properties
  ]),

  // AR data
  placements: z.array(z.object({
    id: z.string(),
    objectType: z.string(), // 'sofa', 'bed', 'table', etc.
    modelUrl: z.string().url(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    rotation: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    scale: z.number(),
  })).optional(),

  // Measurements
  measurements: z.array(z.object({
    id: z.string(),
    room: z.string().optional(),
    type: z.enum(['length', 'width', 'height', 'area', 'volume']),
    value: z.number(),
    unit: z.enum(['ft', 'm', 'sqft', 'sqm']),
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })),
  })).optional(),

  // Screenshots
  screenshots: z.array(z.object({
    url: z.string().url(),
    timestamp: z.date(),
  })).optional(),

  // Session duration
  duration: z.number(), // seconds

  startedAt: z.date(),
  endedAt: z.date().optional(),
});

export type ARSession = z.infer<typeof ARSessionSchema>;

/**
 * Geolocation-Based Property Discovery
 */
export const GeoLocationSearchSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // User's current location
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(), // meters
  }),

  // Search radius
  radius: z.number().default(5), // km

  // Search filters
  filters: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    propertyTypes: z.array(z.string()).optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    features: z.array(z.string()).optional(),
  }).optional(),

  // Results
  propertiesFound: z.number(),
  properties: z.array(z.object({
    propertyId: z.string(),
    distance: z.number(), // km
    bearing: z.number(), // degrees from north
    thumbnail: z.string().url().optional(),
  })),

  timestamp: z.date(),
});

export type GeoLocationSearch = z.infer<typeof GeoLocationSearchSchema>;

/**
 * Offline Mode Data
 */
export const OfflineDataSyncSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),

  // Synced data
  syncedCollections: z.array(z.object({
    collection: z.enum([
      'favorites',
      'saved_searches',
      'properties',
      'messages',
      'appointments',
      'documents',
    ]),
    documentIds: z.array(z.string()),
    lastSyncedAt: z.date(),
  })),

  // Pending changes (to upload when online)
  pendingChanges: z.array(z.object({
    id: z.string(),
    collection: z.string(),
    documentId: z.string(),
    operation: z.enum(['create', 'update', 'delete']),
    data: z.record(z.unknown()),
    timestamp: z.date(),
  })),

  // Storage info
  totalSize: z.number(), // bytes
  maxSize: z.number().default(100 * 1024 * 1024), // 100MB default

  lastSyncedAt: z.date(),
  nextSyncAt: z.date().optional(),
});

export type OfflineDataSync = z.infer<typeof OfflineDataSyncSchema>;

/**
 * Push Notifications
 */
export enum NotificationType {
  NEW_MATCH = 'new_match',
  PRICE_DROP = 'price_drop',
  OPEN_HOUSE = 'open_house',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  MESSAGE_RECEIVED = 'message_received',
  OFFER_UPDATE = 'offer_update',
  DOCUMENT_SIGNED = 'document_signed',
  MARKET_ALERT = 'market_alert',
  COMMUNITY_POST = 'community_post',
  ACHIEVEMENT = 'achievement',
}

export const PushNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(NotificationType),

  // Notification content
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().url().optional(),

  // Action
  action: z.object({
    type: z.enum(['open_app', 'open_url', 'open_property', 'open_chat', 'open_appointment']),
    url: z.string().optional(),
    propertyId: z.string().optional(),
    conversationId: z.string().optional(),
    appointmentId: z.string().optional(),
  }).optional(),

  // Delivery
  devices: z.array(z.object({
    deviceId: z.string(),
    deviceToken: z.string(),
    platform: z.enum(['ios', 'android', 'web']),
    deliveredAt: z.date().optional(),
    clickedAt: z.date().optional(),
    error: z.string().optional(),
  })),

  // Scheduling
  scheduledFor: z.date().optional(),
  sentAt: z.date().optional(),
  expiresAt: z.date().optional(),

  // Badge count
  badge: z.number().optional(),

  // Sound
  sound: z.string().optional(),

  // Priority
  priority: z.enum(['normal', 'high']).default('normal'),

  createdAt: z.date(),
});

export type PushNotification = z.infer<typeof PushNotificationSchema>;

/**
 * Device Registration
 */
export const DeviceRegistrationSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Device info
  deviceId: z.string().uuid(),
  deviceToken: z.string(), // FCM/APNS token
  platform: z.enum(['ios', 'android', 'web']),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),

  // Device details
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  timezone: z.string().default('America/New_York'),
  locale: z.string().default('en-US'),

  // Status
  active: z.boolean().default(true),
  lastActiveAt: z.date(),

  // Notification settings (device-specific)
  notificationsEnabled: z.boolean().default(true),

  registeredAt: z.date(),
  updatedAt: z.date(),
});

export type DeviceRegistration = z.infer<typeof DeviceRegistrationSchema>;

/**
 * Quick Actions / Shortcuts
 */
export const QuickActionSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Action definition
  type: z.enum([
    'search_nearby',
    'view_favorites',
    'scan_property', // Using camera
    'check_commute',
    'call_agent',
    'virtual_tour',
    'schedule_showing',
  ]),

  label: z.string(),
  icon: z.string(),

  // Action data
  data: z.record(z.unknown()).optional(),

  // Usage stats
  usageCount: z.number().default(0),
  lastUsedAt: z.date().optional(),

  // Position
  order: z.number(),
  pinned: z.boolean().default(false),

  createdAt: z.date(),
});

export type QuickAction = z.infer<typeof QuickActionSchema>;

/**
 * Voice Search & Commands
 */
export const VoiceCommandSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Audio
  audioUrl: z.string().url().optional(),
  duration: z.number().optional(), // seconds

  // Transcription
  transcription: z.string(),
  language: z.string().default('en-US'),
  confidence: z.number().min(0).max(1).optional(),

  // Intent recognition
  intent: z.object({
    action: z.enum([
      'search_properties',
      'filter_results',
      'navigate_to_property',
      'schedule_appointment',
      'call_agent',
      'ask_question',
      'calculate_mortgage',
      'compare_properties',
      'unknown',
    ]),
    entities: z.record(z.unknown()).optional(), // Extracted entities (price, location, etc.)
    confidence: z.number().min(0).max(1).optional(),
  }),

  // Execution
  executed: z.boolean().default(false),
  executionResult: z.string().optional(),

  timestamp: z.date(),
});

export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;

/**
 * Photo Recognition & Analysis
 */
export const PhotoAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string().optional(),

  // Image
  imageUrl: z.string().url(),
  imageSource: z.enum(['camera', 'gallery', 'url']),

  // Recognition results
  detectedFeatures: z.array(z.object({
    type: z.enum([
      'kitchen',
      'bathroom',
      'bedroom',
      'living_room',
      'pool',
      'garage',
      'fireplace',
      'hardwood_floors',
      'granite_countertops',
      'stainless_appliances',
      'crown_molding',
      'vaulted_ceiling',
    ]),
    confidence: z.number().min(0).max(1),
    boundingBox: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
  })),

  // Style classification
  style: z.object({
    primary: z.enum([
      'modern',
      'contemporary',
      'traditional',
      'farmhouse',
      'craftsman',
      'colonial',
      'victorian',
      'mid_century',
      'industrial',
      'mediterranean',
    ]).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }).optional(),

  // Condition assessment
  condition: z.object({
    overall: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
    factors: z.array(z.object({
      aspect: z.string(),
      assessment: z.string(),
    })).optional(),
  }).optional(),

  // Similar properties
  similarProperties: z.array(z.object({
    propertyId: z.string(),
    similarity: z.number().min(0).max(1),
  })).optional(),

  processedAt: z.date(),
  createdAt: z.date(),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

/**
 * Biometric Authentication
 */
export const BiometricAuthSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),

  // Biometric type
  type: z.enum(['fingerprint', 'face_id', 'iris', 'voice']),

  // Settings
  enabled: z.boolean().default(false),
  requiredFor: z.array(z.enum([
    'app_access',
    'payment',
    'document_signing',
    'sensitive_data',
  ])),

  // Security
  lastUsedAt: z.date().optional(),
  failedAttempts: z.number().default(0),
  lockedUntil: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BiometricAuth = z.infer<typeof BiometricAuthSchema>;

/**
 * App Widget Data
 */
export const WidgetDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),

  // Widget configuration
  widgetType: z.enum([
    'favorite_properties',
    'saved_searches',
    'upcoming_appointments',
    'market_snapshot',
    'price_alerts',
    'quick_search',
  ]),

  size: z.enum(['small', 'medium', 'large']),

  // Widget-specific data
  data: z.record(z.unknown()),

  // Update frequency
  refreshInterval: z.number().default(30), // minutes
  lastRefreshedAt: z.date(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WidgetData = z.infer<typeof WidgetDataSchema>;

/**
 * Location-Based Reminders
 */
export const LocationReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Location
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().default(100), // meters
    address: z.string().optional(),
  }),

  // Trigger
  trigger: z.enum(['entering', 'exiting', 'dwelling']),
  dwellTime: z.number().optional(), // seconds (for 'dwelling' trigger)

  // Reminder
  title: z.string(),
  message: z.string(),
  propertyId: z.string().optional(),

  // Status
  active: z.boolean().default(true),
  triggeredCount: z.number().default(0),
  lastTriggeredAt: z.date().optional(),

  // Expiration
  expiresAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LocationReminder = z.infer<typeof LocationReminderSchema>;
