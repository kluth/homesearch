import { z } from 'zod';

/**
 * Advanced Reporting & Analytics
 */

/**
 * Custom Report Builder
 */
export const CustomReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Report details
  name: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'sales',
    'marketing',
    'properties',
    'users',
    'financial',
    'performance',
    'custom',
  ]),

  // Data source
  dataSource: z.object({
    type: z.enum(['firestore', 'analytics', 'custom_query']),
    collection: z.string().optional(),
    query: z.record(z.unknown()).optional(),
    aggregations: z.array(z.object({
      field: z.string(),
      function: z.enum(['count', 'sum', 'avg', 'min', 'max', 'distinct']),
      alias: z.string().optional(),
    })).optional(),
  }),

  // Filters
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'between']),
    value: z.unknown(),
    logicalOperator: z.enum(['AND', 'OR']).optional(),
  })).optional(),

  // Grouping
  groupBy: z.array(z.string()).optional(),

  // Sorting
  sortBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),

  // Columns/Fields to display
  columns: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean', 'currency', 'percentage']),
    format: z.string().optional(),
    aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional(),
  })),

  // Visualization
  visualization: z.object({
    type: z.enum(['table', 'line', 'bar', 'pie', 'area', 'scatter', 'heatmap']),
    config: z.record(z.unknown()).optional(),
  }),

  // Scheduling
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    time: z.string().optional(), // "09:00"
    recipients: z.array(z.string().email()),
    format: z.enum(['pdf', 'xlsx', 'csv', 'email']),
  }).optional(),

  // Date range
  dateRange: z.object({
    type: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'last_month', 'custom']),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional(),

  // Sharing
  sharing: z.object({
    visibility: z.enum(['private', 'workspace', 'public']),
    sharedWith: z.array(z.string()).optional(),
  }),

  // Caching
  cacheResults: z.boolean().default(true),
  cacheDuration: z.number().default(3600), // seconds

  // Status
  favorite: z.boolean().default(false),
  lastRunAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomReport = z.infer<typeof CustomReportSchema>;

/**
 * Report Execution
 */
export const ReportExecutionSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  workspaceId: z.string(),
  executedBy: z.string(),

  // Execution details
  parameters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),

  // Status
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),

  // Results
  results: z.object({
    data: z.array(z.record(z.unknown())).optional(),
    rowCount: z.number(),
    summary: z.record(z.unknown()).optional(),
    chartData: z.record(z.unknown()).optional(),
  }).optional(),

  // Export
  exportUrl: z.string().url().optional(),
  exportFormat: z.enum(['pdf', 'xlsx', 'csv', 'json']).optional(),
  expiresAt: z.date().optional(),

  // Performance
  executionTime: z.number().optional(), // milliseconds
  fromCache: z.boolean().default(false),

  // Error
  error: z.string().optional(),

  executedAt: z.date(),
  completedAt: z.date().optional(),
});

export type ReportExecution = z.infer<typeof ReportExecutionSchema>;

/**
 * Dashboard
 */
export const DashboardSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  createdBy: z.string(),

  // Dashboard details
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),

  // Layout
  layout: z.array(z.object({
    id: z.string(),
    type: z.enum(['metric', 'chart', 'table', 'text', 'report']),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    config: z.record(z.unknown()),
  })),

  // Widgets
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['kpi', 'trend', 'comparison', 'breakdown', 'list', 'gauge']),
    title: z.string(),
    dataSource: z.object({
      reportId: z.string().optional(),
      query: z.record(z.unknown()).optional(),
      aggregation: z.string().optional(),
    }),
    visualization: z.record(z.unknown()),
    refreshInterval: z.number().optional(), // seconds
  })),

  // Filters (apply to all widgets)
  globalFilters: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.enum(['select', 'daterange', 'multiselect']),
    options: z.array(z.unknown()).optional(),
    defaultValue: z.unknown().optional(),
  })).optional(),

  // Sharing
  visibility: z.enum(['private', 'workspace', 'public']),
  sharedWith: z.array(z.string()).optional(),

  // Auto-refresh
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().default(300), // seconds

  // Status
  isDefault: z.boolean().default(false), // Default dashboard for user
  favorite: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;

/**
 * Sales Pipeline Report
 */
export const SalesPipelineReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),

  // Pipeline stages
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    count: z.number(),
    value: z.number(), // Total property value
    averageValue: z.number(),
    conversionRate: z.number(), // To next stage
    averageDuration: z.number(), // Days in this stage
  })),

  // Funnel metrics
  funnel: z.object({
    totalLeads: z.number(),
    qualifiedLeads: z.number(),
    viewings: z.number(),
    offers: z.number(),
    closedDeals: z.number(),
    overallConversionRate: z.number(),
  }),

  // Top performers
  topAgents: z.array(z.object({
    agentId: z.string(),
    agentName: z.string(),
    closedDeals: z.number(),
    totalValue: z.number(),
    conversionRate: z.number(),
  })),

  // Lost deals analysis
  lostDeals: z.object({
    total: z.number(),
    reasons: z.array(z.object({
      reason: z.string(),
      count: z.number(),
      percentage: z.number(),
    })),
  }),

  // Forecast
  forecast: z.object({
    expectedClosings: z.number(),
    expectedValue: z.number(),
    confidence: z.enum(['low', 'medium', 'high']),
  }).optional(),

  generatedAt: z.date(),
});

