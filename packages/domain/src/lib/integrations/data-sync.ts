import { z } from 'zod';

/**
 * Data Import/Export & Integration Features
 */

/**
 * Data Import
 */
export enum ImportSourceType {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  XLSX = 'xlsx',
  API = 'api',
  MLS = 'mls', // Multiple Listing Service
  ZILLOW = 'zillow',
  REALTOR = 'realtor',
  REDFIN = 'redfin',
}

export enum ImportEntityType {
  PROPERTIES = 'properties',
  USERS = 'users',
  AGENTS = 'agents',
  LEADS = 'leads',
  CONTACTS = 'contacts',
}

export const DataImportSchema = z.object({
  id: z.string(),
  name: z.string(),
  initiatedBy: z.string(),
  workspaceId: z.string(),

  // Source
  sourceType: z.nativeEnum(ImportSourceType),
  sourceUrl: z.string().url().optional(),
  sourceFileUrl: z.string().url().optional(),
  sourceFileName: z.string().optional(),

  // Entity type
  entityType: z.nativeEnum(ImportEntityType),

  // Mapping configuration
  fieldMapping: z.record(z.string()), // Source field -> Target field
  transformations: z.array(z.object({
    field: z.string(),
    transformation: z.enum(['uppercase', 'lowercase', 'trim', 'date_format', 'number_format', 'custom']),
    parameters: z.record(z.unknown()).optional(),
  })).optional(),

  // Import options
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    duplicateCheckFields: z.array(z.string()).optional(), // Fields to check for duplicates
    validateData: z.boolean().default(true),
    continueOnError: z.boolean().default(true),
    batchSize: z.number().default(100),
  }),

  // Progress tracking
  status: z.enum(['pending', 'validating', 'importing', 'completed', 'failed', 'cancelled']),
  progress: z.object({
    totalRows: z.number(),
    processedRows: z.number(),
    successfulRows: z.number(),
    failedRows: z.number(),
    skippedRows: z.number(),
    percentage: z.number(),
  }),

  // Results
  results: z.object({
    imported: z.array(z.object({
      rowNumber: z.number(),
      recordId: z.string(),
    })).optional(),
    failed: z.array(z.object({
      rowNumber: z.number(),
      data: z.record(z.unknown()),
      error: z.string(),
    })).optional(),
    skipped: z.array(z.object({
      rowNumber: z.number(),
      reason: z.string(),
    })).optional(),
  }).optional(),

  // Validation errors
  validationErrors: z.array(z.object({
    rowNumber: z.number(),
    field: z.string(),
    error: z.string(),
    value: z.unknown(),
  })).optional(),

  // Rollback
  rollbackable: z.boolean().default(true),
  rolledBack: z.boolean().default(false),
  rolledBackAt: z.date().optional(),
  rolledBackBy: z.string().optional(),

  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DataImport = z.infer<typeof DataImportSchema>;

/**
 * Data Export
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export const DataExportSchema = z.object({
  id: z.string(),
  name: z.string(),
  requestedBy: z.string(),
  workspaceId: z.string(),

  // Export configuration
  entityType: z.nativeEnum(ImportEntityType),
  format: z.nativeEnum(ExportFormat),

  // Filters
  filters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),

  // Fields to export
  fields: z.array(z.string()).optional(), // If empty, export all fields
  excludeFields: z.array(z.string()).optional(),

  // Options
  options: z.object({
    includeHeaders: z.boolean().default(true),
    includeMetadata: z.boolean().default(false),
    compress: z.boolean().default(false), // Create .zip file
    encrypt: z.boolean().default(false),
    password: z.string().optional(),
  }),

  // Progress tracking
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'expired']),
  progress: z.object({
    totalRecords: z.number(),
    processedRecords: z.number(),
    percentage: z.number(),
  }),

  // Results
  fileUrl: z.string().url().optional(),
  fileSize: z.number().optional(), // bytes
  fileName: z.string().optional(),
  recordCount: z.number().optional(),

  // Expiration
  expiresAt: z.date(), // Auto-delete export file after expiration
  downloadCount: z.number().default(0),
  maxDownloads: z.number().default(10),

  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});

export type DataExport = z.infer<typeof DataExportSchema>;

/**
 * Third-Party Integrations
 */
export enum IntegrationType {
  CRM = 'crm',
  EMAIL = 'email',
  CALENDAR = 'calendar',
  ACCOUNTING = 'accounting',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PAYMENT = 'payment',
  STORAGE = 'storage',
  COMMUNICATION = 'communication',
}

export const IntegrationConnectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Integration details
  type: z.nativeEnum(IntegrationType),
  provider: z.string(), // 'salesforce', 'hubspot', 'mailchimp', etc.
  name: z.string(),
  description: z.string().optional(),

  // Authentication
  authType: z.enum(['oauth2', 'api_key', 'basic', 'custom']),
  credentials: z.object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    tokenExpiry: z.date().optional(),
  }).optional(),

  // Configuration
  config: z.record(z.unknown()),
  settings: z.object({
    syncDirection: z.enum(['import', 'export', 'bidirectional']),
    syncFrequency: z.enum(['manual', 'hourly', 'daily', 'weekly', 'realtime']),
    autoSync: z.boolean().default(false),
  }),

  // Sync configuration
  fieldMappings: z.array(z.object({
    localField: z.string(),
    remoteField: z.string(),
    direction: z.enum(['import', 'export', 'bidirectional']),
  })).optional(),

  // Status
  status: z.enum(['active', 'inactive', 'error', 'expired']),
  lastSyncAt: z.date().optional(),
  nextSyncAt: z.date().optional(),

  // Health
  healthy: z.boolean().default(true),
  lastError: z.string().optional(),
  errorCount: z.number().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>;

