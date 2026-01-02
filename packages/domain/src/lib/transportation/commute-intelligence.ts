/**
 * Commute Intelligence & Transportation Analysis
 * Multi-modal commute analysis - critical for 68% of buyers (commute time in top 5 factors)
 * Work-from-home trends make this even more important for hybrid workers
 */

import { z } from 'zod';

// ============================================================================
// COMMUTE ANALYSIS
// ============================================================================

/**
 * Comprehensive commute analysis from property to destination
 */
export const CommuteAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string().optional(),

  // Origin & destination
  origin: z.object({
    address: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }),

  destination: z.object({
    name: z.string(), // "Work", "Downtown Office", "University"
    address: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    destinationType: z.enum(['work', 'school', 'custom']),
  }),

  // Distance
  straightLineDistance: z.number(), // Miles

  // Multi-modal options
  modes: z.object({
    // Driving
    driving: z.object({
      available: z.boolean(),
      distance: z.number(), // Miles
      duration: z.object({
        typical: z.number(), // Minutes
        best: z.number(), // Off-peak
        worst: z.number(), // Peak traffic
      }),

      // Traffic patterns
      trafficPatterns: z.array(z.object({
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        timeOfDay: z.enum(['morning_rush', 'midday', 'evening_rush', 'night']),
        duration: z.number(),
        trafficLevel: z.enum(['light', 'moderate', 'heavy', 'severe']),
      })).optional(),

      // Cost estimates
      costs: z.object({
        fuelCostPerTrip: z.number(),
        fuelCostMonthly: z.number(), // Based on 22 workdays
        tollsPerTrip: z.number().optional(),
        tollsMonthly: z.number().optional(),
        parkingDaily: z.number().optional(),
        parkingMonthly: z.number().optional(),
        totalMonthlyCost: z.number(),
      }).optional(),

      // Route details
      mainHighways: z.array(z.string()).optional(),
      accidents ProneAreas: z.array(z.string()).optional(),
    }).optional(),

    // Public transit
    transit: z.object({
      available: z.boolean(),
      duration: z.object({
        typical: z.number(),
        best: z.number(),
        worst: z.number(),
      }),

      // Routes
      routes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        transitTypes: z.array(z.enum(['subway', 'light_rail', 'bus', 'commuter_rail', 'ferry'])),
        transfers: z.number(),
        walkingDistance: z.number(), // Miles (to/from stations)
        schedule: z.object({
          frequency: z.number(), // Minutes between departures
          firstDeparture: z.string(), // "05:30 AM"
          lastDeparture: z.string(),
          weekendService: z.boolean(),
        }),
        duration: z.number(),
        reliability: z.number().min(0).max(100).optional(), // On-time percentage
      })),

      // Access
      nearestStop: z.object({
        name: z.string(),
        distance: z.number(), // Miles
        walkTime: z.number(), // Minutes
      }),

      // Cost
      costs: z.object({
        perTrip: z.number(),
        monthlyPass: z.number().optional(),
        annualPass: z.number().optional(),
        recommended: z.enum(['per_trip', 'monthly', 'annual']),
        monthlySavings: z.number().optional(), // vs driving
      }),
    }).optional(),

    // Biking
    biking: z.object({
      available: z.boolean(),
      distance: z.number(),
      duration: z.object({
        leisurely: z.number(), // 10 mph
        moderate: z.number(), // 12-14 mph
        fast: z.number(), // 16+ mph
      }),

      // Route safety
      bikeability: z.object({
        score: z.number().min(0).max(100),
        grade: z.enum(['A', 'B', 'C', 'D', 'F']),

        infrastructure: z.object({
          protectedLanes: z.number(), // Miles
          bikeLanes: z.number(),
          sharedRoadway: z.number(),
          trails: z.number(),
        }),

        elevationGain: z.number(), // Feet
        difficulty: z.enum(['easy', 'moderate', 'challenging', 'difficult']),
      }),

      // Bike facilities
      bikeParking: z.boolean().optional(), // At destination
      bikeShareNearby: z.boolean().optional(),

      // Cost
      costs: z.object({
        bikeShareMonthly: z.number().optional(),
        maintenanceMonthly: z.number().optional(),
        totalMonthlyCost: z.number(),
      }).optional(),
    }).optional(),

    // Walking
    walking: z.object({
      available: z.boolean(),
      feasible: z.boolean(), // Under 3 miles usually
      distance: z.number(),
      duration: z.number(), // Minutes

      walkability: z.object({
        score: z.number().min(0).max(100),
        grade: z.enum(['A', 'B', 'C', 'D', 'F']),

        sidewalkCoverage: z.enum(['none', 'partial', 'complete']),
        crosswalks: z.enum(['few', 'adequate', 'many']),
        lighting: z.enum(['poor', 'fair', 'good', 'excellent']),
        hilliness: z.enum(['flat', 'gentle', 'moderate', 'steep']),
      }),
    }).optional(),

    // Carpooling / Rideshare
    carpooling: z.object({
      available: z.boolean(),
      estimatedDuration: z.number().optional(),

      rideshareEstimate: z.object({
        typical: z.number(), // $ per trip
        surge: z.number(), // $ during peak
        monthly: z.number(), // Estimated monthly cost
      }).optional(),

      carpoolOptions: z.object({
        companyVanpool: z.boolean(),
        rideshareMatching: z.boolean(),
        parkAndRide: z.boolean(),
        hov LanesAvailable: z.boolean(),
      }).optional(),
    }).optional(),
  }),

  // Recommended mode
  recommendation: z.object({
    primaryMode: z.enum(['driving', 'transit', 'biking', 'walking', 'hybrid']),
    reasoning: z.string(),
    monthlyCost: z.number(),
    monthlyTime: z.number(), // Hours per month
    environmentalImpact: z.enum(['low', 'moderate', 'high']).optional(),

    hybridOption: z.object({
      description: z.string(), // "Drive to park-and-ride, take train"
      modes: z.array(z.string()),
      monthlyCost: z.number(),
    }).optional(),
  }),

  // Quality of life impact
  qolImpact: z.object({
    averageOneWayTime: z.number(), // Minutes
    monthlyCommuteHours: z.number(),
    annualCommuteHours: z.number(),
    comparisonToNational: z.object({
      nationalAverage: z.number(), // Minutes
      comparison: z.enum(['much_better', 'better', 'average', 'worse', 'much_worse']),
    }),

    // Life balance
    impactScore: z.number().min(0).max(100), // Lower commute = higher score
    timeAvailableForLife: z.string(), // "2.5 hours more per week than average commuter"
  }),

  generatedAt: z.date(),
});

