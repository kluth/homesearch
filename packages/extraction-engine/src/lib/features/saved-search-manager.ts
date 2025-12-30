/**
 * Saved Search & Smart Alerts System
 * Monitors criteria and notifies users of new matching properties
 */

import type { UnifiedHouseModel } from '@house-finder/domain';
import type { UserPreferences } from '../ai/recommendation-engine.js';

/**
 * Saved search configuration
 */
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  description?: string;
  preferences: UserPreferences;
  alertFrequency: AlertFrequency;
  enabled: boolean;
  createdAt: Date;
  lastChecked?: Date;
  lastAlertSent?: Date;
  matchCount: number;
  notificationChannels: NotificationChannel[];
}

export enum AlertFrequency {
  INSTANT = 'instant', // Immediately on new match
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never', // Save search but no alerts
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

/**
 * Alert notification
 */
export interface SearchAlert {
  id: string;
  savedSearchId: string;
  userId: string;
  properties: UnifiedHouseModel[];
  sentAt: Date;
  channel: NotificationChannel;
  read: boolean;
  clicked: boolean;
}

/**
 * Alert digest (for batched alerts)
 */
export interface AlertDigest {
  userId: string;
  savedSearches: Array<{
    search: SavedSearch;
    newMatches: UnifiedHouseModel[];
    totalMatches: number;
  }>;
  period: string; // "last hour", "today", "this week"
  generatedAt: Date;
}

/**
 * Saved Search Manager
 */
export class SavedSearchManager {
  private savedSearches: Map<string, SavedSearch> = new Map();
  private alerts: Map<string, SearchAlert[]> = new Map();
  private lastCheckedProperties: Map<string, Set<string>> = new Map(); // searchId -> property IDs

  /**
   * Create a new saved search
   */
  public createSavedSearch(config: Omit<SavedSearch, 'id' | 'createdAt' | 'matchCount'>): SavedSearch {
    const search: SavedSearch = {
      ...config,
      id: this.generateId('search'),
      createdAt: new Date(),
      matchCount: 0,
    };

    this.savedSearches.set(search.id, search);
    this.lastCheckedProperties.set(search.id, new Set());

    return search;
  }

  /**
   * Update saved search
   */
  public updateSavedSearch(
    searchId: string,
    updates: Partial<Omit<SavedSearch, 'id' | 'userId' | 'createdAt'>>
  ): SavedSearch | null {
    const search = this.savedSearches.get(searchId);
    if (search == null) return null;

    const updated = { ...search, ...updates };
    this.savedSearches.set(searchId, updated);

    return updated;
  }

  /**
   * Delete saved search
   */
  public deleteSavedSearch(searchId: string): boolean {
    const deleted = this.savedSearches.delete(searchId);
    if (deleted) {
      this.lastCheckedProperties.delete(searchId);
      this.alerts.delete(searchId);
    }
    return deleted;
  }

  /**
   * Get all saved searches for a user
   */
  public getUserSavedSearches(userId: string): SavedSearch[] {
    return Array.from(this.savedSearches.values()).filter(
      (search) => search.userId === userId
    );
  }

  /**
   * Check for new matches and send alerts
   */
  public async checkForNewMatches(
    searchId: string,
    availableProperties: UnifiedHouseModel[]
  ): Promise<UnifiedHouseModel[]> {
    const search = this.savedSearches.get(searchId);
    if (search == null || !search.enabled) return [];

    // Filter properties by preferences
    const matches = this.filterByPreferences(availableProperties, search.preferences);

    // Get previously seen property IDs
    const seenIds = this.lastCheckedProperties.get(searchId) ?? new Set();

    // Find new matches (not seen before)
    const newMatches = matches.filter((prop) => !seenIds.has(prop.id));

    // Update seen properties
    matches.forEach((prop) => seenIds.add(prop.id));
    this.lastCheckedProperties.set(searchId, seenIds);

    // Update match count
    search.matchCount = matches.length;
    search.lastChecked = new Date();

    // Send alerts if there are new matches
    if (newMatches.length > 0 && this.shouldSendAlert(search)) {
      await this.sendAlerts(search, newMatches);
      search.lastAlertSent = new Date();
    }

    return newMatches;
  }

  /**
   * Check all saved searches for a user
   */
  public async checkAllUserSearches(
    userId: string,
    availableProperties: UnifiedHouseModel[]
  ): Promise<Map<string, UnifiedHouseModel[]>> {
    const userSearches = this.getUserSavedSearches(userId);
    const results = new Map<string, UnifiedHouseModel[]>();

    for (const search of userSearches) {
      const newMatches = await this.checkForNewMatches(search.id, availableProperties);
      if (newMatches.length > 0) {
        results.set(search.id, newMatches);
      }
    }

    return results;
  }

