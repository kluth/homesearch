import { z } from 'zod';

/**
 * Workflow Automation & Business Logic
 */

/**
 * Automated Workflow
 */
export const WorkflowSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Workflow details
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'lead_nurturing',
    'property_management',
    'client_communication',
    'task_automation',
    'reporting',
    'notifications',
    'data_sync',
  ]),

  // Trigger
  trigger: z.object({
    type: z.enum([
      'schedule', // Cron-based
      'event', // Firestore event
      'webhook', // External webhook
      'manual', // User-initiated
      'conditional', // When condition meets
    ]),
    config: z.object({
      // For schedule
      cronExpression: z.string().optional(),
      timezone: z.string().optional(),

      // For event
      eventType: z.string().optional(),
      collection: z.string().optional(),
      operation: z.enum(['create', 'update', 'delete']).optional(),

      // For webhook
      webhookPath: z.string().optional(),

      // For conditional
      condition: z.string().optional(), // JavaScript expression
      checkInterval: z.number().optional(), // minutes
    }),
  }),

  // Workflow steps
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum([
      'condition',
      'action',
      'loop',
      'delay',
      'parallel',
      'api_call',
      'database_query',
      'send_email',
      'send_sms',
      'create_task',
      'update_record',
      'javascript',
    ]),
    order: z.number(),

    // Configuration
    config: z.record(z.unknown()),

    // Conditional logic
    condition: z.string().optional(), // Skip if condition not met

    // Error handling
    continueOnError: z.boolean().default(false),
    retryOnFailure: z.boolean().default(false),
    maxRetries: z.number().default(3),

    // Next step (for branching)
    nextStepOnSuccess: z.string().optional(),
    nextStepOnFailure: z.string().optional(),
  })),

  // Variables
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array']),
    defaultValue: z.unknown().optional(),
    description: z.string().optional(),
  })).optional(),

  // Settings
  settings: z.object({
    timeout: z.number().default(300000), // 5 minutes in ms
    maxExecutions: z.number().optional(), // Max times workflow can run
    concurrency: z.number().default(1), // Max parallel executions
  }),

  // Status
  active: z.boolean().default(true),
  version: z.number().default(1),

  // Execution stats
  stats: z.object({
    totalExecutions: z.number().default(0),
    successfulExecutions: z.number().default(0),
    failedExecutions: z.number().default(0),
    lastExecutedAt: z.date().optional(),
    averageExecutionTime: z.number().optional(), // milliseconds
  }).optional(),

  // Publishing
  published: z.boolean().default(false),
  publishedAt: z.date().optional(),
  draftVersion: z.number().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

/**
 * Workflow Execution
 */
export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  workspaceId: z.string(),

  // Trigger context
  trigger: z.object({
    type: z.string(),
    data: z.record(z.unknown()).optional(),
    userId: z.string().optional(),
  }),

  // Execution status
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout']),

  // Step executions
  steps: z.array(z.object({
    stepId: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    duration: z.number().optional(), // milliseconds
    input: z.record(z.unknown()).optional(),
    output: z.record(z.unknown()).optional(),
    error: z.string().optional(),
    retryCount: z.number().default(0),
  })),

  // Variables state
  variables: z.record(z.unknown()).optional(),

  // Overall timing
  startedAt: z.date(),
  completedAt: z.date().optional(),
  duration: z.number().optional(), // milliseconds

  // Error handling
  error: z.object({
    stepId: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),

  // Logs
  logs: z.array(z.object({
    timestamp: z.date(),
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    data: z.record(z.unknown()).optional(),
  })).optional(),

  createdAt: z.date(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

/**
 * Email Campaign
 */
export const EmailCampaignSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Campaign details
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['one_time', 'drip', 'recurring']),

  // Email content
  subject: z.string(),
  preheader: z.string().optional(),
  fromName: z.string(),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),

  // Body
  htmlBody: z.string(),
  textBody: z.string(),

  // Template
  templateId: z.string().optional(),
  templateVariables: z.record(z.unknown()).optional(),

  // Recipients
  recipientList: z.object({
    type: z.enum(['segment', 'list', 'filter', 'manual']),
    segmentId: z.string().optional(),
    listId: z.string().optional(),
    filters: z.record(z.unknown()).optional(),
    manualEmails: z.array(z.string().email()).optional(),
  }),

  // Scheduling
  schedule: z.object({
    type: z.enum(['immediate', 'scheduled', 'drip', 'recurring']),
    sendAt: z.date().optional(),

    // For drip campaigns
    dripSchedule: z.array(z.object({
      dayOffset: z.number(), // Days after subscription
      timeOfDay: z.string(), // "09:00"
    })).optional(),

    // For recurring
    recurringSchedule: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      dayOfWeek: z.number().optional(), // 0-6 for weekly
      dayOfMonth: z.number().optional(), // 1-31 for monthly
      time: z.string(), // "09:00"
    }).optional(),
  }),

  // A/B Testing
  abTest: z.object({
    enabled: z.boolean().default(false),
    variants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string(),
      htmlBody: z.string(),
      percentage: z.number(), // 0-100
    })).optional(),
    winnerMetric: z.enum(['open_rate', 'click_rate', 'conversion']).optional(),
    testDuration: z.number().optional(), // hours
  }).optional(),

  // Tracking
  tracking: z.object({
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
    googleAnalytics: z.boolean().default(false),
  }),

  // Status
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled']),

  // Stats
  stats: z.object({
    totalRecipients: z.number().default(0),
    sent: z.number().default(0),
    delivered: z.number().default(0),
    bounced: z.number().default(0),
    opened: z.number().default(0),
    clicked: z.number().default(0),
    unsubscribed: z.number().default(0),
    complained: z.number().default(0),

    // Rates
    deliveryRate: z.number().optional(),
    openRate: z.number().optional(),
    clickRate: z.number().optional(),
    unsubscribeRate: z.number().optional(),
  }).optional(),

  sentAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;