export type SalesPipelineReport = z.infer<typeof SalesPipelineReportSchema>;

/**
 * Property Performance Report
 */
export const PropertyPerformanceReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),

  // Overall metrics
  overall: z.object({
    totalListings: z.number(),
    activeListings: z.number(),
    soldListings: z.number(),
    averageDaysOnMarket: z.number(),
    averageListPrice: z.number(),
    averageSoldPrice: z.number(),
    listToSaleRatio: z.number(), // Percentage
  }),

  // By property type
  byType: z.array(z.object({
    type: z.string(),
    count: z.number(),
    averagePrice: z.number(),
    averageDaysOnMarket: z.number(),
    soldCount: z.number(),
  })),

  // By location
  byLocation: z.array(z.object({
    city: z.string(),
    state: z.string(),
    count: z.number(),
    averagePrice: z.number(),
    medianPrice: z.number(),
    priceChange: z.number(), // Percentage
  })),

  // Top performers
  topProperties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    views: z.number(),
    favorites: z.number(),
    inquiries: z.number(),
    score: z.number(), // Engagement score
  })),

  // Price analysis
  priceAnalysis: z.object({
    priceRanges: z.array(z.object({
      min: z.number(),
      max: z.number(),
      count: z.number(),
      percentage: z.number(),
    })),
    priceReductions: z.number(),
    averageReduction: z.number(), // Percentage
  }),

  generatedAt: z.date(),
});

export type PropertyPerformanceReport = z.infer<typeof PropertyPerformanceReportSchema>;

/**
 * User Engagement Report
 */
export const UserEngagementReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),

  // User metrics
  users: z.object({
    total: z.number(),
    new: z.number(),
    active: z.number(), // Used platform in period
    inactive: z.number(),
    churnedUsers: z.number(),
    retentionRate: z.number(), // Percentage
  }),

  // Activity metrics
  activity: z.object({
    totalSessions: z.number(),
    averageSessionDuration: z.number(), // minutes
    averageSessionsPerUser: z.number(),
    totalPageViews: z.number(),
    averagePageViewsPerSession: z.number(),
  }),

  // Feature usage
  featureUsage: z.array(z.object({
    feature: z.string(),
    users: z.number(),
    usageCount: z.number(),
    averagePerUser: z.number(),
  })),

  // User segments
  segments: z.array(z.object({
    segment: z.string(),
    userCount: z.number(),
    percentage: z.number(),
    averageEngagement: z.number(),
  })),

  // Conversion funnel
  funnel: z.object({
    visitors: z.number(),
    signups: z.number(),
    activated: z.number(), // Completed profile
    converted: z.number(), // Made transaction/subscription
    signupRate: z.number(),
    activationRate: z.number(),
    conversionRate: z.number(),
  }),

  generatedAt: z.date(),
});

export type UserEngagementReport = z.infer<typeof UserEngagementReportSchema>;

/**
 * Financial Report
 */
export const FinancialReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),

  // Revenue
  revenue: z.object({
    total: z.number(),
    bySource: z.array(z.object({
      source: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })),
    growth: z.number(), // Percentage vs previous period
  }),

  // Subscriptions
  subscriptions: z.object({
    mrr: z.number(), // Monthly Recurring Revenue
    arr: z.number(), // Annual Recurring Revenue
    byPlan: z.array(z.object({
      plan: z.string(),
      count: z.number(),
      revenue: z.number(),
    })),
    newMRR: z.number(),
    churnedMRR: z.number(),
    expansionMRR: z.number(), // From upgrades
    contractionMRR: z.number(), // From downgrades
  }),

  // Transactions
  transactions: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    refunded: z.number(),
    averageTransactionValue: z.number(),
  }),

  // Costs
  costs: z.object({
    total: z.number(),
    infrastructure: z.number(),
    marketing: z.number(),
    support: z.number(),
    other: z.number(),
  }).optional(),

  // Profitability
  profit: z.object({
    grossProfit: z.number(),
    grossMargin: z.number(), // Percentage
    netProfit: z.number().optional(),
    netMargin: z.number().optional(), // Percentage
  }).optional(),

  // Customer metrics
  customerMetrics: z.object({
    ltv: z.number(), // Customer Lifetime Value
    cac: z.number(), // Customer Acquisition Cost
    ltvCacRatio: z.number(),
    paybackPeriod: z.number(), // Months
  }).optional(),

  generatedAt: z.date(),
});

export type FinancialReport = z.infer<typeof FinancialReportSchema>;

/**
 * Scheduled Report
 */
export const ScheduledReportSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  reportId: z.string(),
  createdBy: z.string(),

  // Schedule
  name: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().optional(), // 0-6 for weekly
  dayOfMonth: z.number().optional(), // 1-31 for monthly
  time: z.string(), // "09:00"
  timezone: z.string().default('America/New_York'),

  // Recipients
  recipients: z.array(z.object({
    email: z.string().email(),
    format: z.enum(['pdf', 'xlsx', 'csv', 'email_summary']),
  })),

  // Filters/Parameters
  parameters: z.record(z.unknown()).optional(),

  // Status
  active: z.boolean().default(true),
  lastRunAt: z.date().optional(),
  nextRunAt: z.date(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScheduledReport = z.infer<typeof ScheduledReportSchema>;