/**
 * Sync Jobs
 */
export const SyncJobSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  workspaceId: z.string(),

  // Sync details
  type: z.enum(['full', 'incremental']),
  direction: z.enum(['import', 'export', 'bidirectional']),
  entityType: z.string(),

  // Trigger
  trigger: z.enum(['manual', 'scheduled', 'webhook', 'api']),
  triggeredBy: z.string().optional(),

  // Progress
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  progress: z.object({
    totalRecords: z.number(),
    processedRecords: z.number(),
    createdRecords: z.number(),
    updatedRecords: z.number(),
    failedRecords: z.number(),
    skippedRecords: z.number(),
    percentage: z.number(),
  }),

  // Results
  results: z.object({
    created: z.number(),
    updated: z.number(),
    deleted: z.number(),
    failed: z.number(),
    errors: z.array(z.object({
      recordId: z.string().optional(),
      error: z.string(),
    })).optional(),
  }).optional(),

  // Timing
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().optional(), // seconds

  createdAt: z.date(),
});

export type SyncJob = z.infer<typeof SyncJobSchema>;

/**
 * MLS (Multiple Listing Service) Integration
 */
export const MLSConnectionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),

  // MLS provider
  provider: z.string(), // 'RETS', 'RESO Web API', etc.
  mlsId: z.string(),
  mlsName: z.string(),

  // Credentials
  username: z.string(),
  password: z.string().optional(), // Encrypted
  serverUrl: z.string().url(),
  version: z.string().optional(),

  // Coverage
  coverage: z.object({
    states: z.array(z.string()),
    counties: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
  }),

  // Sync settings
  syncSettings: z.object({
    syncFrequency: z.enum(['hourly', 'daily', 'weekly']),
    autoImport: z.boolean().default(true),
    importPhotos: z.boolean().default(true),
    importVirtualTours: z.boolean().default(true),
    importDocuments: z.boolean().default(false),
  }),

  // Status
  active: z.boolean().default(true),
  lastSyncAt: z.date().optional(),
  lastSyncStatus: z.enum(['success', 'partial', 'failed']).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MLSConnection = z.infer<typeof MLSConnectionSchema>;

/**
 * API Keys (for developers)
 */
export const APIKeySchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Key details
  name: z.string(),
  description: z.string().optional(),
  key: z.string(), // The actual API key (hashed in storage)
  keyPrefix: z.string(), // First few characters for identification

  // Permissions
  permissions: z.array(z.enum([
    'properties:read',
    'properties:write',
    'users:read',
    'users:write',
    'analytics:read',
    'webhooks:manage',
    'all',
  ])),

  // Rate limiting
  rateLimit: z.object({
    requestsPerMinute: z.number().default(60),
    requestsPerHour: z.number().default(1000),
    requestsPerDay: z.number().default(10000),
  }),

  // Usage tracking
  usage: z.object({
    totalRequests: z.number().default(0),
    lastUsedAt: z.date().optional(),
    lastUsedIp: z.string().optional(),
  }),

  // Restrictions
  allowedIps: z.array(z.string()).optional(),
  allowedDomains: z.array(z.string()).optional(),

  // Status
  active: z.boolean().default(true),
  expiresAt: z.date().optional(),

  // Security
  lastRotatedAt: z.date().optional(),
  rotationPolicy: z.enum(['never', 'monthly', 'quarterly', 'yearly']).default('never'),

  createdAt: z.date(),
  revokedAt: z.date().optional(),
  revokedBy: z.string().optional(),
});

export type APIKey = z.infer<typeof APIKeySchema>;

/**
 * Zapier-Style Workflow Connector
 */
export const WorkflowConnectorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Connector details
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),

  // Trigger
  trigger: z.object({
    type: z.enum([
      'property_created',
      'property_updated',
      'property_sold',
      'lead_created',
      'appointment_scheduled',
      'message_received',
      'review_posted',
      'subscription_created',
      'webhook',
    ]),
    filters: z.record(z.unknown()).optional(),
  }),

  // Actions
  actions: z.array(z.object({
    id: z.string(),
    order: z.number(),
    type: z.enum([
      'send_email',
      'send_sms',
      'create_task',
      'update_crm',
      'post_to_slack',
      'create_property',
      'update_property',
      'send_webhook',
      'delay',
      'conditional',
    ]),
    parameters: z.record(z.unknown()),
    condition: z.string().optional(), // JavaScript expression
  })),

  // Execution history
  lastExecutedAt: z.date().optional(),
  executionCount: z.number().default(0),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkflowConnector = z.infer<typeof WorkflowConnectorSchema>;

/**
 * Backup & Restore
 */
export const BackupSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  initiatedBy: z.string(),

  // Backup type
  type: z.enum(['full', 'incremental', 'differential']),
  scope: z.enum(['workspace', 'user', 'collection', 'full_system']),

  // What's included
  collections: z.array(z.string()).optional(),
  includeFiles: z.boolean().default(true),
  includeUsers: z.boolean().default(true),

  // Backup file
  fileUrl: z.string().url().optional(),
  fileSize: z.number().optional(), // bytes
  compressed: z.boolean().default(true),
  encrypted: z.boolean().default(true),

  // Status
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  progress: z.object({
    totalItems: z.number(),
    backedUpItems: z.number(),
    percentage: z.number(),
  }).optional(),

  // Restore information
  restorableUntil: z.date(),
  restoredAt: z.date().optional(),
  restoredBy: z.string().optional(),

  // Metadata
  recordCount: z.number().optional(),
  checksum: z.string().optional(),

  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type Backup = z.infer<typeof BackupSchema>;