export type CommuteAnalysis = z.infer<typeof CommuteAnalysisSchema>;

// ============================================================================
// MULTI-DESTINATION COMMUTE
// ============================================================================

/**
 * Commute analysis for households with multiple commuters
 */
export const MultiDestinationCommuteSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),

  // Property location
  homeAddress: z.string(),

  // Multiple destinations
  destinations: z.array(z.object({
    commuterId: z.string(), // "Partner 1", "Partner 2"
    commuterName: z.string(),
    destinationName: z.string(),
    address: z.string(),
    frequency: z.enum(['daily', 'several_per_week', 'weekly', 'occasional']),
    analysissummary: z.object({
      preferredMode: z.string(),
      duration: z.number(),
      monthlyCost: z.number(),
    }),
  })),

  // Combined analysis
  combinedMetrics: z.object({
    totalMonthlyCommuteCost: z.number(),
    totalMonthlyCommuteHours: z.number(),
    averageCommutePerPerson: z.number(),

    vehiclesNeeded: z.number(),
    parkingSpotsNeeded: z.number(),

    familyCommuteScore: z.number().min(0).max(100), // Higher = better overall commute situation
  }),

  // Comparison to other properties
  comparisonToOtherProperties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    totalMonthlyHours: z.number(),
    totalMonthlyCost: z.number(),
    ranking: z.number(), // 1 = best for commuting
  })).optional(),

  generatedAt: z.date(),
});

export type MultiDestinationCommute = z.infer<typeof MultiDestinationCommuteSchema>;

// ============================================================================
// PARKING ANALYSIS
// ============================================================================

/**
 * Parking availability and costs
 */
