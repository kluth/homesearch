/**
 * Accessibility Schemas
 *
 * Comprehensive accessibility features for properties.
 * Addresses User Story E6 & 9.1: Accessibility for Disabled Buyers
 */

import { z } from 'zod';

/**
 * Accessibility Feature Category
 */
export enum AccessibilityCategory {
  ENTRANCE = 'entrance',
  INTERIOR = 'interior',
  BATHROOM = 'bathroom',
  KITCHEN = 'kitchen',
  BEDROOM = 'bedroom',
  MOBILITY = 'mobility',
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  COGNITIVE = 'cognitive',
}

/**
 * Entrance Accessibility
 */
export const EntranceAccessibilitySchema = z.object({
  // Ramps
  hasRamp: z.boolean(),
  rampSlope: z.number().optional(), // Degrees
  rampLength: z.number().optional(), // Feet
  rampHandrails: z.boolean().default(false),

  // Doors
  doorWidth: z.number().optional(), // Inches (32" minimum for wheelchair)
  automaticDoor: z.boolean().default(false),
  leverHandles: z.boolean().default(false),

  // Entry
  stepFreeEntry: z.boolean(),
  numberOfSteps: z.number().default(0),
  stairLift: z.boolean().default(false),

  // Parking
  accessibleParking: z.boolean(),
  parkingDistance: z.number().optional(), // Feet from entrance
});

export type EntranceAccessibility = z.infer<typeof EntranceAccessibilitySchema>;

/**
 * Interior Accessibility
 */
export const InteriorAccessibilitySchema = z.object({
  // Layout
  singleStory: z.boolean(),
  elevator: z.boolean().default(false),
  stairLift: z.boolean().default(false),

  // Hallways
  hallwayWidth: z.number().optional(), // Inches (36" minimum)
  noStepTransitions: z.boolean(),

  // Flooring
  hardSurfaceFlooring: z.boolean(), // Easier than carpet for wheelchairs
  noThresholds: z.boolean(),

  // Doors
  wideDoors: z.boolean(), // 32"+ throughout
  leverHandles: z.boolean(),

  // Light & Power
  rocker_switches: z.boolean().default(false),
  loweredSwitches: z.boolean().default(false),
  accessibleOutlets: z.boolean().default(false),

  // Windows
  lowWindows: z.boolean().default(false),
  easyOpenWindows: z.boolean().default(false),
});

export type InteriorAccessibility = z.infer<typeof InteriorAccessibilitySchema>;

/**
 * Bathroom Accessibility
 */
export const BathroomAccessibilitySchema = z.object({
  // Space
  wheelchairTurnable: z.boolean(), // 5' turning radius
  doorWidth: z.number().optional(),

  // Toilet
  grabBarsToilet: z.boolean(),
  raiseToilet: z.boolean().default(false),
  sideTransferSpace: z.boolean(),

  // Shower/Tub
  rollInShower: z.boolean().default(false),
  showerSeat: z.boolean().default(false),
  grabBarsShower: z.boolean().default(false),
  handheldShowerhead: z.boolean().default(false),
  walkInTub: z.boolean().default(false),

  // Sink
  rollUnderSink: z.boolean().default(false),
  leverFaucets: z.boolean().default(false),
  loweredMirror: z.boolean().default(false),
});

export type BathroomAccessibility = z.infer<typeof BathroomAccessibilitySchema>;

/**
 * Kitchen Accessibility
 */
export const KitchenAccessibilitySchema = z.object({
  // Layout
  openLayout: z.boolean(),
  wheelchairTurnable: z.boolean(),

  // Counters & Cabinets
  loweredCounters: z.boolean().default(false),
  rollUnderSink: z.boolean().default(false),
  pullOutShelves: z.boolean().default(false),
  loweredCabinets: z.boolean().default(false),

  // Appliances
  frontControlStove: z.boolean().default(false),
  sideBySideFridge: z.boolean().default(false),
  raiseDisposal: z.boolean().default(false),
  loweredMicrowave: z.boolean().default(false),
});

export type KitchenAccessibility = z.infer<typeof KitchenAccessibilitySchema>;

/**
 * Bedroom Accessibility
 */
export const BedroomAccessibilitySchema = z.object({
  // Space
  spaciousLayout: z.boolean(),
  wheelchairManeuverable: z.boolean(),

  // Closet
  loweredClosetRods: z.boolean().default(false),
  reachableShelves: z.boolean().default(false),

  // Windows
  lowWindows: z.boolean().default(false),

  // En-suite
  accessibleBathroom: z.boolean(),
});

export type BedroomAccessibility = z.infer<typeof BedroomAccessibilitySchema>;

/**
 * Visual Accessibility
 */
