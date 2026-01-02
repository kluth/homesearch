/**
 * AR/VR Virtual Tours & Immersive Experiences
 * Modern property viewing with augmented and virtual reality
 * Mobile-first, differentiating feature per roadmap key learnings
 */

import { z } from 'zod';

// ============================================================================
// VIRTUAL TOUR TYPES
// ============================================================================

/**
 * Types of virtual tours available
 */
export enum TourType {
  VIDEO_WALKTHROUGH = 'video_walkthrough', // Standard video
  TOUR_360 = '360_tour', // 360-degree photos (Matterport-style)
  VR_IMMERSIVE = 'vr_immersive', // Full VR experience
  AR_VISUALIZATION = 'ar_visualization', // AR furniture placement
  LIVE_VIDEO = 'live_video', // Live guided tour with agent
  DRONE_TOUR = 'drone_tour', // Aerial/drone footage
  NEIGHBORHOOD_TOUR = 'neighborhood_tour', // Area walkthrough
}

/**
 * Virtual tour media asset
 */
export const VirtualTourSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  agentId: z.string().optional(),

  // Tour details
  type: z.nativeEnum(TourType),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(), // Seconds

  // Media URLs
  mediaUrl: z.string().url(), // Main tour URL
  thumbnail: z.string().url(),
  previewClip: z.string().url().optional(), // 15-30 second preview

  // 360 Tour specific (Matterport, Cupix, etc.)
  tour360Data: z.object({
    provider: z.enum(['matterport', 'cupix', 'ricoh', 'custom']),
    embedUrl: z.string().url(),
    dollhouseView: z.boolean(),
    floorPlanView: z.boolean(),
    measurementTools: z.boolean(),
    vrModeSupported: z.boolean(),
    guidedTour: z.boolean(),
    hotspots: z.array(z.object({
      id: z.string(),
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      label: z.string(),
      description: z.string().optional(),
    })).optional(),
  }).optional(),

  // VR specific
  vrData: z.object({
    platform: z.enum(['oculus', 'vive', 'webvr', 'cardboard']),
    downloadUrl: z.string().url().optional(),
    streamingUrl: z.string().url().optional(),
    controllers: z.boolean(),
    roomScale: z.boolean(),
  }).optional(),

  // Live tour specific
  liveTourData: z.object({
    schedulingUrl: z.string().url().optional(),
    platform: z.enum(['zoom', 'facetime', 'google_meet', 'custom']),
    maxParticipants: z.number().default(10),
    interactiveFeatures: z.boolean(), // Can participants ask agent to show specific areas
  }).optional(),

  // Quality & specs
  quality: z.object({
    resolution: z.string(), // "4K", "1080p"
    fps: z.number().optional(),
    fileSize: z.number().optional(), // MB
    hdr: z.boolean().default(false),
  }).optional(),

  // Accessibility
  accessibility: z.object({
    audioDescription: z.boolean(),
    closedCaptions: z.boolean(),
    transcriptAvailable: z.boolean(),
    transcriptUrl: z.string().url().optional(),
  }).optional(),

  // Analytics
  stats: z.object({
    views: z.number().default(0),
    uniqueViewers: z.number().default(0),
    averageWatchTime: z.number().default(0), // Seconds
    completionRate: z.number().default(0), // Percentage
    vrDownloads: z.number().default(0),
  }),

  // Status
  status: z.enum(['processing', 'active', 'archived']).default('active'),
  featured: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type VirtualTour = z.infer<typeof VirtualTourSchema>;

// ============================================================================
// AR FURNITURE VISUALIZATION
// ============================================================================

/**
 * AR furniture and staging visualization
 */