/**
 * Email Template
 */
export const EmailTemplateSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),

  // Template details
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'transactional',
    'marketing',
    'notification',
    'welcome',
    'followup',
    'newsletter',
  ]),

  // Content
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string(),

  // Variables
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    defaultValue: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),

  // Preview
  previewData: z.record(z.unknown()).optional(),

  // Status
  active: z.boolean().default(true),
  isSystem: z.boolean().default(false), // System templates can't be deleted

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

/**
 * SMS Campaign
 */
export const SMSCampaignSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Campaign details
  name: z.string(),
  description: z.string().optional(),

  // Message content
  message: z.string(),
  maxLength: z.number().default(160), // SMS character limit

  // Sender
  fromNumber: z.string(),

  // Recipients
  recipientList: z.object({
    type: z.enum(['segment', 'list', 'filter', 'manual']),
    segmentId: z.string().optional(),
    filters: z.record(z.unknown()).optional(),
    manualNumbers: z.array(z.string()).optional(),
  }),

  // Scheduling
  sendAt: z.date().optional(),

  // Status
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']),

  // Stats
  stats: z.object({
    totalRecipients: z.number().default(0),
    sent: z.number().default(0),
    delivered: z.number().default(0),
    failed: z.number().default(0),
    clicked: z.number().default(0), // If message contains link
  }).optional(),

  // Cost
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),

  sentAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SMSCampaign = z.infer<typeof SMSCampaignSchema>;

/**
 * Task Automation
 */
export const AutomatedTaskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),

  // Task details
  name: z.string(),
  description: z.string().optional(),
  type: z.enum([
    'followup',
    'reminder',
    'data_cleanup',
    'report_generation',
    'lead_assignment',
    'property_update',
  ]),

  // Assignment
  assignedTo: z.string().optional(),
  autoAssign: z.boolean().default(false),
  assignmentRule: z.string().optional(), // JavaScript expression

  // Priority
  priority: z.enum(['low', 'medium', 'high', 'urgent']),

  // Due date
  dueDate: z.date().optional(),
  dueDateRule: z.string().optional(), // "3 days after property_created"

  // Trigger
  trigger: z.object({
    event: z.string(),
    filters: z.record(z.unknown()).optional(),
  }),

  // Actions
  actions: z.array(z.object({
    type: z.enum(['create_task', 'send_email', 'send_notification', 'update_record']),
    config: z.record(z.unknown()),
  })),

  // Status
  active: z.boolean().default(true),

  // Stats
  stats: z.object({
    totalTriggered: z.number().default(0),
    totalCompleted: z.number().default(0),
    averageCompletionTime: z.number().optional(), // hours
  }).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AutomatedTask = z.infer<typeof AutomatedTaskSchema>;

/**
 * Lead Scoring Rule
 */
export const LeadScoringRuleSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),

  // Rule details
  name: z.string(),
  description: z.string().optional(),

  // Scoring criteria
  criteria: z.array(z.object({
    id: z.string(),
    name: z.string(),
    field: z.string(), // e.g., 'propertyViewCount', 'favoriteCount'
    operator: z.enum(['equals', 'greater_than', 'less_than', 'contains', 'in_range']),
    value: z.unknown(),
    points: z.number(), // Points to add/subtract
  })),

  // Score ranges
  scoreRanges: z.array(z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(), // 'cold', 'warm', 'hot'
    color: z.string().optional(),
  })),

  // Auto-actions based on score
  automations: z.array(z.object({
    scoreThreshold: z.number(),
    action: z.enum(['assign_to_agent', 'send_email', 'create_task', 'add_to_campaign']),
    config: z.record(z.unknown()),
  })).optional(),

  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LeadScoringRule = z.infer<typeof LeadScoringRuleSchema>;

/**
 * Notification Rule
 */
export const NotificationRuleSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Rule details
  name: z.string(),
  description: z.string().optional(),

  // Trigger
  trigger: z.object({
    event: z.string(),
    filters: z.record(z.unknown()).optional(),
  }),

  // Recipients
  recipients: z.object({
    type: z.enum(['specific_users', 'role', 'workspace', 'dynamic']),
    userIds: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    dynamicRule: z.string().optional(), // JavaScript expression
  }),

  // Notification content
  notification: z.object({
    title: z.string(),
    message: z.string(),
    channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
  }),

  // Throttling
  throttle: z.object({
    enabled: z.boolean().default(false),
    maxPerHour: z.number().optional(),
    maxPerDay: z.number().optional(),
  }).optional(),

  // Quiet hours
  respectQuietHours: z.boolean().default(true),

  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationRule = z.infer<typeof NotificationRuleSchema>;