export const VisualAccessibilitySchema = z.object({
  // Lighting
  brightLighting: z.boolean(),
  taskLighting: z.boolean().default(false),

  // Contrast
  highContrastDesign: z.boolean().default(false),

  // Navigation
  tactilePaving: z.boolean().default(false),
  brailleLabels: z.boolean().default(false),

  // Technology
  voiceControlled: z.boolean().default(false),
  smartHomeIntegration: z.boolean().default(false),
});

export type VisualAccessibility = z.infer<typeof VisualAccessibilitySchema>;

/**
 * Auditory Accessibility
 */
export const AuditoryAccessibilitySchema = z.object({
  // Alerts
  visualFireAlarms: z.boolean().default(false),
  visualDoorbell: z.boolean().default(false),

  // Communication
  videoDoorbell: z.boolean().default(false),

  // Sound
  soundproofing: z.boolean().default(false),
});

export type AuditoryAccessibility = z.infer<typeof AuditoryAccessibilitySchema>;

/**
 * Complete Property Accessibility
 */
export const PropertyAccessibilitySchema = z.object({
  propertyId: z.string(),

  // Overall
  adaCompliant: z.boolean().default(false),
  adaCertified: z.boolean().default(false),
  certificationDate: z.date().optional(),

  // Score (0-100)
  accessibilityScore: z.number().min(0).max(100),
  wheelchairAccessibilityScore: z.number().min(0).max(100),

  // Categories
  entrance: EntranceAccessibilitySchema,
  interior: InteriorAccessibilitySchema,
  bathrooms: z.array(BathroomAccessibilitySchema),
  kitchen: KitchenAccessibilitySchema.optional(),
  bedrooms: z.array(BedroomAccessibilitySchema).optional(),
  visual: VisualAccessibilitySchema.optional(),
  auditory: AuditoryAccessibilitySchema.optional(),

  // Modifications
  modificationsFriendly: z.boolean(), // Landlord/HOA allows mods
  existingModifications: z.array(z.string()).optional(),

  // Nearby
  nearbyMedicalFacilities: z.array(z.object({
    name: z.string(),
    type: z.enum(['hospital', 'clinic', 'pharmacy', 'specialist']),
    distance: z.number(), // Miles
  })).optional(),

  // Parking
  accessibleParking: z.boolean(),

  // Community
  accessibleCommonAreas: z.boolean().default(false),

  // Photos
  accessibilityPhotos: z.array(z.object({
    feature: z.string(),
    url: z.string().url(),
  })).optional(),

  // Estimated Modification Costs
  estimatedModificationCosts: z.object({
    rampInstallation: z.number().optional(),
    bathroomRemodel: z.number().optional(),
    doorWidening: z.number().optional(),
    total: z.number().optional(),
  }).optional(),

  // Verification
  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(), // Inspector, OT, etc.
  verifiedAt: z.date().optional(),

  // Last Updated
  lastUpdated: z.date(),
});

export type PropertyAccessibility = z.infer<typeof PropertyAccessibilitySchema>;

/**
 * Accessibility Requirements
 */
export const AccessibilityRequirementsSchema = z.object({
  userId: z.string(),

  // Mobility
  requiresWheelchairAccess: z.boolean().default(false),
  requiresWalkerAccess: z.boolean().default(false),

  // Critical Features
  mustHaveFeatures: z.array(z.string()), // Specific accessibility features

  // Preferred Features
  preferredFeatures: z.array(z.string()).optional(),

  // Minimum Scores
  minimumAccessibilityScore: z.number().default(50),

  // Room-Specific
  accessibleBedroom: z.boolean().default(false),
  accessibleBathroom: z.boolean().default(false),
  accessibleKitchen: z.boolean().default(false),

  // Outdoor
  levelYard: z.boolean().default(false),
  accessibleEntryway: z.boolean().default(true),

  // Budget for Modifications
  modificationBudget: z.number().optional(),
});

export type AccessibilityRequirements = z.infer<typeof AccessibilityRequirementsSchema>;

/**
 * Accessibility Checklist
 */
export const AccessibilityChecklistSchema = z.object({
  propertyId: z.string(),
  inspectedBy: z.string(),
  inspectedAt: z.date(),

  items: z.array(z.object({
    category: z.nativeEnum(AccessibilityCategory),
    item: z.string(),
    present: z.boolean(),
    meetsStandard: z.boolean().optional(),
    notes: z.string().optional(),
    photo: z.string().url().optional(),
  })),

  recommendations: z.array(z.object({
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    modification: z.string(),
    estimatedCost: z.number(),
    timeframe: z.string(),
  })).optional(),

  overallAssessment: z.string(),
});

export type AccessibilityChecklist = z.infer<typeof AccessibilityChecklistSchema>;