export const ParkingAnalysisSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // On-site parking
  onSiteParking: z.object({
    included: z.boolean(),
    spots: z.number(),
    type: z.enum(['garage', 'carport', 'driveway', 'assigned_spot', 'street']),
    coveredSpots: z.number(),
    extraCost: z.number().optional(), // $ per month for additional spots
  }),

  // Street parking
  streetParking: z.object({
    available: z.boolean(),
    difficulty: z.enum(['easy', 'moderate', 'difficult', 'very_difficult']),
    restrictions: z.array(z.enum([
      'permit_required',
      'time_limited',
      'no_overnight',
      'street_cleaning',
      'residential_only',
    ])).optional(),

    permitCost: z.number().optional(), // Annual cost
    typicalAvailability: z.enum(['always', 'usually', 'sometimes', 'rarely']),
  }),

  // Nearby parking facilities
  nearbyLots: z.array(z.object({
    name: z.string(),
    address: z.string(),
    distance: z.number(), // Miles
    walkTime: z.number(), // Minutes

    rates: z.object({
      hourly: z.number().optional(),
      daily: z.number().optional(),
      monthly: z.number().optional(),
    }),

    features: z.array(z.enum(['covered', 'secure', 'ev_charging', 'valet', 'reserved'])).optional(),
  })).optional(),

  // EV charging
  evCharging: z.object({
    onSite: z.boolean(),
    nearbyPublicChargers: z.number(),
    nearestChargerDistance: z.number().optional(), // Miles
    costPerKwh: z.number().optional(),
  }).optional(),

  lastUpdated: z.date(),
});

export type ParkingAnalysis = z.infer<typeof ParkingAnalysisSchema>;

// ============================================================================
// WALKABILITY & TRANSIT SCORES
// ============================================================================

/**
 * Comprehensive walkability and transit scores
 */
export const WalkTransitScoresSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Walk Score® (0-100)
  walkScore: z.object({
    score: z.number().min(0).max(100),
    description: z.enum([
      'car_dependent', // 0-24
      'car_dependent_most', // 25-49
      'somewhat_walkable', // 50-69
      'very_walkable', // 70-89
      'walkers_paradise', // 90-100
    ]),

    nearbyAmenities: z.array(z.object({
      category: z.enum(['grocery', 'restaurants', 'shopping', 'coffee', 'banks', 'parks', 'schools', 'entertainment']),
      count: z.number(),
      nearestDistance: z.number(), // Miles
    })),
  }),

  // Transit Score® (0-100)
  transitScore: z.object({
    score: z.number().min(0).max(100).optional(),
    description: z.enum([
      'minimal_transit', // 0-24
      'some_transit', // 25-49
      'good_transit', // 50-69
      'excellent_transit', // 70-89
      'riders_paradise', // 90-100
    ]).optional(),

    nearbyStops: z.array(z.object({
      type: z.enum(['bus', 'subway', 'light_rail', 'commuter_rail', 'ferry']),
      name: z.string(),
      distance: z.number(),
      routes: z.number(), // Number of routes at this stop
    })).optional(),
  }).optional(),

  // Bike Score® (0-100)
  bikeScore: z.object({
    score: z.number().min(0).max(100).optional(),
    description: z.enum([
      'not_bikeable', // 0-24
      'somewhat_bikeable', // 25-49
      'bikeable', // 50-69
      'very_bikeable', // 70-89
      'bikers_paradise', // 90-100
    ]).optional(),

    bikeInfrastructure: z.object({
      bikeLaneMiles: z.number(),
      bikeTrailMiles: z.number(),
      hilliness: z.enum(['flat', 'some_hills', 'hilly']),
    }).optional(),
  }).optional(),

  // Car dependency
  carDependency: z.object({
    vehiclesPerHousehold: z.number(), // Area average
    percentCarCommute: z.number(), // Percentage in area who drive to work
    averageCommuteTime: z.number(), // Minutes, area average
  }),

  lastUpdated: z.date(),
});

export type WalkTransitScores = z.infer<typeof WalkTransitScoresSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const TransportationSchemas = {
  CommuteAnalysis: CommuteAnalysisSchema,
  MultiDestinationCommute: MultiDestinationCommuteSchema,
  ParkingAnalysis: ParkingAnalysisSchema,
  WalkTransitScores: WalkTransitScoresSchema,
};
