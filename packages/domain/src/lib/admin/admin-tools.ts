import { z } from 'zod';

/**
 * Advanced Admin & Management Features
 */

/**
 * User Management
 */
export const UserManagementActionSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  targetUserId: z.string(),

  // Action type
  action: z.enum([
    'suspend',
    'unsuspend',
    'ban',
    'unban',
    'verify_email',
    'reset_password',
    'change_role',
    'delete_account',
    'merge_accounts',
    'impersonate',
  ]),

  // Action details
  reason: z.string(),
  duration: z.number().optional(), // For temporary suspensions (days)
  newRole: z.string().optional(),
  mergeIntoUserId: z.string().optional(),

  // Audit trail
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),

  // Reversal
  reversible: z.boolean().default(true),
  reversedAt: z.date().optional(),
  reversedBy: z.string().optional(),
});

export type UserManagementAction = z.infer<typeof UserManagementActionSchema>;

/**
 * Content Moderation
 */
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

export enum ModerationItemType {
  REVIEW = 'review',
  FORUM_POST = 'forum_post',
  FORUM_COMMENT = 'forum_comment',
  MESSAGE = 'message',
  PROPERTY_LISTING = 'property_listing',
  USER_PROFILE = 'user_profile',
  AGENT_PROFILE = 'agent_profile',
}

