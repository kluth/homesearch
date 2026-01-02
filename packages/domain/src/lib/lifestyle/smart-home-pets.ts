/**
 * Smart Home & Pet Owner Lifestyle Tools
 * Smart home readiness + comprehensive pet-friendly analysis
 * 67% of US households have pets - major decision factor
 * Smart home features increasingly expected by younger buyers (82% of millennials)
 */

import { z } from 'zod';

// ============================================================================
// SMART HOME READINESS
// ============================================================================

/**
 * Smart home compatibility and infrastructure assessment
 */
export const SmartHomeReadinessSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Overall readiness score
  smartHomeScore: z.number().min(0).max(100),
  readinessLevel: z.enum(['not_ready', 'basic', 'moderate', 'advanced', 'smart_home_ready']),

  // Network infrastructure
  networking: z.object({
    internetSpeed: z.object({
      download: z.number(), // Mbps
      upload: z.number(),
      sufficient: z.boolean(), // For smart home devices
    }),

    wifiCoverage: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    ethernetPorts: z.number().optional(),
    structuredWiring: z.boolean(),
    fiberReady: z.boolean(),

    meshNetworkRecommended: z.boolean(),
  }),

  // Existing smart features
  existingFeatures: z.object({
    smartThermostat: z.boolean(),
    smartDoorbell: z.boolean(),
    smartLocks: z.boolean(),
    securityCameras: z.boolean(),
    smartLighting: z.boolean(),
    smartGarage: z.boolean(),
    voiceAssistant: z.boolean(),
    smartSprinklers: z.boolean(),
    smartAppliances: z.boolean(),

    hubSystem: z.enum(['none', 'alexa', 'google_home', 'apple_homekit', 'samsung_smartthings', 'multiple']).optional(),
  }),

  // Electrical system compatibility
  electrical: z.object({
    modernPanel: z.boolean(), // Updated electrical panel
    panelCapacity: z.number().optional(), // Amps (200A recommended)
    groundedOutlets: z.boolean(),
    surgeProtection: z.boolean(),
    dedicatedCircuits: z.number().optional(),

    // Smart device requirements
    neutralWires: z.boolean(), // Required for many smart switches
    compatibleWithSmartSwitches: z.boolean(),
  }),

  // Compatibility by ecosystem
  ecosystemCompatibility: z.object({
    alexa: z.object({
      compatible: z.boolean(),
      devices: z.array(z.string()).optional(),
    }),
    googleHome: z.object({
      compatible: z.boolean(),
      devices: z.array(z.string()).optional(),
    }),
    appleHomeKit: z.object({
      compatible: z.boolean(),
      devices: z.array(z.string()).optional(),
      requiresHub: z.boolean(),
    }),
    matterStandard: z.object({
      compatible: z.boolean(),
      notes: z.string().optional(),
    }),
  }),

  // Upgrade recommendations
  recommendations: z.array(z.object({
    category: z.enum([
      'security',
      'comfort',
      'energy_efficiency',
      'convenience',
      'entertainment',
      'safety',
    ]),
    device: z.string(),
    priority: z.enum(['essential', 'recommended', 'nice_to_have']),
    estimatedCost: z.number(),
    compatibilityNotes: z.string().optional(),
  })),

  // Estimated costs
  upgradeCosts: z.object({
    basicSmartHome: z.number(), // Essentials: thermostat, doorbell, locks
    standardSmartHome: z.number(), // + lights, cameras
    advancedSmartHome: z.number(), // Full automation
  }),

  // Energy efficiency potential
  energyEfficiency: z.object({
    currentEfficiency: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    smartDeviceSavingsPotential: z.number(), // Annual $ savings
    paybackPeriod: z.number().optional(), // Years
  }).optional(),

  lastUpdated: z.date(),
});

export type SmartHomeReadiness = z.infer<typeof SmartHomeReadinessSchema>;

// ============================================================================
// PET-FRIENDLY ANALYSIS
// ============================================================================

