/**
 * Virtual Tour & AR Manager
 *
 * Comprehensive virtual viewing and augmented reality tools for remote
 * property exploration and visualization.
 *
 * Features:
 * - 360° virtual tour integration
 * - AR furniture placement and room visualization
 * - Virtual staging for empty properties
 * - Measurement and dimension tools
 * - 3D floor plan visualization
 * - Video tour scheduling and recording
 * - Interactive hotspots and annotations
 * - Multi-device support (VR headsets, mobile, web)
 *
 * @module VirtualTourManager
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const VirtualTourSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tourType: z.enum(['360_photo', '3d_scan', 'video_walkthrough', 'drone', 'live_stream']),
  provider: z.enum(['matterport', 'zillow_3d', 'custom', 'youtube', 'vimeo']),
  tourUrl: z.string().url(),
  embedCode: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional().describe('Duration in seconds'),
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    thumbnailUrl: z.string().url().optional(),
    panoramaUrl: z.string().url().optional(),
    hotspots: z.array(z.object({
      id: z.string(),
      type: z.enum(['info', 'measurement', 'feature', 'link', 'media']),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
      }),
      title: z.string(),
      description: z.string().optional(),
      linkedRoomId: z.string().optional(),
      mediaUrl: z.string().url().optional(),
    })).default([]),
  })).default([]),
  features: z.array(z.string()).default([]),
  viewCount: z.number().int().nonnegative().default(0),
  averageViewDuration: z.number().nonnegative().default(0),
  isPublic: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ARVisualizationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  furnitureItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['sofa', 'chair', 'table', 'bed', 'cabinet', 'desk', 'shelving', 'decoration', 'lighting']),
    style: z.enum(['modern', 'traditional', 'minimalist', 'industrial', 'scandinavian', 'rustic']),
    modelUrl: z.string().url().describe('3D model URL (glTF, USDZ)'),
    thumbnailUrl: z.string().url(),
    dimensions: z.object({
      width: z.number().positive().describe('Width in cm'),
      height: z.number().positive().describe('Height in cm'),
      depth: z.number().positive().describe('Depth in cm'),
    }),
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
    scale: z.number().positive().default(1),
    color: z.string().optional(),
    price: z.number().positive().optional(),
    purchaseUrl: z.string().url().optional(),
  })).default([]),
  wallColor: z.string().optional(),
  floorMaterial: z.string().optional(),
  lighting: z.enum(['natural', 'warm', 'cool', 'bright', 'dim']).default('natural'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const VirtualStagingSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomId: z.string(),
  originalPhotoUrl: z.string().url(),
  stagedPhotoUrl: z.string().url(),
  style: z.enum(['modern', 'traditional', 'minimalist', 'luxury', 'family', 'professional']),
  furnitureList: z.array(z.string()),
  estimatedCost: z.number().positive().describe('Cost to physically stage'),
  virtualStagingCost: z.number().positive(),
  roi: z.number().describe('Expected ROI percentage'),
  beforeAfterComparison: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

export const MeasurementToolSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomId: z.string(),
  measurements: z.array(z.object({
    id: z.string(),
    type: z.enum(['length', 'area', 'volume', 'height', 'diagonal']),
    startPoint: z.object({ x: z.number(), y: z.number(), z: z.number().optional() }),
    endPoint: z.object({ x: z.number(), y: z.number(), z: z.number().optional() }),
    value: z.number().positive(),
    unit: z.enum(['cm', 'm', 'ft', 'in', 'sqm', 'sqft', 'cbm', 'cbft']),
    label: z.string().optional(),
    notes: z.string().optional(),
  })).default([]),
  roomDimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    area: z.number().positive(),
    volume: z.number().positive(),
  }).optional(),
  createdAt: z.string().datetime(),
});

export const FloorPlan3DSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  name: z.string(),
  floor: z.number().int().describe('Floor number (0 = ground floor)'),
  modelUrl: z.string().url().describe('3D model URL'),
  textureUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url(),
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['bedroom', 'bathroom', 'kitchen', 'living_room', 'dining_room', 'office', 'hallway', 'closet', 'garage', 'other']),
    area: z.number().positive().describe('Area in square meters'),
    bounds: z.object({
      minX: z.number(),
      minY: z.number(),
      maxX: z.number(),
      maxY: z.number(),
    }),
    color: z.string().optional(),
    furniture: z.array(z.string()).optional(),
  })).default([]),
  totalArea: z.number().positive(),
  scale: z.number().positive().default(1).describe('Meters per unit'),
  cameraPositions: z.array(z.object({
    name: z.string(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  })).default([]),
  createdAt: z.string().datetime(),
});

export const VideoTourSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  duration: z.number().int().positive().describe('Duration in seconds'),
  resolution: z.enum(['720p', '1080p', '4k', '8k']),
  format: z.enum(['mp4', 'webm', 'mov']),
  chapters: z.array(z.object({
    title: z.string(),
    timestamp: z.number().int().nonnegative().describe('Seconds from start'),
    roomName: z.string().optional(),
  })).default([]),
  isLive: z.boolean().default(false),
  scheduledDate: z.string().datetime().optional(),
  hostName: z.string().optional(),
  viewCount: z.number().int().nonnegative().default(0),
  likes: z.number().int().nonnegative().default(0),
  comments: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    comment: z.string(),
    timestamp: z.string().datetime(),
  })).default([]),
  createdAt: z.string().datetime(),
});

export const VirtualTourAnalyticsSchema = z.object({
  propertyId: z.string(),
  period: z.enum(['7_days', '30_days', '90_days', 'all_time']),
  totalViews: z.number().int().nonnegative(),
  uniqueVisitors: z.number().int().nonnegative(),
  averageViewDuration: z.number().nonnegative().describe('Seconds'),
  completionRate: z.number().min(0).max(100).describe('Percentage who completed tour'),
  mostViewedRooms: z.array(z.object({
    roomName: z.string(),
    views: z.number().int().nonnegative(),
  })),
  deviceBreakdown: z.object({
    mobile: z.number().int().nonnegative(),
    tablet: z.number().int().nonnegative(),
    desktop: z.number().int().nonnegative(),
    vr: z.number().int().nonnegative(),
  }),
  conversionRate: z.number().min(0).max(100).describe('Percentage who requested viewing'),
  heatmap: z.array(z.object({
    roomId: z.string(),
    hotspots: z.array(z.object({
      x: z.number(),
      y: z.number(),
      intensity: z.number().min(0).max(100),
    })),
  })).default([]),
  insights: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type VirtualTour = z.infer<typeof VirtualTourSchema>;
export type ARVisualization = z.infer<typeof ARVisualizationSchema>;
export type VirtualStaging = z.infer<typeof VirtualStagingSchema>;
export type MeasurementTool = z.infer<typeof MeasurementToolSchema>;
export type FloorPlan3D = z.infer<typeof FloorPlan3DSchema>;
export type VideoTour = z.infer<typeof VideoTourSchema>;
export type VirtualTourAnalytics = z.infer<typeof VirtualTourAnalyticsSchema>;

// ============================================================================
// Virtual Tour Manager
// ============================================================================

export class VirtualTourManager {
  /**
   * Creates a new virtual tour
   */
  public createVirtualTour(
    propertyId: string,
    tourData: {
      title: string;
      description?: string;
      tourType: VirtualTour['tourType'];
      provider: VirtualTour['provider'];
      tourUrl: string;
      embedCode?: string;
    }
  ): VirtualTour {
    const tour: VirtualTour = {
      id: `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      title: tourData.title,
      description: tourData.description,
      tourType: tourData.tourType,
      provider: tourData.provider,
      tourUrl: tourData.tourUrl,
      embedCode: tourData.embedCode,
      rooms: [],
      features: [],
      viewCount: 0,
      averageViewDuration: 0,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return tour;
  }

  /**
   * Creates AR furniture visualization
   */
  public createARVisualization(
    propertyId: string,
    roomId: string,
    roomName: string
  ): ARVisualization {
    return {
      id: `ar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      roomId,
      roomName,
      furnitureItems: [],
      lighting: 'natural',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Adds furniture item to AR visualization
   */
  public addFurnitureItem(
    visualization: ARVisualization,
    item: ARVisualization['furnitureItems'][number]
  ): ARVisualization {
    return {
      ...visualization,
      furnitureItems: [...visualization.furnitureItems, item],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates furniture layout optimization score
   */
  public calculateLayoutScore(visualization: ARVisualization): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for overcrowding
    const totalFurnitureArea = visualization.furnitureItems.reduce((sum, item) => {
      return sum + (item.dimensions.width * item.dimensions.depth) / 10000; // Convert cm² to m²
    }, 0);

    const roomArea = 20; // Placeholder - would come from room data
    const furnitureDensity = (totalFurnitureArea / roomArea) * 100;

    if (furnitureDensity > 50) {
      score -= 20;
      issues.push('Room appears overcrowded');
      suggestions.push('Consider removing some furniture pieces for better flow');
    } else if (furnitureDensity < 20) {
      score -= 10;
      issues.push('Room appears sparse');
      suggestions.push('Consider adding more furniture to create a cozy atmosphere');
    }

    // Check for blocked pathways
    const hasPathways = this.checkPathways(visualization.furnitureItems);
    if (!hasPathways) {
      score -= 15;
      issues.push('Furniture blocks natural walking paths');
      suggestions.push('Rearrange furniture to create clear pathways');
    }

    // Check style consistency
    const styles = new Set(visualization.furnitureItems.map(item => item.style));
    if (styles.size > 2) {
      score -= 10;
      issues.push('Mixed furniture styles may lack cohesion');
      suggestions.push('Try to stick to 1-2 complementary styles');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Creates virtual staging
   */
  public createVirtualStaging(
    propertyId: string,
    roomId: string,
    originalPhotoUrl: string,
    style: VirtualStaging['style']
  ): VirtualStaging {
    // In real implementation, this would:
    // 1. Upload photo to staging service (AI-powered)
    // 2. Apply selected style
    // 3. Generate staged version
    // 4. Calculate costs and ROI

    const virtualCost = 50; // Per room
    const physicalCost = 1500; // Physical staging per room
    const expectedValueIncrease = 0.05; // 5% value increase

    return {
      id: `staging-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      roomId,
      originalPhotoUrl,
      stagedPhotoUrl: `${originalPhotoUrl}?staged=true`, // Placeholder
      style,
      furnitureList: this.getStagingFurnitureList(style),
      estimatedCost: physicalCost,
      virtualStagingCost: virtualCost,
      roi: expectedValueIncrease * 100,
      beforeAfterComparison: true,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Adds measurement to room
   */
  public addMeasurement(
    propertyId: string,
    roomId: string,
    measurement: MeasurementTool['measurements'][number]
  ): MeasurementTool {
    return {
      id: `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      roomId,
      measurements: [measurement],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates room dimensions from measurements
   */
  public calculateRoomDimensions(
    measurements: MeasurementTool['measurements']
  ): MeasurementTool['roomDimensions'] {
    // Find max dimensions
    const lengths = measurements.filter(m => m.type === 'length');

    if (lengths.length < 2) {
      return undefined;
    }

    const length = Math.max(...lengths.map(m => m.value));
    const width = Math.min(...lengths.map(m => m.value));
    const height = measurements.find(m => m.type === 'height')?.value ?? 2.5;

    return {
      length,
      width,
      height,
      area: length * width,
      volume: length * width * height,
    };
  }

  /**
   * Generates 3D floor plan
   */
  public generate3DFloorPlan(
    propertyId: string,
    floorData: {
      name: string;
      floor: number;
      rooms: FloorPlan3D['rooms'];
    }
  ): FloorPlan3D {
    const totalArea = floorData.rooms.reduce((sum, room) => sum + room.area, 0);

    return {
      id: `floorplan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      name: floorData.name,
      floor: floorData.floor,
      modelUrl: `https://example.com/models/${propertyId}/floor-${floorData.floor}.glb`,
      thumbnailUrl: `https://example.com/thumbnails/${propertyId}/floor-${floorData.floor}.jpg`,
      rooms: floorData.rooms,
      totalArea,
      scale: 1,
      cameraPositions: [
        {
          name: 'Overview',
          position: { x: 0, y: 10, z: 10 },
          target: { x: 0, y: 0, z: 0 },
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Schedules live video tour
   */
  public scheduleLiveVideoTour(
    propertyId: string,
    tourData: {
      title: string;
      description?: string;
      scheduledDate: string;
      hostName: string;
    }
  ): VideoTour {
    return {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      title: tourData.title,
      description: tourData.description,
      videoUrl: '', // Will be generated when live
      thumbnailUrl: '',
      duration: 0,
      resolution: '1080p',
      format: 'mp4',
      chapters: [],
      isLive: true,
      scheduledDate: tourData.scheduledDate,
      hostName: tourData.hostName,
      viewCount: 0,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Analyzes virtual tour performance
   */
  public analyzeVirtualTourPerformance(
    propertyId: string,
    tours: VirtualTour[],
    viewData: Array<{
      tourId: string;
      userId: string;
      duration: number;
      completed: boolean;
      device: 'mobile' | 'tablet' | 'desktop' | 'vr';
      requestedViewing: boolean;
      roomsViewed: string[];
    }>
  ): VirtualTourAnalytics {
    const uniqueVisitors = new Set(viewData.map(v => v.userId)).size;
    const totalViews = viewData.length;
    const averageViewDuration =
      viewData.reduce((sum, v) => sum + v.duration, 0) / Math.max(totalViews, 1);

    const completed = viewData.filter(v => v.completed).length;
    const completionRate = (completed / Math.max(totalViews, 1)) * 100;

    // Room view counts
    const roomViewCounts = new Map<string, number>();
    viewData.forEach(view => {
      view.roomsViewed.forEach(roomId => {
        roomViewCounts.set(roomId, (roomViewCounts.get(roomId) || 0) + 1);
      });
    });

    const mostViewedRooms = Array.from(roomViewCounts.entries())
      .map(([roomName, views]) => ({ roomName, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Device breakdown
    const deviceBreakdown = {
      mobile: viewData.filter(v => v.device === 'mobile').length,
      tablet: viewData.filter(v => v.device === 'tablet').length,
      desktop: viewData.filter(v => v.device === 'desktop').length,
      vr: viewData.filter(v => v.device === 'vr').length,
    };

    const requestedViewing = viewData.filter(v => v.requestedViewing).length;
    const conversionRate = (requestedViewing / Math.max(totalViews, 1)) * 100;

    // Generate insights
    const insights: string[] = [];

    insights.push(`Virtual tour has been viewed ${totalViews} times by ${uniqueVisitors} unique visitors`);

    if (completionRate >= 70) {
      insights.push(`Excellent completion rate of ${Math.round(completionRate)}% - tour is engaging`);
    } else if (completionRate < 40) {
      insights.push(`Low completion rate of ${Math.round(completionRate)}% - consider shortening tour or improving quality`);
    }

    if (conversionRate >= 20) {
      insights.push(`Strong ${Math.round(conversionRate)}% conversion to viewing requests`);
    }

    const topDevice = Object.entries(deviceBreakdown).reduce((max, [device, count]) =>
      count > max.count ? { device, count } : max
    , { device: '', count: 0 });

    insights.push(`Most views from ${topDevice.device} devices (${topDevice.count} views)`);

    if (mostViewedRooms.length > 0) {
      insights.push(`Most popular room: ${mostViewedRooms[0].roomName} (${mostViewedRooms[0].views} views)`);
    }

    return {
      propertyId,
      period: '30_days',
      totalViews,
      uniqueVisitors,
      averageViewDuration: Math.round(averageViewDuration),
      completionRate: Math.round(completionRate * 10) / 10,
      mostViewedRooms,
      deviceBreakdown,
      conversionRate: Math.round(conversionRate * 10) / 10,
      heatmap: [],
      insights,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private checkPathways(furniture: ARVisualization['furnitureItems']): boolean {
    // Simplified pathway check
    // In real implementation, would use spatial analysis
    return furniture.length < 10; // Placeholder logic
  }

  private getStagingFurnitureList(style: VirtualStaging['style']): string[] {
    const furnitureByStyle: Record<VirtualStaging['style'], string[]> = {
      modern: ['Sectional sofa', 'Glass coffee table', 'Abstract art', 'Floor lamp', 'Area rug'],
      traditional: ['Leather sofa', 'Wooden coffee table', 'Classic paintings', 'Table lamps', 'Persian rug'],
      minimalist: ['Low-profile sofa', 'Simple coffee table', 'Single artwork', 'Pendant light', 'Neutral rug'],
      luxury: ['Designer sofa', 'Marble coffee table', 'Statement art', 'Chandelier', 'Silk rug'],
      family: ['Comfortable sectional', 'Durable coffee table', 'Family photos', 'Practical lighting', 'Washable rug'],
      professional: ['Executive desk', 'Ergonomic chair', 'Bookshelf', 'Desk lamp', 'Professional art'],
    };

    return furnitureByStyle[style];
  }

  /**
   * Recommends virtual tour improvements
   */
  public recommendImprovements(analytics: VirtualTourAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.completionRate < 50) {
      recommendations.push('Consider reducing tour length - completion rate is low');
    }

    if (analytics.conversionRate < 10) {
      recommendations.push('Add clearer call-to-action buttons to request viewings');
    }

    if (analytics.deviceBreakdown.mobile > analytics.totalViews * 0.6) {
      recommendations.push('Optimize for mobile - majority of viewers use mobile devices');
    }

    if (analytics.averageViewDuration < 60) {
      recommendations.push('Tour may need more engaging content - average view time is under 1 minute');
    }

    return recommendations;
  }
}