export const ARVisualizationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomId: z.string().optional(), // Specific room if applicable

  // AR session
  sessionId: z.string(),
  userId: z.string(),

  // Room dimensions (for AR placement)
  roomDimensions: z.object({
    length: z.number(), // Feet
    width: z.number(),
    height: z.number(),
    floorPlanImage: z.string().url().optional(),
  }).optional(),

  // Placed furniture
  furniture: z.array(z.object({
    id: z.string(),
    itemType: z.enum(['sofa', 'bed', 'table', 'chair', 'desk', 'bookshelf', 'rug', 'lamp', 'decor']),
    brand: z.string().optional(),
    model: z.string(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
      rotation: z.number(), // Degrees
    }),
    scale: z.number().default(1),
    modelUrl: z.string().url(), // 3D model URL (GLB/GLTF)
    textureUrl: z.string().url().optional(),
    price: z.number().optional(), // If shoppable
    purchaseUrl: z.string().url().optional(),
  })),

  // Styling theme
  styleTheme: z.enum([
    'modern',
    'traditional',
    'contemporary',
    'minimalist',
    'rustic',
    'industrial',
    'mid_century',
    'bohemian',
    'farmhouse',
  ]).optional(),

  // Saved designs
  isSaved: z.boolean().default(false),
  sharedWith: z.array(z.string()).optional(), // User IDs
  shareLink: z.string().optional(),

  // Shopping list
  totalEstimatedCost: z.number().optional(),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type ARVisualization = z.infer<typeof ARVisualizationSchema>;

// ============================================================================
// LIVE TOUR SCHEDULING
// ============================================================================

/**
 * Scheduled live virtual tour session
 */
export const LiveTourScheduleSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  agentId: z.string(),

  // Participants
  host: z.object({
    userId: z.string(),
    name: z.string(),
    avatar: z.string().url().optional(),
  }),

  attendees: z.array(z.object({
    userId: z.string().optional(), // Null if guest
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    status: z.enum(['invited', 'confirmed', 'declined', 'no_show', 'attended']),
    joinedAt: z.date().optional(),
    leftAt: z.date().optional(),
  })),

  // Scheduling
  scheduledTime: z.date(),
  duration: z.number(), // Minutes
  timezone: z.string(),

  // Platform details
  platform: z.enum(['zoom', 'google_meet', 'microsoft_teams', 'facetime', 'custom']),
  meetingLink: z.string().url(),
  meetingId: z.string(),
  password: z.string().optional(),

  // Tour details
  tourType: z.enum(['property_only', 'property_and_neighborhood', 'multiple_properties']),
  properties: z.array(z.string()), // Property IDs if multiple
  specialRequests: z.string().optional(), // "Focus on kitchen and backyard"

  // Interactive features
  features: z.object({
    screenShare: z.boolean().default(true),
    chat: z.boolean().default(true),
    recording: z.boolean().default(false),
    virtualBackground: z.boolean().default(false),
    documentSharing: z.boolean().default(true), // Share listings, comps, etc.
  }),

  // Reminders
  reminders: z.array(z.object({
    type: z.enum(['email', 'sms', 'push']),
    timing: z.number(), // Minutes before tour
    sent: z.boolean().default(false),
  })),

  // Follow-up
  followUp: z.object({
    recordingUrl: z.string().url().optional(),
    notes: z.string().optional(),
    actionItems: z.array(z.string()).optional(),
    nextSteps: z.string().optional(),
  }).optional(),

  // Status
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show',
  ]).default('scheduled'),

  cancelledReason: z.string().optional(),
  rescheduledTo: z.string().optional(), // New schedule ID

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type LiveTourSchedule = z.infer<typeof LiveTourScheduleSchema>;

// ============================================================================
// TOUR ANALYTICS
// ============================================================================

/**
 * Analytics for property tours
 */
export const TourAnalyticsSchema = z.object({
  propertyId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),

  // Overall stats
  totalViews: z.number(),
  uniqueViewers: z.number(),
  averageEngagementTime: z.number(), // Seconds

  // By tour type
  byTourType: z.record(z.object({ // tourType -> stats
    views: z.number(),
    avgWatchTime: z.number(),
    completionRate: z.number(),
  })),

  // Viewer demographics
  viewerDemographics: z.object({
    devices: z.object({
      mobile: z.number(),
      desktop: z.number(),
      tablet: z.number(),
      vr_headset: z.number(),
    }),
    locations: z.record(z.number()), // city/state -> count
    timeOfDay: z.record(z.number()), // hour -> count
  }),

  // Engagement metrics
  engagement: z.object({
    hotspotClicks: z.number(),
    roomTransitions: z.number(),
    measurementToolUses: z.number(),
    shareCount: z.number(),
    downloadCount: z.number(),
  }),

  // Conversion tracking
  conversion: z.object({
    viewToInquiry: z.number(), // Percentage
    viewToTourRequest: z.number(),
    viewToFavorite: z.number(),
  }),

  // Live tours
  liveTours: z.object({
    scheduled: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    noShows: z.number(),
    averageAttendees: z.number(),
    averageDuration: z.number(), // Minutes
  }),

  // Feedback
  feedback: z.object({
    averageRating: z.number().min(1).max(5).optional(),
    totalRatings: z.number(),
    comments: z.array(z.string()).optional(),
  }),

  generatedAt: z.date(),
});