/**
 * Comprehensive pet-friendly property and neighborhood analysis
 */
export const PetFriendlyAnalysisSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Overall pet-friendliness score
  petFriendlyScore: z.number().min(0).max(100),
  rating: z.enum(['not_suitable', 'limited', 'suitable', 'good', 'excellent']),

  // Property features for pets
  propertyFeatures: z.object({
    // Outdoor space
    yard: z.object({
      hasYard: z.boolean(),
      size: z.enum(['none', 'small', 'medium', 'large']).optional(),
      fenced: z.boolean(),
      fenceType: z.enum(['none', 'partial', 'full', 'privacy', 'chain_link']).optional(),
      fenceHeight: z.number().optional(), // Feet
      secureForDogs: z.boolean(),
    }),

    // Indoor features
    flooring: z.object({
      petFriendly: z.boolean(),
      types: z.array(z.enum(['hardwood', 'tile', 'vinyl', 'laminate', 'carpet'])),
      notes: z.string().optional(), // "Tile in main areas, easy to clean"
    }),

    // Storage
    petStorage: z.object({
      mudroom: z.boolean(),
      laundryRoom: z.boolean(), // For cleaning
      garage: z.boolean(), // For food storage
    }).optional(),

    // Access
    petDoor: z.boolean(),
    petDoorRecommended: z.boolean(),
  }),

  // Rental/HOA policies
  policies: z.object({
    petsAllowed: z.boolean(),

    restrictions: z.object({
      dogs: z.object({
        allowed: z.boolean(),
        sizeLimit: z.number().optional(), // Pounds
        breedRestrictions: z.array(z.string()).optional(),
        maxNumber: z.number().optional(),
      }).optional(),

      cats: z.object({
        allowed: z.boolean(),
        maxNumber: z.number().optional(),
        declawRequired: z.boolean(),
      }).optional(),

      otherPets: z.array(z.string()).optional(), // "Birds", "Fish", "Rabbits"
    }).optional(),

    fees: z.object({
      petDeposit: z.number().optional(),
      petRent: z.number().optional(), // Monthly
      oneTimeFee: z.number().optional(),
    }).optional(),
  }).optional(),

  // Neighborhood amenities
  neighborhoodAmenities: z.object({
    // Dog parks
    dogParks: z.array(z.object({
      name: z.string(),
      address: z.string(),
      distance: z.number(), // Miles
      size: z.enum(['small', 'medium', 'large']),
      features: z.array(z.enum(['separate_small_dog_area', 'agility_equipment', 'water_fountains', 'shaded_areas', 'benches'])).optional(),
      fenced: z.boolean(),
      rating: z.number().min(1).max(5).optional(),
    })),

    nearestDogPark: z.number().optional(), // Miles

    // Parks & trails
    parks: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      dogsAllowed: z.boolean(),
      leashRequired: z.boolean(),
      trailMiles: z.number().optional(),
    })).optional(),

    // Walking routes
    walkingRoutes: z.object({
      sidewalkCoverage: z.enum(['none', 'limited', 'good', 'excellent']),
      safetyRating: z.enum(['poor', 'fair', 'good', 'excellent']),
      scenicRoutes: z.boolean(),
    }).optional(),
  }),

  // Pet services nearby
  petServices: z.object({
    // Veterinary care
    veterinarians: z.array(z.object({
      name: z.string(),
      address: z.string(),
      distance: z.number(),
      rating: z.number().min(1).max(5).optional(),
      emergencyServices: z.boolean(),
      specialties: z.array(z.string()).optional(),
    })),

    nearestVet: z.number(), // Miles
    nearest24HourVet: z.number().optional(),

    // Pet stores
    petStores: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      type: z.enum(['big_box', 'boutique', 'feed_store']),
    })).optional(),

    // Grooming
    groomers: z.number(),
    nearestGroomer: z.number().optional(),

    // Boarding & daycare
    boarding: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      type: z.enum(['kennel', 'daycare', 'home_boarding']),
      rating: z.number().min(1).max(5).optional(),
    })).optional(),

    // Training
    trainers: z.number(),
    nearestTrainer: z.number().optional(),
  }),

  // Pet-friendly businesses
  petFriendlyBusinesses: z.object({
    restaurants: z.number(), // With dog-friendly patios
    cafes: z.number(),
    breweries: z.number(),
    stores: z.number(),

    nearbyPetFriendly: z.array(z.object({
      name: z.string(),
      type: z.enum(['restaurant', 'cafe', 'brewery', 'store', 'other']),
      distance: z.number(),
    })).optional(),
  }).optional(),

  // Safety considerations
  petSafety: z.object({
    trafficLevel: z.enum(['low', 'moderate', 'high']),
    wildlife: z.enum(['none', 'minimal', 'moderate', 'significant']), // Coyotes, etc.
    fencedYardsCommon: z.boolean(),
    leashLaw: z.boolean(),
    dogWasteStations: z.boolean(),
  }),

  // Climate considerations
  climateConsiderations: z.object({
    extremeHeat: z.boolean(), // Summer temps > 95°F regularly
    extremeCold: z.boolean(), // Winter temps < 20°F regularly
    rainyDays: z.number(), // Per year
    recommendations: z.array(z.string()).optional(), // "Indoor exercise options needed in winter"
  }).optional(),

  // Cost estimates
  petOwnershipCosts: z.object({
    typicalVetCosts: z.number(), // Annual in area
    groomingCosts: z.number().optional(), // Annual estimate
    daycareCosts: z.number().optional(), // Monthly estimate
    foodCostsRange: z.object({
      budget: z.number(),
      premium: z.number(),
    }).optional(),
  }).optional(),

  lastUpdated: z.date(),
});