  /**
   * Generate alert digest (for batched alerts)
   */
  public async generateDigest(
    userId: string,
    availableProperties: UnifiedHouseModel[],
    period: string
  ): Promise<AlertDigest> {
    const userSearches = this.getUserSavedSearches(userId);
    const searchResults: AlertDigest['savedSearches'] = [];

    for (const search of userSearches) {
      if (!search.enabled) continue;

      const matches = this.filterByPreferences(availableProperties, search.preferences);
      const seenIds = this.lastCheckedProperties.get(search.id) ?? new Set();
      const newMatches = matches.filter((prop) => !seenIds.has(prop.id));

      if (newMatches.length > 0) {
        searchResults.push({
          search,
          newMatches,
          totalMatches: matches.length,
        });

        // Mark as seen
        newMatches.forEach((prop) => seenIds.add(prop.id));
        this.lastCheckedProperties.set(search.id, seenIds);
      }
    }

    return {
      userId,
      savedSearches: searchResults,
      period,
      generatedAt: new Date(),
    };
  }

  /**
   * Get unread alerts for user
   */
  public getUnreadAlerts(userId: string): SearchAlert[] {
    const allAlerts: SearchAlert[] = [];

    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts.filter((alert) => alert.userId === userId && !alert.read));
    }

    return allAlerts.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  /**
   * Mark alert as read
   */
  public markAlertRead(alertId: string): boolean {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert != null) {
        alert.read = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Mark alert as clicked
   */
  public markAlertClicked(alertId: string): boolean {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert != null) {
        alert.clicked = true;
        alert.read = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Get alert statistics for a saved search
   */
  public getAlertStats(searchId: string): {
    totalAlerts: number;
    readRate: number;
    clickRate: number;
    averageMatchesPerAlert: number;
  } {
    const searchAlerts = this.alerts.get(searchId) ?? [];

    if (searchAlerts.length === 0) {
      return {
        totalAlerts: 0,
        readRate: 0,
        clickRate: 0,
        averageMatchesPerAlert: 0,
      };
    }

    const readCount = searchAlerts.filter((a) => a.read).length;
    const clickCount = searchAlerts.filter((a) => a.clicked).length;
    const totalMatches = searchAlerts.reduce((sum, a) => sum + a.properties.length, 0);

    return {
      totalAlerts: searchAlerts.length,
      readRate: (readCount / searchAlerts.length) * 100,
      clickRate: (clickCount / searchAlerts.length) * 100,
      averageMatchesPerAlert: totalMatches / searchAlerts.length,
    };
  }

  /**
   * Smart alert frequency adjustment
   * Adjusts frequency based on user engagement
   */
  public adjustAlertFrequency(searchId: string): AlertFrequency | null {
    const stats = this.getAlertStats(searchId);

    // If low engagement, reduce frequency
    if (stats.totalAlerts > 5) {
      if (stats.clickRate < 10) {
        return AlertFrequency.WEEKLY; // Very low engagement
      } else if (stats.clickRate < 30) {
        return AlertFrequency.DAILY; // Low engagement
      } else if (stats.clickRate > 70) {
        return AlertFrequency.INSTANT; // High engagement
      }
    }

    return null; // No change needed
  }

  /**
   * Get search recommendations (suggest new searches)
   */
  public getSuggestedSearches(
    userId: string,
    existingSearches: SavedSearch[]
  ): Array<{ name: string; preferences: Partial<UserPreferences>; reason: string }> {
    const suggestions: Array<{ name: string; preferences: Partial<UserPreferences>; reason: string }> = [];

    // If user has a search in one city, suggest nearby cities
    const cities = new Set(
      existingSearches.flatMap((s) => s.preferences.preferredCities ?? [])
    );

    const nearbyMapping: Record<string, string[]> = {
      Berlin: ['Potsdam', 'Dresden'],
      Munich: ['Augsburg', 'Nuremberg'],
      Hamburg: ['Bremen', 'Kiel'],
      Frankfurt: ['Mainz', 'Wiesbaden'],
    };

    for (const city of cities) {
      const nearby = nearbyMapping[city];
      if (nearby != null) {
        for (const nearbyCity of nearby) {
          suggestions.push({
            name: `Properties in ${nearbyCity}`,
            preferences: {
              preferredCities: [nearbyCity],
              budgetMax: existingSearches[0]?.preferences.budgetMax,
            },
            reason: `Similar to your search in ${city}`,
          });
        }
      }
    }

    // Suggest budget variations (±20%)
    const budgets = existingSearches
      .map((s) => s.preferences.budgetMax)
      .filter((b): b is number => b != null);

    if (budgets.length > 0) {
      const avgBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;

      suggestions.push({
        name: 'Better value options',
        preferences: {
          budgetMax: Math.round(avgBudget * 0.8),
          preferredCities: Array.from(cities),
        },
        reason: 'Find great deals below your usual budget',
      });

      suggestions.push({
        name: 'Premium options',
        preferences: {
          budgetMin: Math.round(avgBudget),
          budgetMax: Math.round(avgBudget * 1.3),
          preferredCities: Array.from(cities),
        },
        reason: 'Explore higher-end properties',
      });
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Filter properties by preferences
   */
  private filterByPreferences(
    properties: UnifiedHouseModel[],
    preferences: UserPreferences
  ): UnifiedHouseModel[] {
    return properties.filter((property) => {
      // Budget
      if (preferences.budgetMin != null && property.price < preferences.budgetMin) {
        return false;
      }
      if (preferences.budgetMax != null && property.price > preferences.budgetMax) {
        return false;
      }

      // Cities
      if (
        preferences.preferredCities != null &&
        preferences.preferredCities.length > 0 &&
        property.location.city != null
      ) {
        const match = preferences.preferredCities.some(
          (city) => city.toLowerCase() === property.location.city?.toLowerCase()
        );
        if (!match) return false;
      }

      // Rooms
      if (preferences.minRooms != null && property.details?.totalRooms != null) {
        if (property.details?.totalRooms < preferences.minRooms) return false;
      }
      if (preferences.maxRooms != null && property.details?.totalRooms != null) {
        if (property.details?.totalRooms > preferences.maxRooms) return false;
      }

      // Area
      if (preferences.minArea != null && property.details?.livingArea != null) {
        if (property.details?.livingArea < preferences.minArea) return false;
      }
      if (preferences.maxArea != null && property.details?.livingArea != null) {
        if (property.details?.livingArea > preferences.maxArea) return false;
      }

      return true;
    });
  }

  /**
   * Check if alert should be sent based on frequency
   */
  private shouldSendAlert(search: SavedSearch): boolean {
    if (search.alertFrequency === AlertFrequency.NEVER) return false;

    const now = Date.now();
    const lastAlert = search.lastAlertSent?.getTime() ?? 0;
    const timeSinceLastAlert = now - lastAlert;

    switch (search.alertFrequency) {
      case AlertFrequency.INSTANT:
        return true;
      case AlertFrequency.HOURLY:
        return timeSinceLastAlert > 60 * 60 * 1000; // 1 hour
      case AlertFrequency.DAILY:
        return timeSinceLastAlert > 24 * 60 * 60 * 1000; // 24 hours
      case AlertFrequency.WEEKLY:
        return timeSinceLastAlert > 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return false;
    }
  }

  /**
   * Send alerts through configured channels
   */
  private async sendAlerts(
    search: SavedSearch,
    newMatches: UnifiedHouseModel[]
  ): Promise<void> {
    for (const channel of search.notificationChannels) {
      const alert: SearchAlert = {
        id: this.generateId('alert'),
        savedSearchId: search.id,
        userId: search.userId,
        properties: newMatches,
        sentAt: new Date(),
        channel,
        read: false,
        clicked: false,
      };

      // Store alert
      const searchAlerts = this.alerts.get(search.id) ?? [];
      searchAlerts.push(alert);
      this.alerts.set(search.id, searchAlerts);

      // Send notification (implementation depends on channel)
      await this.sendNotification(alert, search, channel);
    }
  }

  /**
   * Send notification via channel
   */
  private async sendNotification(
    alert: SearchAlert,
    search: SavedSearch,
    channel: NotificationChannel
  ): Promise<void> {
    // Placeholder - in production, integrate with email/push services
    console.log(
      `Sending ${channel} notification for search "${search.name}" with ${alert.properties.length} new matches`
    );

    switch (channel) {
      case NotificationChannel.EMAIL:
        // await emailService.send(...)
        break;
      case NotificationChannel.PUSH:
        // await pushService.send(...)
        break;
      case NotificationChannel.SMS:
        // await smsService.send(...)
        break;
      case NotificationChannel.IN_APP:
        // Store in in-app notification queue
        break;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Export saved searches (for backup/migration)
   */
  public exportUserData(userId: string): {
    searches: SavedSearch[];
    alerts: SearchAlert[];
  } {
    const searches = this.getUserSavedSearches(userId);
    const alerts = Array.from(this.alerts.values())
      .flat()
      .filter((alert) => alert.userId === userId);

    return { searches, alerts };
  }

  /**
   * Import saved searches (for backup/migration)
   */
  public importUserData(data: {
    searches: SavedSearch[];
    alerts: SearchAlert[];
  }): void {
    for (const search of data.searches) {
      this.savedSearches.set(search.id, search);
    }

    for (const alert of data.alerts) {
      const searchAlerts = this.alerts.get(alert.savedSearchId) ?? [];
      searchAlerts.push(alert);
      this.alerts.set(alert.savedSearchId, searchAlerts);
    }
  }

  /**
   * Clear old alerts (cleanup)
   */
  public clearOldAlerts(daysOld: number = 30): number {
    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let clearedCount = 0;

    for (const [searchId, alerts] of this.alerts.entries()) {
      const filtered = alerts.filter((alert) => alert.sentAt.getTime() > cutoffDate);
      clearedCount += alerts.length - filtered.length;
      this.alerts.set(searchId, filtered);
    }

    return clearedCount;
  }
}