export type TourAnalytics = z.infer<typeof TourAnalyticsSchema>;

// ============================================================================
// TOUR PACKAGE (For premium listings)
// ============================================================================

/**
 * Premium tour package for listings
 */
export const TourPackageSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  agentId: z.string(),

  // Package details
  packageName: z.string(), // "Premium Virtual Experience"
  description: z.string(),
  tier: z.enum(['basic', 'standard', 'premium', 'luxury']),

  // Included tours
  includedTours: z.array(z.nativeEnum(TourType)),
  virtualTourIds: z.array(z.string()), // References to VirtualTour records

  // Additional features
  features: z.object({
    professionalPhotography: z.boolean(),
    aerialDroneFootage: z.boolean(),
    twilightPhotos: z.boolean(),
    floorPlans: z.boolean(),
    virtualStaging: z.boolean(),
    arFurniturePlacement: z.boolean(),
    liveTourAvailable: z.boolean(),
    unlimitedViews: z.boolean(),
    downloadable: z.boolean(),
  }),

  // Pricing
  cost: z.number(),
  productionTime: z.number(), // Days

  // Production status
  status: z.enum(['ordered', 'in_production', 'completed', 'published']),
  orderDate: z.date(),
  completionDate: z.date().optional(),
  publishDate: z.date().optional(),

  // Provider
  productionCompany: z.object({
    name: z.string(),
    contact: z.string(),
    portfolio: z.string().url().optional(),
  }).optional(),

  createdAt: z.date(),
});

export type TourPackage = z.infer<typeof TourPackageSchema>;

// ============================================================================
// VIEWER SESSION TRACKING
// ============================================================================

/**
 * Individual viewer session for analytics
 */
export const TourViewerSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(), // Null if anonymous
  virtualTourId: z.string(),
  propertyId: z.string(),

  // Session details
  startedAt: z.date(),
  endedAt: z.date().optional(),
  duration: z.number().optional(), // Seconds

  // Device & platform
  device: z.object({
    type: z.enum(['mobile', 'tablet', 'desktop', 'vr_headset']),
    os: z.string().optional(),
    browser: z.string().optional(),
    vrPlatform: z.string().optional(),
  }),

  // Interaction tracking
  interactions: z.array(z.object({
    timestamp: z.date(),
    action: z.enum([
      'play',
      'pause',
      'seek',
      'zoom',
      'rotate',
      'change_room',
      'click_hotspot',
      'toggle_floorplan',
      'measure',
      'share',
      'download',
      'fullscreen',
    ]),
    details: z.any().optional(),
  })).optional(),

  // Rooms viewed (for 360 tours)
  roomsViewed: z.array(z.object({
    roomName: z.string(),
    timeSpent: z.number(), // Seconds
  })).optional(),

  // Completion
  completed: z.boolean(),
  completionPercentage: z.number().min(0).max(100),

  // Geographic data
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    ip: z.string().optional(),
  }).optional(),

  // Referral source
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),

  // Post-tour action
  nextAction: z.enum([
    'closed',
    'viewed_more_photos',
    'requested_info',
    'scheduled_tour',
    'favorited',
    'shared',
    'viewed_similar',
  ]).optional(),
});

export type TourViewerSession = z.infer<typeof TourViewerSessionSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const TourSchemas = {
  VirtualTour: VirtualTourSchema,
  ARVisualization: ARVisualizationSchema,
  LiveTourSchedule: LiveTourScheduleSchema,
  TourAnalytics: TourAnalyticsSchema,
  TourPackage: TourPackageSchema,
  TourViewerSession: TourViewerSessionSchema,
};
