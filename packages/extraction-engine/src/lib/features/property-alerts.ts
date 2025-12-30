/**
 * Property Alerts System
 *
 * Smart notification engine for real-time property updates and personalized alerts.
 *
 * Features:
 * - New listing notifications
 * - Price change alerts
 * - Status change tracking
 * - Saved search alerts
 * - Market condition alerts
 * - Custom trigger rules
 * - Multi-channel delivery (email, SMS, push, in-app)
 * - Alert frequency management
 * - Quiet hours support
 * - Alert history and analytics
 *
 * @module PropertyAlerts
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const AlertTriggerSchema = z.object({
  type: z.enum([
    'new_listing',
    'price_decrease',
    'price_increase',
    'status_change',
    'back_on_market',
    'open_house',
    'saved_search_match',
    'market_alert',
    'neighborhood_alert',
    'custom',
  ]),
  conditions: z.object({
    minPriceChange: z.number().optional().describe('Minimum percentage price change'),
    maxPrice: z.number().optional(),
    minPrice: z.number().optional(),
    locations: z.array(z.string()).optional(),
    propertyTypes: z.array(z.string()).optional(),
    customRules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
      value: z.any(),
    })).optional(),
  }),
});

export const AlertPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  channels: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
    inApp: z.boolean().default(true),
  }),
  frequency: z.enum(['instant', 'hourly', 'daily', 'weekly']).default('instant'),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string(),
  }).optional(),
  groupSimilarAlerts: z.boolean().default(true),
  maxAlertsPerDay: z.number().int().positive().max(100).default(20),
  pausedUntil: z.string().datetime().optional(),
});

export const AlertRuleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  trigger: AlertTriggerSchema,
  isActive: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastTriggered: z.string().datetime().optional(),
  triggerCount: z.number().int().nonnegative().default(0),
});

export const PropertyAlertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ruleId: z.string(),
  propertyId: z.string(),
  propertyAddress: z.string(),
  alertType: AlertTriggerSchema.shape.type,
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.string(), z.any()),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])),
  status: z.enum(['pending', 'sent', 'failed', 'read', 'dismissed']),
  createdAt: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  dismissedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
});

export const AlertBatchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  alerts: z.array(PropertyAlertSchema),
  summary: z.string(),
  createdAt: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
});

export const AlertAnalyticsSchema = z.object({
  userId: z.string(),
  period: z.enum(['7_days', '30_days', '90_days', 'all_time']),
  totalAlerts: z.number().int().nonnegative(),
  byType: z.record(z.string(), z.number().int().nonnegative()),
  byPriority: z.record(z.string(), z.number().int().nonnegative()),
  byChannel: z.record(z.string(), z.number().int().nonnegative()),
  readRate: z.number().min(0).max(100),
  dismissRate: z.number().min(0).max(100),
  averageTimeToRead: z.number().describe('Minutes'),
  mostEffectiveChannel: z.enum(['email', 'sms', 'push', 'in_app']).optional(),
  topTriggers: z.array(z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    count: z.number().int().nonnegative(),
  })),
  insights: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type AlertTrigger = z.infer<typeof AlertTriggerSchema>;
export type AlertPreferences = z.infer<typeof AlertPreferencesSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type PropertyAlert = z.infer<typeof PropertyAlertSchema>;
export type AlertBatch = z.infer<typeof AlertBatchSchema>;
export type AlertAnalytics = z.infer<typeof AlertAnalyticsSchema>;

// ============================================================================
// Interfaces
// ============================================================================

export interface PropertyData {
  id: string;
  address: string;
  price: number;
  previousPrice?: number;
  status: string;
  previousStatus?: string;
  propertyType: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  listedDate: string;
  [key: string]: any;
}

export interface AlertDeliveryResult {
  alertId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  success: boolean;
  error?: string;
  sentAt?: string;
}

// ============================================================================
// Property Alerts System
// ============================================================================

export class PropertyAlertsSystem {
  /**
   * Creates a new alert rule
   */
  public createAlertRule(
    userId: string,
    name: string,
    trigger: AlertTrigger,
    options?: {
      description?: string;
      priority?: AlertRule['priority'];
    }
  ): AlertRule {
    const rule: AlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description: options?.description,
      trigger,
      isActive: true,
      priority: options?.priority ?? 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
    };

    return rule;
  }

  /**
   * Evaluates properties against alert rules
   */
  public evaluateProperties(
    properties: PropertyData[],
    rules: AlertRule[],
    preferences: AlertPreferences
  ): PropertyAlert[] {
    const alerts: PropertyAlert[] = [];

    const activeRules = rules.filter((r) => r.isActive);

    for (const property of properties) {
      for (const rule of activeRules) {
        if (this.matchesRule(property, rule)) {
          const alert = this.createAlert(property, rule, preferences);
          if (alert) {
            alerts.push(alert);
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Checks if property matches alert rule
   */
  private matchesRule(property: PropertyData, rule: AlertRule): boolean {
    const { type, conditions } = rule.trigger;

    switch (type) {
      case 'new_listing': {
        // Check if property was listed recently (within 24 hours)
        const listedDate = new Date(property.listedDate);
        const hoursSinceListing =
          (new Date().getTime() - listedDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceListing > 24) return false;

        return this.matchesConditions(property, conditions);
      }

      case 'price_decrease': {
        if (!property.previousPrice || !property.price) return false;

        const priceChange =
          ((property.price - property.previousPrice) / property.previousPrice) * 100;

        if (priceChange >= 0) return false; // Not a decrease

        const minChange = conditions.minPriceChange ?? 5;
        if (Math.abs(priceChange) < minChange) return false;

        return this.matchesConditions(property, conditions);
      }

      case 'price_increase': {
        if (!property.previousPrice || !property.price) return false;

        const priceChange =
          ((property.price - property.previousPrice) / property.previousPrice) * 100;

        if (priceChange <= 0) return false; // Not an increase

        const minChange = conditions.minPriceChange ?? 5;
        if (priceChange < minChange) return false;

        return this.matchesConditions(property, conditions);
      }

      case 'status_change': {
        if (!property.previousStatus || property.status === property.previousStatus) {
          return false;
        }

        return this.matchesConditions(property, conditions);
      }

      case 'back_on_market': {
        if (
          property.status !== 'active' ||
          property.previousStatus !== 'pending' &&
          property.previousStatus !== 'contingent'
        ) {
          return false;
        }

        return this.matchesConditions(property, conditions);
      }

      case 'open_house': {
        // Check if property has upcoming open house
        // In real implementation, check property.openHouseDate
        return this.matchesConditions(property, conditions);
      }

      case 'saved_search_match': {
        // This would be handled separately with saved search criteria
        return this.matchesConditions(property, conditions);
      }

      case 'custom': {
        return this.matchesConditions(property, conditions);
      }

      default:
        return false;
    }
  }

  /**
   * Checks if property matches additional conditions
   */
  private matchesConditions(
    property: PropertyData,
    conditions: AlertTrigger['conditions']
  ): boolean {
    // Price range check
    if (conditions.maxPrice && property.price > conditions.maxPrice) {
      return false;
    }

    if (conditions.minPrice && property.price < conditions.minPrice) {
      return false;
    }

    // Location check
    if (conditions.locations && conditions.locations.length > 0) {
      const matches = conditions.locations.some((loc) =>
        property.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (!matches) return false;
    }

    // Property type check
    if (conditions.propertyTypes && conditions.propertyTypes.length > 0) {
      if (!conditions.propertyTypes.includes(property.propertyType)) {
        return false;
      }
    }

    // Custom rules check
    if (conditions.customRules && conditions.customRules.length > 0) {
      for (const customRule of conditions.customRules) {
        const fieldValue = property[customRule.field];

        switch (customRule.operator) {
          case 'equals':
            if (fieldValue !== customRule.value) return false;
            break;
          case 'not_equals':
            if (fieldValue === customRule.value) return false;
            break;
          case 'greater_than':
            if (!(fieldValue > customRule.value)) return false;
            break;
          case 'less_than':
            if (!(fieldValue < customRule.value)) return false;
            break;
          case 'contains':
            if (!String(fieldValue).toLowerCase().includes(String(customRule.value).toLowerCase())) {
              return false;
            }
            break;
        }
      }
    }

    return true;
  }

  /**
   * Creates an alert from matched property and rule
   */
  private createAlert(
    property: PropertyData,
    rule: AlertRule,
    preferences: AlertPreferences
  ): PropertyAlert | null {
    // Check if within quiet hours
    if (this.isQuietHours(preferences)) {
      // Queue for later delivery
      return null; // In real implementation, queue instead of dropping
    }

    // Generate alert message
    const { title, message } = this.generateAlertMessage(property, rule.trigger.type);

    // Determine delivery channels
    const channels: PropertyAlert['channels'] = [];
    if (preferences.channels.email) channels.push('email');
    if (preferences.channels.sms) channels.push('sms');
    if (preferences.channels.push) channels.push('push');
    if (preferences.channels.inApp) channels.push('in_app');

    const alert: PropertyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: rule.userId,
      ruleId: rule.id,
      propertyId: property.id,
      propertyAddress: property.address,
      alertType: rule.trigger.type,
      priority: rule.priority,
      title,
      message,
      data: {
        property,
        priceChange: property.previousPrice
          ? Math.round(((property.price - property.previousPrice) / property.previousPrice) * 100)
          : 0,
      },
      channels,
      status: 'pending',
      createdAt: new Date().toISOString(),
      actionUrl: `https://example.com/properties/${property.id}`,
    };

    return alert;
  }

  /**
   * Generates alert message based on type
   */
  private generateAlertMessage(
    property: PropertyData,
    alertType: AlertTrigger['type']
  ): { title: string; message: string } {
    switch (alertType) {
      case 'new_listing':
        return {
          title: 'New Property Listed',
          message: `A new property matching your criteria has been listed: ${property.address} for €${Math.round(property.price).toLocaleString()}`,
        };

      case 'price_decrease': {
        const change = property.previousPrice
          ? Math.round(((property.price - property.previousPrice) / property.previousPrice) * 100)
          : 0;
        return {
          title: 'Price Drop Alert',
          message: `Price reduced by ${Math.abs(change)}% on ${property.address}. Now €${Math.round(property.price).toLocaleString()} (was €${Math.round(property.previousPrice!).toLocaleString()})`,
        };
      }

      case 'price_increase': {
        const change = property.previousPrice
          ? Math.round(((property.price - property.previousPrice) / property.previousPrice) * 100)
          : 0;
        return {
          title: 'Price Increase',
          message: `Price increased by ${change}% on ${property.address}. Now €${Math.round(property.price).toLocaleString()}`,
        };
      }

      case 'status_change':
        return {
          title: 'Status Update',
          message: `${property.address} status changed from ${property.previousStatus} to ${property.status}`,
        };

      case 'back_on_market':
        return {
          title: 'Back on Market!',
          message: `${property.address} is back on the market at €${Math.round(property.price).toLocaleString()}`,
        };

      case 'open_house':
        return {
          title: 'Open House Scheduled',
          message: `Open house scheduled for ${property.address}`,
        };

      default:
        return {
          title: 'Property Update',
          message: `Update for ${property.address}`,
        };
    }
  }

  /**
   * Checks if currently in quiet hours
   */
  private isQuietHours(preferences: AlertPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { startTime, endTime } = preferences.quietHours;

    // Handle quiet hours spanning midnight
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Groups similar alerts into batches
   */
  public groupAlerts(alerts: PropertyAlert[], userId: string): AlertBatch | null {
    if (alerts.length === 0) return null;

    // Group by alert type
    const grouped = new Map<string, PropertyAlert[]>();

    for (const alert of alerts) {
      const key = alert.alertType;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(alert);
    }

    // Generate summary
    const summary = Array.from(grouped.entries())
      .map(([type, items]) => `${items.length} ${type.replace('_', ' ')} alert(s)`)
      .join(', ');

    const batch: AlertBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      alerts,
      summary: `You have ${alerts.length} new alert(s): ${summary}`,
      createdAt: new Date().toISOString(),
    };

    return batch;
  }

  /**
   * Sends an alert through specified channels
   */
  public async sendAlert(
    alert: PropertyAlert,
    channels: Array<'email' | 'sms' | 'push' | 'in_app'>
  ): Promise<AlertDeliveryResult[]> {
    const results: AlertDeliveryResult[] = [];

    for (const channel of channels) {
      try {
        // In real implementation, integrate with actual services:
        // - Email: SendGrid, AWS SES, etc.
        // - SMS: Twilio, etc.
        // - Push: Firebase Cloud Messaging, OneSignal, etc.
        // - In-app: Database notification table

        const result: AlertDeliveryResult = {
          alertId: alert.id,
          channel,
          success: true,
          sentAt: new Date().toISOString(),
        };

        results.push(result);
      } catch (error) {
        results.push({
          alertId: alert.id,
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Marks alert as read
   */
  public markAsRead(alert: PropertyAlert): PropertyAlert {
    return {
      ...alert,
      status: 'read',
      readAt: new Date().toISOString(),
    };
  }

  /**
   * Dismisses an alert
   */
  public dismissAlert(alert: PropertyAlert): PropertyAlert {
    return {
      ...alert,
      status: 'dismissed',
      dismissedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates alert analytics
   */
  public calculateAnalytics(
    userId: string,
    alerts: PropertyAlert[],
    period: AlertAnalytics['period']
  ): AlertAnalytics {
    // Filter alerts by period
    const now = new Date();
    const periodDays = {
      '7_days': 7,
      '30_days': 30,
      '90_days': 90,
      'all_time': 99999,
    };

    const cutoffDate = new Date(now.getTime() - periodDays[period] * 24 * 60 * 60 * 1000);

    const filteredAlerts = alerts.filter(
      (a) => new Date(a.createdAt) >= cutoffDate
    );

    // Count by type
    const byType: Record<string, number> = {};
    filteredAlerts.forEach((alert) => {
      byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
    });

    // Count by priority
    const byPriority: Record<string, number> = {};
    filteredAlerts.forEach((alert) => {
      byPriority[alert.priority] = (byPriority[alert.priority] || 0) + 1;
    });

    // Count by channel (flatten array)
    const byChannel: Record<string, number> = {};
    filteredAlerts.forEach((alert) => {
      alert.channels.forEach((channel) => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
    });

    // Calculate read rate
    const readAlerts = filteredAlerts.filter((a) => a.status === 'read');
    const readRate = filteredAlerts.length > 0 ? (readAlerts.length / filteredAlerts.length) * 100 : 0;

    // Calculate dismiss rate
    const dismissedAlerts = filteredAlerts.filter((a) => a.status === 'dismissed');
    const dismissRate = filteredAlerts.length > 0 ? (dismissedAlerts.length / filteredAlerts.length) * 100 : 0;

    // Calculate average time to read
    const readTimes = readAlerts
      .filter((a) => a.readAt)
      .map((a) => {
        const created = new Date(a.createdAt);
        const read = new Date(a.readAt!);
        return (read.getTime() - created.getTime()) / (1000 * 60); // Minutes
      });

    const averageTimeToRead =
      readTimes.length > 0
        ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
        : 0;

    // Most effective channel (highest read rate)
    const channelReadRates: Record<string, { sent: number; read: number }> = {};

    filteredAlerts.forEach((alert) => {
      alert.channels.forEach((channel) => {
        if (!channelReadRates[channel]) {
          channelReadRates[channel] = { sent: 0, read: 0 };
        }
        channelReadRates[channel].sent++;
        if (alert.status === 'read') {
          channelReadRates[channel].read++;
        }
      });
    });

    let mostEffectiveChannel: AlertAnalytics['mostEffectiveChannel'];
    let highestRate = 0;

    Object.entries(channelReadRates).forEach(([channel, stats]) => {
      const rate = stats.sent > 0 ? stats.read / stats.sent : 0;
      if (rate > highestRate) {
        highestRate = rate;
        mostEffectiveChannel = channel as AlertAnalytics['mostEffectiveChannel'];
      }
    });

    // Top triggers (most frequent rules)
    const ruleCounts = new Map<string, { count: number; name: string }>();
    filteredAlerts.forEach((alert) => {
      const current = ruleCounts.get(alert.ruleId) || { count: 0, name: alert.ruleId };
      ruleCounts.set(alert.ruleId, {
        count: current.count + 1,
        name: current.name,
      });
    });

    const topTriggers = Array.from(ruleCounts.entries())
      .map(([ruleId, data]) => ({
        ruleId,
        ruleName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate insights
    const insights: string[] = [];

    if (filteredAlerts.length > 0) {
      insights.push(`You received ${filteredAlerts.length} alert(s) in the last ${period.replace('_', ' ')}`);
    }

    if (readRate >= 70) {
      insights.push(`High engagement: ${Math.round(readRate)}% of alerts are read`);
    } else if (readRate < 30) {
      insights.push(`Low engagement: Consider adjusting alert frequency or criteria`);
    }

    if (mostEffectiveChannel) {
      insights.push(`${mostEffectiveChannel} is your most effective notification channel`);
    }

    const mostCommonType = Object.entries(byType).reduce((max, [type, count]) =>
      count > max.count ? { type, count } : max
    , { type: '', count: 0 });

    if (mostCommonType.type) {
      insights.push(`Most common alert type: ${mostCommonType.type.replace('_', ' ')} (${mostCommonType.count} alerts)`);
    }

    return {
      userId,
      period,
      totalAlerts: filteredAlerts.length,
      byType,
      byPriority,
      byChannel,
      readRate: Math.round(readRate * 10) / 10,
      dismissRate: Math.round(dismissRate * 10) / 10,
      averageTimeToRead: Math.round(averageTimeToRead),
      mostEffectiveChannel,
      topTriggers,
      insights,
    };
  }

  /**
   * Recommends alert frequency adjustments
   */
  public recommendFrequencyAdjustment(analytics: AlertAnalytics): {
    currentFrequency: string;
    recommendedFrequency: AlertPreferences['frequency'];
    reason: string;
  } | null {
    // If too many alerts with low engagement, suggest reducing frequency
    if (analytics.totalAlerts > 50 && analytics.readRate < 30) {
      return {
        currentFrequency: 'instant',
        recommendedFrequency: 'daily',
        reason: 'High alert volume with low engagement. Daily digest might be more manageable.',
      };
    }

    // If high engagement with instant alerts, keep it
    if (analytics.readRate > 70 && analytics.totalAlerts < 20) {
      return null; // No change needed
    }

    // If very few alerts, instant is fine
    if (analytics.totalAlerts < 5) {
      return null;
    }

    return null;
  }
}
