import { z } from 'zod';

/**
 * Webhooks & API Management
 */

/**
 * Webhook Configuration
 */
export enum WebhookEvent {
  // Properties
  PROPERTY_CREATED = 'property.created',
  PROPERTY_UPDATED = 'property.updated',
  PROPERTY_DELETED = 'property.deleted',
  PROPERTY_SOLD = 'property.sold',
  PROPERTY_PRICE_CHANGED = 'property.price_changed',

  // Users
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Leads
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',

  // Appointments
  APPOINTMENT_SCHEDULED = 'appointment.scheduled',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',

  // Messages
  MESSAGE_RECEIVED = 'message.received',

  // Subscriptions
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',

  // Payments
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',

  // Reviews
  REVIEW_POSTED = 'review.posted',

  // Documents
  DOCUMENT_SIGNED = 'document.signed',
}

export const WebhookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Webhook details
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url(),

  // Events to subscribe to
  events: z.array(z.nativeEnum(WebhookEvent)),

  // Authentication
  secret: z.string().optional(), // HMAC secret for signature verification
  headers: z.record(z.string()).optional(), // Custom headers to send

  // Filters
  filters: z.record(z.unknown()).optional(), // Only trigger for matching data

  // Status
  active: z.boolean().default(true),
  verified: z.boolean().default(false), // URL ownership verification

  // Delivery settings
  settings: z.object({
    retryOnFailure: z.boolean().default(true),
    maxRetries: z.number().default(3),
    retryBackoff: z.enum(['linear', 'exponential']).default('exponential'),
    timeout: z.number().default(30000), // milliseconds
  }),

  // Health tracking
  health: z.object({
    successRate: z.number().min(0).max(100),
    averageResponseTime: z.number(), // milliseconds
    lastSuccessAt: z.date().optional(),
    lastFailureAt: z.date().optional(),
    consecutiveFailures: z.number().default(0),
  }).optional(),

  // Auto-disable
  autoDisableThreshold: z.number().default(10), // Disable after N consecutive failures
  disabledAt: z.date().optional(),
  disabledReason: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

/**
 * Webhook Delivery Log
 */
export const WebhookDeliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  event: z.nativeEnum(WebhookEvent),

  // Payload
  payload: z.record(z.unknown()),
  payloadSize: z.number(), // bytes

  // Delivery attempt
  attemptNumber: z.number().default(1),
  maxAttempts: z.number(),

  // Request
  requestUrl: z.string().url(),
  requestHeaders: z.record(z.string()),
  requestMethod: z.string().default('POST'),

  // Response
  responseStatus: z.number().optional(),
  responseHeaders: z.record(z.string()).optional(),
  responseBody: z.string().optional(),
  responseTime: z.number().optional(), // milliseconds

  // Status
  status: z.enum(['pending', 'delivered', 'failed', 'retry']),
  error: z.string().optional(),

  // Retry scheduling
  nextRetryAt: z.date().optional(),
  retriedAt: z.date().optional(),

  // Timing
  timestamp: z.date(),
  deliveredAt: z.date().optional(),
});

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

/**
 * API Usage Metrics
 */
export const APIUsageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  apiKeyId: z.string().optional(),

  // Time period
  period: z.enum(['hour', 'day', 'week', 'month']),
  periodStart: z.date(),
  periodEnd: z.date(),

  // Request metrics
  requests: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    rateLimit: z.number(),
    unauthorized: z.number(),
  }),

  // Response times
  performance: z.object({
    averageResponseTime: z.number(), // milliseconds
    p50ResponseTime: z.number(),
    p95ResponseTime: z.number(),
    p99ResponseTime: z.number(),
  }),

  // Endpoints
  topEndpoints: z.array(z.object({
    endpoint: z.string(),
    method: z.string(),
    count: z.number(),
    averageResponseTime: z.number(),
  })).optional(),

  // Errors
  topErrors: z.array(z.object({
    statusCode: z.number(),
    message: z.string(),
    count: z.number(),
  })).optional(),

  // Bandwidth
  bandwidth: z.object({
    requestBytes: z.number(),
    responseBytes: z.number(),
    total: z.number(),
  }),

  generatedAt: z.date(),
});

export type APIUsage = z.infer<typeof APIUsageSchema>;

/**
 * Rate Limit Status
 */
export const RateLimitStatusSchema = z.object({
  userId: z.string(),
  apiKeyId: z.string().optional(),

  // Current limits
  limits: z.object({
    perMinute: z.number(),
    perHour: z.number(),
    perDay: z.number(),
  }),

  // Current usage
  usage: z.object({
    currentMinute: z.number(),
    currentHour: z.number(),
    currentDay: z.number(),
  }),

  // Remaining
  remaining: z.object({
    perMinute: z.number(),
    perHour: z.number(),
    perDay: z.number(),
  }),

  // Reset times
  resetAt: z.object({
    minute: z.date(),
    hour: z.date(),
    day: z.date(),
  }),

  // Status
  throttled: z.boolean().default(false),
  retryAfter: z.number().optional(), // seconds

  timestamp: z.date(),
});