export const ModerationQueueItemSchema = z.object({
  id: z.string(),
  itemType: z.nativeEnum(ModerationItemType),
  itemId: z.string(),

  // Content
  content: z.string(),
  images: z.array(z.string().url()).optional(),
  authorId: z.string(),
  authorName: z.string(),

  // Flagging
  flaggedBy: z.array(z.object({
    userId: z.string(),
    reason: z.enum([
      'spam',
      'offensive',
      'inappropriate',
      'misleading',
      'copyright',
      'personal_info',
      'other',
    ]),
    details: z.string().optional(),
    flaggedAt: z.date(),
  })),

  // AI analysis
  aiModeration: z.object({
    toxicityScore: z.number().min(0).max(1).optional(),
    spamScore: z.number().min(0).max(1).optional(),
    suggestedAction: z.enum(['approve', 'review', 'reject']).optional(),
    detectedIssues: z.array(z.string()).optional(),
  }).optional(),

  // Moderation decision
  status: z.nativeEnum(ModerationStatus),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  moderatorNotes: z.string().optional(),
  action: z.enum(['approved', 'rejected', 'edited', 'removed', 'warned_user', 'banned_user']).optional(),

  // Priority
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  autoFlagged: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ModerationQueueItem = z.infer<typeof ModerationQueueItemSchema>;

/**
 * System Configuration
 */
export const SystemConfigSchema = z.object({
  id: z.string().default('system_config'),

  // Feature flags
  features: z.object({
    aiRecommendations: z.boolean().default(true),
    chatbot: z.boolean().default(true),
    virtualTours: z.boolean().default(true),
    messaging: z.boolean().default(true),
    forums: z.boolean().default(true),
    marketplace: z.boolean().default(false),
    referralProgram: z.boolean().default(true),
    arFeatures: z.boolean().default(true),
    voiceSearch: z.boolean().default(true),
  }),

  // Limits
  limits: z.object({
    // File uploads
    maxImageSize: z.number().default(10 * 1024 * 1024), // 10MB
    maxDocumentSize: z.number().default(50 * 1024 * 1024), // 50MB
    maxImagesPerProperty: z.number().default(50),
    maxVideoDuration: z.number().default(300), // 5 minutes

    // Rate limits
    apiCallsPerMinute: z.number().default(60),
    searchesPerHour: z.number().default(100),
    messagesPerHour: z.number().default(100),

    // Content limits
    maxPropertyDescriptionLength: z.number().default(5000),
    maxReviewLength: z.number().default(2000),
    maxForumPostLength: z.number().default(10000),
    maxMessageLength: z.number().default(2000),
  }),

  // Moderation settings
  moderation: z.object({
    autoModeration: z.boolean().default(true),
    toxicityThreshold: z.number().min(0).max(1).default(0.7),
    spamThreshold: z.number().min(0).max(1).default(0.8),
    requireApprovalForNewUsers: z.boolean().default(false),
    requireApprovalForImages: z.boolean().default(false),
  }),

  // Email settings
  email: z.object({
    fromName: z.string().default('House Finder'),
    fromEmail: z.string().email().default('noreply@housefinder.com'),
    replyToEmail: z.string().email().optional(),
    welcomeEmailEnabled: z.boolean().default(true),
    marketingEmailsEnabled: z.boolean().default(true),
  }),

  // Payment settings
  payments: z.object({
    stripeLiveMode: z.boolean().default(false),
    paypalLiveMode: z.boolean().default(false),
    acceptCreditCards: z.boolean().default(true),
    acceptPayPal: z.boolean().default(true),
    acceptApplePay: z.boolean().default(true),
    acceptGooglePay: z.boolean().default(true),
  }),

  // Search settings
  search: z.object({
    enableFuzzySearch: z.boolean().default(true),
    minSearchLength: z.number().default(2),
    maxSearchResults: z.number().default(100),
    enableAutoComplete: z.boolean().default(true),
  }),

  // Security
  security: z.object({
    requireEmailVerification: z.boolean().default(true),
    passwordMinLength: z.number().default(8),
    passwordRequireUppercase: z.boolean().default(true),
    passwordRequireNumber: z.boolean().default(true),
    passwordRequireSpecial: z.boolean().default(false),
    sessionTimeout: z.number().default(30 * 24 * 60), // 30 days in minutes
    maxLoginAttempts: z.number().default(5),
    lockoutDuration: z.number().default(30), // minutes
  }),

  // Maintenance
  maintenance: z.object({
    enabled: z.boolean().default(false),
    message: z.string().optional(),
    allowedUsers: z.array(z.string()).optional(), // UIDs of users who can still access
    estimatedEndTime: z.date().optional(),
  }),

  updatedAt: z.date(),
  updatedBy: z.string(),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

/**
 * Audit Logs
 */
export enum AuditEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
  ROLE_CHANGED = 'role_changed',
  PROPERTY_CREATED = 'property_created',
  PROPERTY_UPDATED = 'property_updated',
  PROPERTY_DELETED = 'property_deleted',
  PAYMENT_PROCESSED = 'payment_processed',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  CONFIG_UPDATED = 'config_updated',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  SECURITY_ALERT = 'security_alert',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
}

export const AuditLogSchema = z.object({
  id: z.string(),
  eventType: z.nativeEnum(AuditEventType),

  // Actor (who performed the action)
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().email().optional(),

  // Target (what was affected)
  targetType: z.string().optional(), // 'user', 'property', 'subscription', etc.
  targetId: z.string().optional(),

  // Action details
  action: z.string(),
  description: z.string().optional(),
  changes: z.record(z.object({
    before: z.unknown(),
    after: z.unknown(),
  })).optional(),

  // Context
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
  }).optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),

  // Security
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  requiresReview: z.boolean().default(false),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),

  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

/**
 * Analytics Dashboard
 */
export const AdminAnalyticsSchema = z.object({
  id: z.string(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  startDate: z.date(),
  endDate: z.date(),

  // User metrics
  users: z.object({
    total: z.number(),
    new: z.number(),
    active: z.number(),
    suspended: z.number(),
    banned: z.number(),
    churnRate: z.number(), // Percentage
    growthRate: z.number(), // Percentage
  }),

  // Subscription metrics
  subscriptions: z.object({
    total: z.number(),
    byPlan: z.record(z.number()), // Plan name -> count
    newSubscriptions: z.number(),
    cancellations: z.number(),
    upgrades: z.number(),
    downgrades: z.number(),
    mrr: z.number(), // Monthly Recurring Revenue
    arr: z.number(), // Annual Recurring Revenue
    churnRate: z.number(),
    ltv: z.number(), // Customer Lifetime Value
  }),

  // Property metrics
  properties: z.object({
    total: z.number(),
    active: z.number(),
    sold: z.number(),
    pending: z.number(),
    newListings: z.number(),
    averageDaysOnMarket: z.number(),
    averagePrice: z.number(),
    totalValue: z.number(),
  }),

  // Engagement metrics
  engagement: z.object({
    searches: z.number(),
    favorites: z.number(),
    messages: z.number(),
    appointments: z.number(),
    virtualTours: z.number(),
    reviewsWritten: z.number(),
    forumPosts: z.number(),
    avgSessionDuration: z.number(), // minutes
    avgPropertiesViewed: z.number(),
  }),

  // Revenue metrics
  revenue: z.object({
    total: z.number(),
    subscriptions: z.number(),
    promotedListings: z.number(),
    advertising: z.number(),
    other: z.number(),
    refunds: z.number(),
    netRevenue: z.number(),
  }),

  // Top performers
  topPerformers: z.object({
    properties: z.array(z.object({
      propertyId: z.string(),
      views: z.number(),
      favorites: z.number(),
    })).optional(),
    agents: z.array(z.object({
      agentId: z.string(),
      sales: z.number(),
      volume: z.number(),
    })).optional(),
    users: z.array(z.object({
      userId: z.string(),
      activityScore: z.number(),
    })).optional(),
  }),

  generatedAt: z.date(),
});

export type AdminAnalytics = z.infer<typeof AdminAnalyticsSchema>;

/**
 * Bulk Operations
 */
export enum BulkOperationType {
  UPDATE_USERS = 'update_users',
  DELETE_USERS = 'delete_users',
  UPDATE_PROPERTIES = 'update_properties',
  DELETE_PROPERTIES = 'delete_properties',
  SEND_NOTIFICATIONS = 'send_notifications',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
}

export const BulkOperationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(BulkOperationType),
  initiatedBy: z.string(),

  // Target selection
  targetIds: z.array(z.string()).optional(),
  targetQuery: z.record(z.unknown()).optional(), // Filter criteria

  // Operation details
  operation: z.string(),
  parameters: z.record(z.unknown()),

  // Progress tracking
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  progress: z.object({
    total: z.number(),
    processed: z.number(),
    successful: z.number(),
    failed: z.number(),
    percentage: z.number(),
  }),

  // Results
  results: z.object({
    successIds: z.array(z.string()).optional(),
    failedIds: z.array(z.string()).optional(),
    errors: z.array(z.object({
      id: z.string(),
      error: z.string(),
    })).optional(),
  }).optional(),

  // Scheduling
  scheduledFor: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),

  // Safety
  requiresApproval: z.boolean().default(true),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
  dryRun: z.boolean().default(false), // Test mode

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BulkOperation = z.infer<typeof BulkOperationSchema>;

/**
 * System Health Monitoring
 */
export const SystemHealthSchema = z.object({
  id: z.string(),
  timestamp: z.date(),

  // Service status
  services: z.object({
    api: z.enum(['operational', 'degraded', 'down']),
    database: z.enum(['operational', 'degraded', 'down']),
    storage: z.enum(['operational', 'degraded', 'down']),
    functions: z.enum(['operational', 'degraded', 'down']),
    auth: z.enum(['operational', 'degraded', 'down']),
    search: z.enum(['operational', 'degraded', 'down']),
    payments: z.enum(['operational', 'degraded', 'down']),
  }),

  // Performance metrics
  performance: z.object({
    apiLatency: z.number(), // ms
    databaseLatency: z.number(), // ms
    storageLatency: z.number(), // ms
    functionLatency: z.number(), // ms
    errorRate: z.number(), // percentage
    successRate: z.number(), // percentage
  }),

  // Resource usage
  resources: z.object({
    databaseSize: z.number(), // MB
    storageSize: z.number(), // MB
    bandwidth: z.number(), // MB
    functionInvocations: z.number(),
    activeConnections: z.number(),
  }),

  // Costs
  costs: z.object({
    database: z.number(), // USD
    storage: z.number(), // USD
    bandwidth: z.number(), // USD
    functions: z.number(), // USD
    total: z.number(), // USD
  }).optional(),

  // Alerts
  alerts: z.array(z.object({
    severity: z.enum(['info', 'warning', 'critical']),
    service: z.string(),
    message: z.string(),
    timestamp: z.date(),
  })).optional(),

  // Overall status
  overallStatus: z.enum(['healthy', 'degraded', 'critical']),
});

export type SystemHealth = z.infer<typeof SystemHealthSchema>;

/**
 * Feature Usage Tracking
 */
export const FeatureUsageSchema = z.object({
  id: z.string(),
  featureName: z.string(),
  category: z.string(),

  // Usage metrics
  totalUsers: z.number(),
  activeUsers: z.number(), // Used in last 30 days
  usageCount: z.number(),
  averageUsagePerUser: z.number(),

  // User breakdown
  byPlan: z.record(z.number()), // Plan -> user count
  byRole: z.record(z.number()), // Role -> user count

  // Trends
  trend: z.enum(['increasing', 'stable', 'decreasing']),
  growthRate: z.number(), // Percentage change

  // Time series data
  dailyUsage: z.array(z.object({
    date: z.date(),
    count: z.number(),
    uniqueUsers: z.number(),
  })).optional(),

  period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  startDate: z.date(),
  endDate: z.date(),
  generatedAt: z.date(),
});

export type FeatureUsage = z.infer<typeof FeatureUsageSchema>;

/**
 * Support Tickets
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export const SupportTicketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(), // Human-readable: TICK-12345

  // Requester
  userId: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),

  // Ticket details
  subject: z.string(),
  description: z.string(),
  category: z.enum([
    'technical_issue',
    'billing',
    'account',
    'feature_request',
    'bug_report',
    'general_inquiry',
    'abuse_report',
  ]),

  priority: z.nativeEnum(TicketPriority),
  status: z.nativeEnum(TicketStatus),

  // Assignment
  assignedTo: z.string().optional(),
  assignedAt: z.date().optional(),

  // Conversation
  messages: z.array(z.object({
    id: z.string(),
    senderId: z.string(),
    senderType: z.enum(['user', 'agent', 'system']),
    content: z.string(),
    attachments: z.array(z.string().url()).optional(),
    timestamp: z.date(),
  })),

  // Resolution
  resolution: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  customerSatisfaction: z.number().min(1).max(5).optional(),

  // Tags
  tags: z.array(z.string()).optional(),

  // Metadata
  relatedPropertyId: z.string().optional(),
  relatedTransactionId: z.string().optional(),

  // SLA
  slaBreached: z.boolean().default(false),
  firstResponseAt: z.date().optional(),
  firstResponseSLA: z.number().optional(), // minutes

  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().optional(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
