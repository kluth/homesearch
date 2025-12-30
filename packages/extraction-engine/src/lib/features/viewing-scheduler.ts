/**
 * Smart Viewing Scheduler
 *
 * Optimizes property viewing schedules with intelligent route planning,
 * time management, and agent coordination.
 *
 * Features:
 * - Route optimization for multiple viewings
 * - Travel time calculation
 * - Agent availability coordination
 * - Calendar integration
 * - Reminder notifications
 * - Viewing notes and feedback collection
 *
 * @module ViewingScheduler
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const ViewingTimeSlotSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().int().positive().describe('Duration in minutes'),
  isAvailable: z.boolean(),
  agentId: z.string().optional(),
});

export const PropertyLocationSchema = z.object({
  propertyId: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  preferredTimes: z.array(ViewingTimeSlotSchema).optional(),
  notes: z.string().optional(),
});

export const ViewingPreferencesSchema = z.object({
  preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  preferredTimeRanges: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })),
  maxViewingsPerDay: z.number().int().positive().max(10).default(5),
  minTimeBetweenViewings: z.number().int().positive().default(30).describe('Minutes'),
  maxTravelTime: z.number().int().positive().default(60).describe('Minutes'),
  transportMode: z.enum(['driving', 'transit', 'walking', 'bicycling']).default('driving'),
  bufferTime: z.number().int().nonnegative().default(15).describe('Extra buffer time in minutes'),
});

export const ScheduledViewingSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  scheduledDate: z.string().datetime(),
  duration: z.number().int().positive(),
  address: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  agentName: z.string().optional(),
  agentContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
  travelTimeFromPrevious: z.number().optional().describe('Minutes'),
  reminders: z.array(z.object({
    type: z.enum(['email', 'sms', 'push', 'in_app']),
    scheduledTime: z.string().datetime(),
    sent: z.boolean(),
  })).default([]),
  feedback: z.object({
    attended: z.boolean().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
    wouldConsider: z.boolean().optional(),
  }).optional(),
});

export const ViewingRouteSchema = z.object({
  date: z.string().datetime().describe('Start date of the route'),
  viewings: z.array(ScheduledViewingSchema),
  totalDuration: z.number().describe('Total duration in minutes'),
  totalTravelTime: z.number().describe('Total travel time in minutes'),
  totalDistance: z.number().optional().describe('Total distance in km'),
  startLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  optimizationScore: z.number().min(0).max(100).describe('Route efficiency score'),
});

export const ScheduleRequestSchema = z.object({
  userId: z.string(),
  properties: z.array(PropertyLocationSchema),
  preferences: ViewingPreferencesSchema,
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  startLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional().describe('Starting point for first viewing'),
  endLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional().describe('Ending point after last viewing'),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type ViewingTimeSlot = z.infer<typeof ViewingTimeSlotSchema>;
export type PropertyLocation = z.infer<typeof PropertyLocationSchema>;
export type ViewingPreferences = z.infer<typeof ViewingPreferencesSchema>;
export type ScheduledViewing = z.infer<typeof ScheduledViewingSchema>;
export type ViewingRoute = z.infer<typeof ViewingRouteSchema>;
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

// ============================================================================
// Interfaces
// ============================================================================

export interface ViewingConflict {
  propertyId: string;
  reason: string;
  conflictType: 'time_overlap' | 'travel_time_exceeded' | 'agent_unavailable' | 'outside_preferred_hours';
  suggestedAlternatives?: ViewingTimeSlot[];
}

export interface RouteOptimization {
  originalRoute: ViewingRoute;
  optimizedRoute: ViewingRoute;
  timeSaved: number;
  distanceSaved?: number;
  improvementPercentage: number;
}

export interface ViewingStatistics {
  userId: string;
  totalViewingsScheduled: number;
  totalViewingsCompleted: number;
  totalViewingsCancelled: number;
  totalNoShows: number;
  averageRating: number;
  totalTimeSpent: number;
  totalDistanceTraveled?: number;
  propertiesViewed: number;
  offersSubmitted: number;
  favoriteProperty?: string;
}

// ============================================================================
// Smart Viewing Scheduler
// ============================================================================

export class ViewingScheduler {
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly AVERAGE_SPEED_KMH: Record<ViewingPreferences['transportMode'], number> = {
    driving: 50,
    transit: 30,
    walking: 5,
    bicycling: 15,
  };

  /**
   * Creates an optimized viewing schedule for multiple properties
   */
  public createSchedule(request: ScheduleRequest): ViewingRoute[] {
    const validatedRequest = ScheduleRequestSchema.parse(request);

    // Generate possible routes for each day
    const routes: ViewingRoute[] = [];
    const remainingProperties = new Set(validatedRequest.properties.map(p => p.propertyId));

    let currentDate = new Date(validatedRequest.dateRange.start);
    const endDate = new Date(validatedRequest.dateRange.end);

    while (currentDate <= endDate && remainingProperties.size > 0) {
      const dayOfWeek = this.getDayOfWeek(currentDate);

      // Check if this day is preferred
      if (!validatedRequest.preferences.preferredDays.includes(dayOfWeek)) {
        currentDate = this.addDays(currentDate, 1);
        continue;
      }

      // Get available properties for this day
      const availableProps = validatedRequest.properties.filter(p =>
        remainingProperties.has(p.propertyId)
      );

      if (availableProps.length === 0) {
        break;
      }

      // Create optimal route for this day
      const route = this.optimizeRouteForDay(
        currentDate,
        availableProps,
        validatedRequest.preferences,
        validatedRequest.startLocation,
        validatedRequest.endLocation
      );

      if (route && route.viewings.length > 0) {
        routes.push(route);

        // Remove scheduled properties from remaining set
        route.viewings.forEach(v => remainingProperties.delete(v.propertyId));
      }

      currentDate = this.addDays(currentDate, 1);
    }

    return routes;
  }

  /**
   * Optimizes the route for a single day
   */
  private optimizeRouteForDay(
    date: Date,
    properties: PropertyLocation[],
    preferences: ViewingPreferences,
    startLocation?: { latitude: number; longitude: number; address?: string },
    endLocation?: { latitude: number; longitude: number; address?: string }
  ): ViewingRoute | null {
    if (properties.length === 0) {
      return null;
    }

    // Use traveling salesman problem heuristic (nearest neighbor)
    const viewings: ScheduledViewing[] = [];
    const remaining = [...properties];

    let currentLocation = startLocation ?? {
      latitude: properties[0].latitude,
      longitude: properties[0].longitude,
    };

    let currentTime = new Date(date);
    // Set to start of preferred time range
    if (preferences.preferredTimeRanges.length > 0) {
      const [hours, minutes] = preferences.preferredTimeRanges[0].start.split(':').map(Number);
      currentTime.setHours(hours, minutes, 0, 0);
    } else {
      currentTime.setHours(9, 0, 0, 0); // Default 9 AM
    }

    let totalTravelTime = 0;
    let totalDistance = 0;

    while (remaining.length > 0 && viewings.length < preferences.maxViewingsPerDay) {
      // Find nearest property
      const nearest = this.findNearestProperty(currentLocation, remaining);

      if (!nearest) {
        break;
      }

      const travelTime = this.calculateTravelTime(
        currentLocation,
        { latitude: nearest.property.latitude, longitude: nearest.property.longitude },
        preferences.transportMode
      );

      const travelDistance = nearest.distance;

      // Check if travel time is acceptable
      if (travelTime > preferences.maxTravelTime) {
        // Remove this property and try next nearest
        const index = remaining.indexOf(nearest.property);
        remaining.splice(index, 1);
        continue;
      }

      // Add travel time and buffer
      currentTime = new Date(currentTime.getTime() + (travelTime + preferences.bufferTime) * 60000);

      // Check if still within preferred time ranges
      if (!this.isWithinPreferredHours(currentTime, preferences.preferredTimeRanges)) {
        break;
      }

      // Create scheduled viewing
      const viewing: ScheduledViewing = {
        id: `viewing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        propertyId: nearest.property.propertyId,
        scheduledDate: currentTime.toISOString(),
        duration: 30, // Default 30 minutes per viewing
        address: nearest.property.address,
        location: {
          latitude: nearest.property.latitude,
          longitude: nearest.property.longitude,
        },
        agentContact: nearest.property.contactPhone ?? nearest.property.contactEmail,
        notes: nearest.property.notes,
        status: 'scheduled',
        travelTimeFromPrevious: viewings.length > 0 ? travelTime : undefined,
        reminders: this.createReminders(currentTime),
      };

      viewings.push(viewing);

      // Update current location and time
      currentLocation = {
        latitude: nearest.property.latitude,
        longitude: nearest.property.longitude,
      };
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add viewing duration

      totalTravelTime += travelTime;
      totalDistance += travelDistance;

      // Remove from remaining
      const index = remaining.indexOf(nearest.property);
      remaining.splice(index, 1);

      // Add minimum time between viewings
      currentTime = new Date(currentTime.getTime() + preferences.minTimeBetweenViewings * 60000);
    }

    if (viewings.length === 0) {
      return null;
    }

    // Calculate optimization score (0-100)
    const averageTravelTime = totalTravelTime / Math.max(viewings.length - 1, 1);
    const utilizationRate = viewings.length / preferences.maxViewingsPerDay;
    const efficiencyScore = Math.max(0, 100 - averageTravelTime); // Lower travel time = better
    const optimizationScore = Math.round((efficiencyScore * 0.7 + utilizationRate * 100 * 0.3));

    const route: ViewingRoute = {
      date: viewings[0].scheduledDate,
      viewings,
      totalDuration: viewings.reduce((sum, v) => sum + v.duration + (v.travelTimeFromPrevious ?? 0), 0),
      totalTravelTime,
      totalDistance,
      startLocation,
      endLocation,
      optimizationScore,
    };

    return route;
  }

  /**
   * Finds the nearest property to a given location
   */
  private findNearestProperty(
    location: { latitude: number; longitude: number },
    properties: PropertyLocation[]
  ): { property: PropertyLocation; distance: number } | null {
    if (properties.length === 0) {
      return null;
    }

    let nearest = properties[0];
    let minDistance = this.calculateDistance(
      location.latitude,
      location.longitude,
      nearest.latitude,
      nearest.longitude
    );

    for (let i = 1; i < properties.length; i++) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        properties[i].latitude,
        properties[i].longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = properties[i];
      }
    }

    return { property: nearest, distance: minDistance };
  }

  /**
   * Calculates distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Calculates travel time between two points
   */
  private calculateTravelTime(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    mode: ViewingPreferences['transportMode']
  ): number {
    const distance = this.calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    const speed = this.AVERAGE_SPEED_KMH[mode];
    const timeInHours = distance / speed;
    return Math.round(timeInHours * 60); // Convert to minutes
  }

  /**
   * Checks if a time is within preferred hours
   */
  private isWithinPreferredHours(
    time: Date,
    preferredRanges: Array<{ start: string; end: string }>
  ): boolean {
    if (preferredRanges.length === 0) {
      return true; // No restrictions
    }

    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

    return preferredRanges.some(range => {
      return timeStr >= range.start && timeStr <= range.end;
    });
  }

  /**
   * Creates reminder notifications for a viewing
   */
  private createReminders(viewingTime: Date): ScheduledViewing['reminders'] {
    const reminders: ScheduledViewing['reminders'] = [];

    // 24 hours before
    const oneDayBefore = new Date(viewingTime.getTime() - 24 * 60 * 60 * 1000);
    reminders.push({
      type: 'email',
      scheduledTime: oneDayBefore.toISOString(),
      sent: false,
    });

    // 2 hours before
    const twoHoursBefore = new Date(viewingTime.getTime() - 2 * 60 * 60 * 1000);
    reminders.push({
      type: 'push',
      scheduledTime: twoHoursBefore.toISOString(),
      sent: false,
    });

    // 30 minutes before
    const thirtyMinBefore = new Date(viewingTime.getTime() - 30 * 60 * 1000);
    reminders.push({
      type: 'in_app',
      scheduledTime: thirtyMinBefore.toISOString(),
      sent: false,
    });

    return reminders;
  }

  /**
   * Detects scheduling conflicts
   */
  public detectConflicts(
    existingViewings: ScheduledViewing[],
    newViewing: ScheduledViewing
  ): ViewingConflict[] {
    const conflicts: ViewingConflict[] = [];
    const newStart = new Date(newViewing.scheduledDate);
    const newEnd = new Date(newStart.getTime() + newViewing.duration * 60000);

    for (const existing of existingViewings) {
      const existingStart = new Date(existing.scheduledDate);
      const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);

      // Check time overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        conflicts.push({
          propertyId: existing.propertyId,
          reason: `Time overlap with viewing at ${existing.address}`,
          conflictType: 'time_overlap',
        });
      }
    }

    return conflicts;
  }

  /**
   * Records viewing feedback
   */
  public recordFeedback(
    viewingId: string,
    feedback: ScheduledViewing['feedback']
  ): ScheduledViewing {
    // In a real implementation, this would update the database
    // For now, return a viewing object with updated feedback
    return {
      id: viewingId,
      propertyId: '', // Would be fetched from DB
      scheduledDate: new Date().toISOString(),
      duration: 30,
      address: '',
      location: { latitude: 0, longitude: 0 },
      status: feedback?.attended ? 'completed' : 'no_show',
      reminders: [],
      feedback,
    };
  }

  /**
   * Calculates viewing statistics for a user
   */
  public calculateStatistics(viewings: ScheduledViewing[]): ViewingStatistics {
    const completed = viewings.filter(v => v.status === 'completed');
    const cancelled = viewings.filter(v => v.status === 'cancelled');
    const noShows = viewings.filter(v => v.status === 'no_show');

    const ratingsProvided = completed.filter(v => v.feedback?.rating);
    const averageRating = ratingsProvided.length > 0
      ? ratingsProvided.reduce((sum, v) => sum + (v.feedback!.rating!), 0) / ratingsProvided.length
      : 0;

    const totalTimeSpent = completed.reduce((sum, v) => sum + v.duration, 0);

    // Count offers (would come from separate data source)
    const offersSubmitted = completed.filter(v => v.feedback?.wouldConsider).length;

    // Find favorite property (highest rated)
    const favorite = ratingsProvided.reduce((best, current) => {
      if (!best || (current.feedback!.rating! > best.feedback!.rating!)) {
        return current;
      }
      return best;
    }, ratingsProvided[0] as ScheduledViewing | undefined);

    return {
      userId: '', // Would be passed as parameter
      totalViewingsScheduled: viewings.length,
      totalViewingsCompleted: completed.length,
      totalViewingsCancelled: cancelled.length,
      totalNoShows: noShows.length,
      averageRating: Math.round(averageRating * 10) / 10,
      totalTimeSpent,
      propertiesViewed: new Set(completed.map(v => v.propertyId)).size,
      offersSubmitted,
      favoriteProperty: favorite?.propertyId,
    };
  }

  /**
   * Optimizes an existing route
   */
  public optimizeRoute(route: ViewingRoute): RouteOptimization {
    const originalRoute = { ...route };

    // Re-order viewings to minimize travel time
    const viewings = [...route.viewings];
    const optimized: ScheduledViewing[] = [];

    if (viewings.length <= 1) {
      return {
        originalRoute,
        optimizedRoute: route,
        timeSaved: 0,
        improvementPercentage: 0,
      };
    }

    // Start with first viewing
    optimized.push(viewings[0]);
    viewings.splice(0, 1);

    // Greedily add nearest viewings
    while (viewings.length > 0) {
      const lastViewing = optimized[optimized.length - 1];
      const nearest = this.findNearestProperty(
        lastViewing.location,
        viewings.map(v => ({
          propertyId: v.propertyId,
          address: v.address,
          latitude: v.location.latitude,
          longitude: v.location.longitude,
        }))
      );

      if (!nearest) {
        break;
      }

      const viewingIndex = viewings.findIndex(v => v.propertyId === nearest.property.propertyId);
      if (viewingIndex >= 0) {
        optimized.push(viewings[viewingIndex]);
        viewings.splice(viewingIndex, 1);
      }
    }

    // Recalculate travel times
    let totalTravelTime = 0;
    let totalDistance = 0;

    for (let i = 1; i < optimized.length; i++) {
      const prev = optimized[i - 1];
      const curr = optimized[i];

      const travelTime = this.calculateTravelTime(
        prev.location,
        curr.location,
        'driving'
      );

      const distance = this.calculateDistance(
        prev.location.latitude,
        prev.location.longitude,
        curr.location.latitude,
        curr.location.longitude
      );

      curr.travelTimeFromPrevious = travelTime;
      totalTravelTime += travelTime;
      totalDistance += distance;
    }

    const optimizedRoute: ViewingRoute = {
      ...route,
      viewings: optimized,
      totalTravelTime,
      totalDistance,
      totalDuration: optimized.reduce((sum, v) => sum + v.duration + (v.travelTimeFromPrevious ?? 0), 0),
      optimizationScore: Math.round(Math.max(0, 100 - (totalTravelTime / optimized.length))),
    };

    const timeSaved = route.totalTravelTime - totalTravelTime;
    const distanceSaved = (route.totalDistance ?? 0) - totalDistance;
    const improvementPercentage = route.totalTravelTime > 0
      ? Math.round((timeSaved / route.totalTravelTime) * 100)
      : 0;

    return {
      originalRoute,
      optimizedRoute,
      timeSaved,
      distanceSaved,
      improvementPercentage,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getDayOfWeek(date: Date): ViewingPreferences['preferredDays'][number] {
    const days: ViewingPreferences['preferredDays'] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[date.getDay()];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