export type RateLimitStatus = z.infer<typeof RateLimitStatusSchema>;

/**
 * API Request Log
 */
export const APIRequestLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  apiKeyId: z.string().optional(),
  workspaceId: z.string().optional(),

  // Request details
  method: z.string(),
  endpoint: z.string(),
  path: z.string(),
  queryParams: z.record(z.unknown()).optional(),

  // Headers
  userAgent: z.string().optional(),
  ipAddress: z.string(),
  referer: z.string().optional(),

  // Authentication
  authMethod: z.enum(['api_key', 'session', 'oauth', 'none']).optional(),

  // Request body
  requestBodySize: z.number().optional(), // bytes
  requestBody: z.unknown().optional(), // Only stored for failed requests

  // Response
  statusCode: z.number(),
  responseBodySize: z.number().optional(), // bytes
  responseTime: z.number(), // milliseconds

  // Errors
  error: z.object({
    code: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),

  // Caching
  cacheHit: z.boolean().default(false),

  // Rate limiting
  rateLimited: z.boolean().default(false),

  timestamp: z.date(),
});

export type APIRequestLog = z.infer<typeof APIRequestLogSchema>;

/**
 * GraphQL Schema (if using GraphQL)
 */
export const GraphQLSchemaSchema = z.object({
  id: z.string(),
  version: z.string(),
  schema: z.string(), // GraphQL SDL
  resolvers: z.record(z.unknown()).optional(),

  // Deprecations
  deprecatedFields: z.array(z.object({
    type: z.string(),
    field: z.string(),
    reason: z.string(),
    removedInVersion: z.string().optional(),
  })).optional(),

  // Breaking changes
  breakingChanges: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).optional(),

  active: z.boolean().default(true),
  publishedAt: z.date(),
  createdAt: z.date(),
});

export type GraphQLSchema = z.infer<typeof GraphQLSchemaSchema>;

/**
 * API Documentation
 */
export const APIEndpointSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),

  // Documentation
  name: z.string(),
  description: z.string(),
  category: z.string(),

  // Authentication
  requiresAuth: z.boolean().default(true),
  requiredPermissions: z.array(z.string()).optional(),
  requiredPlan: z.enum(['free', 'basic', 'premium', 'pro', 'enterprise']).optional(),

  // Parameters
  pathParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
  })).optional(),

  queryParameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
    default: z.unknown().optional(),
  })).optional(),

  requestBody: z.object({
    contentType: z.string(),
    schema: z.record(z.unknown()),
    example: z.unknown(),
  }).optional(),

  // Responses
  responses: z.array(z.object({
    statusCode: z.number(),
    description: z.string(),
    schema: z.record(z.unknown()).optional(),
    example: z.unknown().optional(),
  })),

  // Rate limiting
  rateLimit: z.object({
    requests: z.number(),
    period: z.string(), // '1m', '1h', '1d'
  }).optional(),

  // Examples
  examples: z.array(z.object({
    name: z.string(),
    description: z.string(),
    request: z.unknown(),
    response: z.unknown(),
  })).optional(),

  // Status
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),
  removedInVersion: z.string().optional(),

  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type APIEndpoint = z.infer<typeof APIEndpointSchema>;

/**
 * SDK Usage Tracking
 */
export const SDKUsageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // SDK details
  sdkName: z.string(), // 'javascript', 'python', 'ruby', etc.
  sdkVersion: z.string(),
  platform: z.string().optional(), // 'node', 'browser', 'ios', 'android'

  // Usage metrics
  installDate: z.date(),
  lastUsedAt: z.date(),
  requestCount: z.number().default(0),

  // Configuration
  config: z.record(z.unknown()).optional(),

  // Features used
  featuresUsed: z.array(z.string()).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SDKUsage = z.infer<typeof SDKUsageSchema>;

/**
 * IP Whitelist/Blacklist
 */
export const IPAccessControlSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // IP/CIDR
  ipAddress: z.string(),
  cidr: z.string().optional(), // e.g., '192.168.1.0/24'

  // Type
  type: z.enum(['whitelist', 'blacklist']),

  // Scope
  scope: z.enum(['api', 'admin', 'all']),

  // Metadata
  description: z.string().optional(),
  reason: z.string().optional(),

  // Status
  active: z.boolean().default(true),
  expiresAt: z.date().optional(),

  // Usage tracking
  matchCount: z.number().default(0),
  lastMatchedAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IPAccessControl = z.infer<typeof IPAccessControlSchema>;