export type PetFriendlyAnalysis = z.infer<typeof PetFriendlyAnalysisSchema>;

// ============================================================================
// PET MOVING CHECKLIST
// ============================================================================

/**
 * Pet-specific moving checklist
 */
export const PetMovingChecklistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  movingPlanId: z.string().optional(),

  // Pet details
  pets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['dog', 'cat', 'bird', 'fish', 'reptile', 'small_mammal', 'other']),
    breed: z.string().optional(),
    age: z.number(),
    specialNeeds: z.array(z.string()).optional(), // "Medication", "Anxiety"
  })),

  // Pre-move tasks
  tasks: z.array(z.object({
    id: z.string(),
    category: z.enum([
      'veterinary',
      'records',
      'travel_prep',
      'new_home_prep',
      'registration',
      'services',
    ]),
    task: z.string(),
    completed: z.boolean(),
    dueDate: z.date().optional(),
    notes: z.string().optional(),
  })),

  // Required items
  items: z.array(z.object({
    item: z.string(),
    category: z.enum(['travel', 'comfort', 'safety', 'documentation']),
    acquired: z.boolean(),
    notes: z.string().optional(),
  })),

  // Veterinary preparation
  vetPrep: z.object({
    recordsObtained: z.boolean(),
    vaccinationsUpToDate: z.boolean(),
    healthCertificate: z.boolean().optional(), // Required for some moves
    microchipRegistrationUpdated: z.boolean(),
    newVetIdentified: z.boolean(),
  }),

  // New location requirements
  newLocationRequirements: z.object({
    licensingRequired: z.boolean(),
    licenseCost: z.number().optional(),
    additionalVaccinations: z.array(z.string()).optional(), // State-specific
    breedRestrictions: z.array(z.string()).optional(),
  }).optional(),

  completionPercentage: z.number().min(0).max(100),

  createdAt: z.date(),
  lastUpdated: z.date(),
});

export type PetMovingChecklist = z.infer<typeof PetMovingChecklistSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const LifestyleSchemas = {
  SmartHomeReadiness: SmartHomeReadinessSchema,
  PetFriendlyAnalysis: PetFriendlyAnalysisSchema,
  PetMovingChecklist: PetMovingChecklistSchema,
};
