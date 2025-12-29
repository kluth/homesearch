/**
 * Moving Coordinator
 *
 * Comprehensive moving management system to coordinate all aspects of
 * relocating to a new property.
 *
 * Features:
 * - Moving timeline and checklist
 * - Mover quotes and comparisons
 * - Packing inventory management
 * - Utility setup coordination
 * - Address change notifications
 * - Budget tracking
 * - Insurance and protection
 * - Storage solutions
 * - Cleaning service coordination
 * - Pet relocation planning
 *
 * @module MovingCoordinator
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const MovingTimelineSchema = z.object({
  moveDate: z.string().datetime(),
  currentAddress: z.string(),
  newAddress: z.string(),
  distance: z.number().nonnegative().describe('Distance in km'),
  estimatedMovingDays: z.number().int().positive(),
  milestones: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      deadline: z.string().datetime(),
      category: z.enum([
        'planning',
        'packing',
        'utilities',
        'moving',
        'settling_in',
        'administrative',
      ]),
      isCompleted: z.boolean().default(false),
      completedDate: z.string().datetime().optional(),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ),
});

export const MovingChecklistSchema = z.object({
  id: z.string(),
  moveId: z.string(),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      category: z.enum([
        'before_move',
        'moving_day',
        'after_move',
        'utilities',
        'administrative',
        'cleaning',
      ]),
      weeksBeforeMove: z.number().int().describe('How many weeks before move date'),
      isCompleted: z.boolean().default(false),
      completedDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    })
  ),
  completionPercentage: z.number().min(0).max(100),
});

export const MoverQuoteSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  contactPerson: z.string().optional(),
  phone: z.string(),
  email: z.string().email(),
  serviceType: z.enum(['full_service', 'self_pack', 'container', 'truck_rental']),
  estimatedCost: z.number().positive(),
  breakdown: z.object({
    laborCost: z.number().nonnegative(),
    transportCost: z.number().nonnegative(),
    packingMaterialsCost: z.number().nonnegative(),
    insuranceCost: z.number().nonnegative(),
    additionalFees: z.number().nonnegative(),
  }),
  estimatedDuration: z.string(),
  numberOfMovers: z.number().int().positive(),
  vehicleSize: z.string(),
  insurance: z.object({
    included: z.boolean(),
    coverage: z.number().optional(),
    type: z.string().optional(),
  }),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().default(0),
  servicesIncluded: z.array(z.string()),
  quoteDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  notes: z.string().optional(),
});

export const PackingInventorySchema = z.object({
  id: z.string(),
  moveId: z.string(),
  rooms: z.array(
    z.object({
      name: z.string(),
      boxes: z.array(
        z.object({
          boxNumber: z.number().int().positive(),
          size: z.enum(['small', 'medium', 'large', 'extra_large']),
          contents: z.array(z.string()),
          isFragile: z.boolean().default(false),
          isPacked: z.boolean().default(false),
          packedDate: z.string().datetime().optional(),
          priority: z.enum(['essential', 'important', 'normal', 'low']),
          notes: z.string().optional(),
        })
      ),
      totalBoxes: z.number().int().nonnegative(),
      packedBoxes: z.number().int().nonnegative(),
      completionPercentage: z.number().min(0).max(100),
    })
  ),
  totalBoxes: z.number().int().nonnegative(),
  totalPacked: z.number().int().nonnegative(),
  overallProgress: z.number().min(0).max(100),
  specialItems: z.array(
    z.object({
      name: z.string(),
      category: z.enum(['furniture', 'electronics', 'artwork', 'plants', 'other']),
      requiresSpecialHandling: z.boolean(),
      dimensions: z.string().optional(),
      weight: z.number().optional(),
      estimatedValue: z.number().optional(),
      notes: z.string().optional(),
    })
  ),
});

export const UtilitySetupSchema = z.object({
  id: z.string(),
  moveId: z.string(),
  utilities: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        'electricity',
        'gas',
        'water',
        'sewage',
        'internet',
        'cable_tv',
        'phone',
        'trash_collection',
      ]),
      provider: z.string(),
      accountNumber: z.string().optional(),
      disconnectDate: z.string().datetime().optional(),
      connectDate: z.string().datetime().optional(),
      status: z.enum(['not_started', 'scheduled', 'active', 'disconnected']),
      estimatedMonthlyCost: z.number().nonnegative().optional(),
      notes: z.string().optional(),
    })
  ),
  completedUtilities: z.number().int().nonnegative(),
  totalUtilities: z.number().int().nonnegative(),
});

export const AddressChangeSchema = z.object({
  id: z.string(),
  moveId: z.string(),
  organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum([
        'postal_service',
        'bank',
        'insurance',
        'employer',
        'government',
        'subscription',
        'healthcare',
        'education',
        'other',
      ]),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      isCompleted: z.boolean().default(false),
      completedDate: z.string().datetime().optional(),
      confirmationNumber: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  completedNotifications: z.number().int().nonnegative(),
  totalNotifications: z.number().int().nonnegative(),
});

export const MovingBudgetSchema = z.object({
  id: z.string(),
  moveId: z.string(),
  estimatedTotal: z.number().nonnegative(),
  actualTotal: z.number().nonnegative(),
  categories: z.array(
    z.object({
      name: z.string(),
      budgeted: z.number().nonnegative(),
      actual: z.number().nonnegative(),
      expenses: z.array(
        z.object({
          id: z.string(),
          description: z.string(),
          amount: z.number().positive(),
          date: z.string().datetime(),
          isPaid: z.boolean(),
          receipt: z.string().optional().describe('Receipt document ID'),
        })
      ),
    })
  ),
  variance: z.number(),
  variancePercentage: z.number(),
});

export const MovingPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),
  moveDate: z.string().datetime(),
  currentAddress: z.string(),
  newAddress: z.string(),
  distance: z.number().nonnegative(),
  numberOfRooms: z.number().int().positive(),
  householdSize: z.number().int().positive(),
  hasPets: z.boolean(),
  hasVehicles: z.boolean(),
  status: z.enum(['planning', 'in_progress', 'completed', 'cancelled']),
  timeline: MovingTimelineSchema,
  checklist: MovingChecklistSchema,
  quotes: z.array(MoverQuoteSchema),
  selectedMover: z.string().optional(),
  inventory: PackingInventorySchema,
  utilities: UtilitySetupSchema,
  addressChanges: AddressChangeSchema,
  budget: MovingBudgetSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type MovingTimeline = z.infer<typeof MovingTimelineSchema>;
export type MovingChecklist = z.infer<typeof MovingChecklistSchema>;
export type MoverQuote = z.infer<typeof MoverQuoteSchema>;
export type PackingInventory = z.infer<typeof PackingInventorySchema>;
export type UtilitySetup = z.infer<typeof UtilitySetupSchema>;
export type AddressChange = z.infer<typeof AddressChangeSchema>;
export type MovingBudget = z.infer<typeof MovingBudgetSchema>;
export type MovingPlan = z.infer<typeof MovingPlanSchema>;

// ============================================================================
// Moving Coordinator
// ============================================================================

export class MovingCoordinator {
  /**
   * Creates a new moving plan
   */
  public createMovingPlan(
    userId: string,
    propertyId: string,
    moveDate: Date,
    currentAddress: string,
    newAddress: string,
    details: {
      numberOfRooms: number;
      householdSize: number;
      hasPets: boolean;
      hasVehicles: boolean;
    }
  ): MovingPlan {
    const moveId = `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate distance (in real implementation, use geocoding API)
    const distance = this.calculateDistance(currentAddress, newAddress);

    // Estimate moving days
    const estimatedMovingDays = this.estimateMovingDays(distance, details.numberOfRooms);

    // Generate timeline
    const timeline = this.generateTimeline(moveDate, distance, estimatedMovingDays);

    // Generate checklist
    const checklist = this.generateChecklist(moveId, moveDate);

    // Initialize inventory
    const inventory = this.initializeInventory(moveId, details.numberOfRooms);

    // Initialize utilities setup
    const utilities = this.initializeUtilities(moveId);

    // Initialize address changes
    const addressChanges = this.initializeAddressChanges(moveId);

    // Initialize budget
    const budget = this.initializeBudget(moveId, distance, details.numberOfRooms);

    const plan: MovingPlan = {
      id: moveId,
      userId,
      propertyId,
      moveDate: moveDate.toISOString(),
      currentAddress,
      newAddress,
      distance,
      numberOfRooms: details.numberOfRooms,
      householdSize: details.householdSize,
      hasPets: details.hasPets,
      hasVehicles: details.hasVehicles,
      status: 'planning',
      timeline,
      checklist,
      quotes: [],
      inventory,
      utilities,
      addressChanges,
      budget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return plan;
  }

  /**
   * Generates moving timeline with milestones
   */
  private generateTimeline(
    moveDate: Date,
    distance: number,
    estimatedDays: number
  ): MovingTimeline {
    const milestones: MovingTimeline['milestones'] = [];

    // 8 weeks before: Start planning
    milestones.push({
      id: 'milestone-1',
      title: 'Start Planning',
      description: 'Begin researching movers and creating moving budget',
      deadline: new Date(moveDate.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'planning',
      isCompleted: false,
      priority: 'high',
    });

    // 6 weeks before: Book movers
    milestones.push({
      id: 'milestone-2',
      title: 'Book Moving Company',
      description: 'Compare quotes and book your moving company',
      deadline: new Date(moveDate.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'planning',
      isCompleted: false,
      priority: 'high',
    });

    // 4 weeks before: Start packing
    milestones.push({
      id: 'milestone-3',
      title: 'Start Packing Non-Essentials',
      description: 'Begin packing items you won\'t need before the move',
      deadline: new Date(moveDate.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'packing',
      isCompleted: false,
      priority: 'medium',
    });

    // 2 weeks before: Schedule utilities
    milestones.push({
      id: 'milestone-4',
      title: 'Schedule Utility Transfers',
      description: 'Arrange disconnection and connection of all utilities',
      deadline: new Date(moveDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'utilities',
      isCompleted: false,
      priority: 'high',
    });

    // 1 week before: Final preparations
    milestones.push({
      id: 'milestone-5',
      title: 'Final Preparations',
      description: 'Pack essentials bag, confirm with movers, prepare current home',
      deadline: new Date(moveDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'packing',
      isCompleted: false,
      priority: 'high',
    });

    // Moving day
    milestones.push({
      id: 'milestone-6',
      title: 'Moving Day',
      description: 'Coordinate with movers and oversee the move',
      deadline: moveDate.toISOString(),
      category: 'moving',
      isCompleted: false,
      priority: 'high',
    });

    // 1 week after: Settle in
    milestones.push({
      id: 'milestone-7',
      title: 'Settle In',
      description: 'Unpack essentials and set up new home',
      deadline: new Date(moveDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'settling_in',
      isCompleted: false,
      priority: 'medium',
    });

    return {
      moveDate: moveDate.toISOString(),
      currentAddress: '',
      newAddress: '',
      distance,
      estimatedMovingDays: estimatedDays,
      milestones,
    };
  }

  /**
   * Generates comprehensive moving checklist
   */
  private generateChecklist(moveId: string, moveDate: Date): MovingChecklist {
    const tasks: MovingChecklist['tasks'] = [
      // 8 weeks before
      {
        id: 'task-1',
        title: 'Research moving companies',
        description: 'Get quotes from at least 3 moving companies',
        category: 'before_move',
        weeksBeforeMove: 8,
        isCompleted: false,
      },
      {
        id: 'task-2',
        title: 'Create moving budget',
        category: 'before_move',
        weeksBeforeMove: 8,
        isCompleted: false,
      },
      {
        id: 'task-3',
        title: 'Start decluttering',
        description: 'Donate, sell, or discard items you don\'t need',
        category: 'before_move',
        weeksBeforeMove: 8,
        isCompleted: false,
      },

      // 6 weeks before
      {
        id: 'task-4',
        title: 'Book moving company',
        category: 'before_move',
        weeksBeforeMove: 6,
        isCompleted: false,
      },
      {
        id: 'task-5',
        title: 'Order packing supplies',
        description: 'Boxes, tape, bubble wrap, markers',
        category: 'before_move',
        weeksBeforeMove: 6,
        isCompleted: false,
      },
      {
        id: 'task-6',
        title: 'Notify landlord (if renting)',
        category: 'administrative',
        weeksBeforeMove: 6,
        isCompleted: false,
      },

      // 4 weeks before
      {
        id: 'task-7',
        title: 'Start packing non-essentials',
        category: 'before_move',
        weeksBeforeMove: 4,
        isCompleted: false,
      },
      {
        id: 'task-8',
        title: 'Update address with important institutions',
        description: 'Banks, insurance, subscriptions',
        category: 'administrative',
        weeksBeforeMove: 4,
        isCompleted: false,
      },
      {
        id: 'task-9',
        title: 'Arrange school transfers (if applicable)',
        category: 'administrative',
        weeksBeforeMove: 4,
        isCompleted: false,
      },

      // 2 weeks before
      {
        id: 'task-10',
        title: 'Schedule utility transfers',
        description: 'Electricity, gas, water, internet',
        category: 'utilities',
        weeksBeforeMove: 2,
        isCompleted: false,
      },
      {
        id: 'task-11',
        title: 'Arrange mail forwarding',
        category: 'administrative',
        weeksBeforeMove: 2,
        isCompleted: false,
      },
      {
        id: 'task-12',
        title: 'Deep clean current home',
        category: 'cleaning',
        weeksBeforeMove: 2,
        isCompleted: false,
      },

      // 1 week before
      {
        id: 'task-13',
        title: 'Pack essentials bag',
        description: 'Items you\'ll need immediately in new home',
        category: 'before_move',
        weeksBeforeMove: 1,
        isCompleted: false,
      },
      {
        id: 'task-14',
        title: 'Confirm with movers',
        category: 'before_move',
        weeksBeforeMove: 1,
        isCompleted: false,
      },
      {
        id: 'task-15',
        title: 'Defrost refrigerator',
        category: 'before_move',
        weeksBeforeMove: 1,
        isCompleted: false,
      },

      // Moving day
      {
        id: 'task-16',
        title: 'Oversee loading',
        category: 'moving_day',
        weeksBeforeMove: 0,
        isCompleted: false,
      },
      {
        id: 'task-17',
        title: 'Do final walkthrough',
        category: 'moving_day',
        weeksBeforeMove: 0,
        isCompleted: false,
      },
      {
        id: 'task-18',
        title: 'Document condition with photos',
        category: 'moving_day',
        weeksBeforeMove: 0,
        isCompleted: false,
      },

      // After move
      {
        id: 'task-19',
        title: 'Unpack essentials',
        category: 'after_move',
        weeksBeforeMove: -1,
        isCompleted: false,
      },
      {
        id: 'task-20',
        title: 'Test all utilities',
        category: 'utilities',
        weeksBeforeMove: -1,
        isCompleted: false,
      },
      {
        id: 'task-21',
        title: 'Update driver\'s license',
        category: 'administrative',
        weeksBeforeMove: -2,
        isCompleted: false,
      },
    ];

    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const completionPercentage = (completedTasks / tasks.length) * 100;

    return {
      id: `checklist-${moveId}`,
      moveId,
      tasks,
      completionPercentage: Math.round(completionPercentage),
    };
  }

  /**
   * Initializes packing inventory
   */
  private initializeInventory(moveId: string, numberOfRooms: number): PackingInventory {
    const commonRooms = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Storage'];
    const rooms = commonRooms.slice(0, Math.min(numberOfRooms, 5));

    return {
      id: `inventory-${moveId}`,
      moveId,
      rooms: rooms.map((roomName) => ({
        name: roomName,
        boxes: [],
        totalBoxes: 0,
        packedBoxes: 0,
        completionPercentage: 0,
      })),
      totalBoxes: 0,
      totalPacked: 0,
      overallProgress: 0,
      specialItems: [],
    };
  }

  /**
   * Initializes utilities setup
   */
  private initializeUtilities(moveId: string): UtilitySetup {
    const commonUtilities: UtilitySetup['utilities'] = [
      {
        id: 'util-1',
        type: 'electricity',
        provider: '',
        status: 'not_started',
      },
      {
        id: 'util-2',
        type: 'gas',
        provider: '',
        status: 'not_started',
      },
      {
        id: 'util-3',
        type: 'water',
        provider: '',
        status: 'not_started',
      },
      {
        id: 'util-4',
        type: 'internet',
        provider: '',
        status: 'not_started',
      },
      {
        id: 'util-5',
        type: 'trash_collection',
        provider: '',
        status: 'not_started',
      },
    ];

    return {
      id: `utilities-${moveId}`,
      moveId,
      utilities: commonUtilities,
      completedUtilities: 0,
      totalUtilities: commonUtilities.length,
    };
  }

  /**
   * Initializes address change notifications
   */
  private initializeAddressChanges(moveId: string): AddressChange {
    const organizations: AddressChange['organizations'] = [
      {
        id: 'org-1',
        name: 'Postal Service',
        category: 'postal_service',
        priority: 'critical',
        isCompleted: false,
      },
      {
        id: 'org-2',
        name: 'Bank',
        category: 'bank',
        priority: 'critical',
        isCompleted: false,
      },
      {
        id: 'org-3',
        name: 'Insurance Company',
        category: 'insurance',
        priority: 'high',
        isCompleted: false,
      },
      {
        id: 'org-4',
        name: 'Employer',
        category: 'employer',
        priority: 'high',
        isCompleted: false,
      },
      {
        id: 'org-5',
        name: 'Tax Authority',
        category: 'government',
        priority: 'critical',
        isCompleted: false,
      },
      {
        id: 'org-6',
        name: 'Healthcare Provider',
        category: 'healthcare',
        priority: 'high',
        isCompleted: false,
      },
    ];

    return {
      id: `address-changes-${moveId}`,
      moveId,
      organizations,
      completedNotifications: 0,
      totalNotifications: organizations.length,
    };
  }

  /**
   * Initializes moving budget
   */
  private initializeBudget(moveId: string, distance: number, numberOfRooms: number): MovingBudget {
    // Estimate costs based on distance and size
    const movingCostEstimate = this.estimateMovingCost(distance, numberOfRooms);
    const packingSuppliesEstimate = numberOfRooms * 50; // €50 per room
    const cleaningEstimate = 200;
    const utilitiesDepositEstimate = 300;
    const miscellaneousEstimate = 200;

    const estimatedTotal =
      movingCostEstimate +
      packingSuppliesEstimate +
      cleaningEstimate +
      utilitiesDepositEstimate +
      miscellaneousEstimate;

    return {
      id: `budget-${moveId}`,
      moveId,
      estimatedTotal,
      actualTotal: 0,
      categories: [
        {
          name: 'Moving Company',
          budgeted: movingCostEstimate,
          actual: 0,
          expenses: [],
        },
        {
          name: 'Packing Supplies',
          budgeted: packingSuppliesEstimate,
          actual: 0,
          expenses: [],
        },
        {
          name: 'Cleaning Services',
          budgeted: cleaningEstimate,
          actual: 0,
          expenses: [],
        },
        {
          name: 'Utility Deposits',
          budgeted: utilitiesDepositEstimate,
          actual: 0,
          expenses: [],
        },
        {
          name: 'Miscellaneous',
          budgeted: miscellaneousEstimate,
          actual: 0,
          expenses: [],
        },
      ],
      variance: 0,
      variancePercentage: 0,
    };
  }

  /**
   * Adds a mover quote to the plan
   */
  public addMoverQuote(plan: MovingPlan, quote: MoverQuote): MovingPlan {
    return {
      ...plan,
      quotes: [...plan.quotes, quote],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compares mover quotes
   */
  public compareMoverQuotes(quotes: MoverQuote[]): {
    cheapest: MoverQuote;
    bestRated: MoverQuote | null;
    recommended: MoverQuote;
    insights: string[];
  } {
    if (quotes.length === 0) {
      throw new Error('No quotes to compare');
    }

    const cheapest = quotes.reduce((min, quote) =>
      quote.estimatedCost < min.estimatedCost ? quote : min
    );

    const ratedQuotes = quotes.filter((q) => q.rating !== undefined && q.rating > 0);
    const bestRated =
      ratedQuotes.length > 0
        ? ratedQuotes.reduce((max, quote) => (quote.rating! > max.rating! ? quote : max))
        : null;

    // Recommend based on balance of price and quality
    const recommended = quotes.reduce((best, quote) => {
      const quoteScore = this.calculateQuoteScore(quote);
      const bestScore = this.calculateQuoteScore(best);
      return quoteScore > bestScore ? quote : best;
    });

    const insights: string[] = [];

    insights.push(
      `${cheapest.companyName} offers the lowest price at €${Math.round(cheapest.estimatedCost).toLocaleString()}`
    );

    if (bestRated) {
      insights.push(
        `${bestRated.companyName} has the highest rating at ${bestRated.rating}/5 (${bestRated.reviewCount} reviews)`
      );
    }

    insights.push(
      `${recommended.companyName} is recommended for the best balance of price and quality`
    );

    const avgCost = quotes.reduce((sum, q) => sum + q.estimatedCost, 0) / quotes.length;
    insights.push(`Average quote: €${Math.round(avgCost).toLocaleString()}`);

    return {
      cheapest,
      bestRated,
      recommended,
      insights,
    };
  }

  /**
   * Calculates a score for a mover quote (0-100)
   */
  private calculateQuoteScore(quote: MoverQuote): number {
    let score = 50; // Base score

    // Price factor (cheaper = better, but not too cheap)
    const avgCost = 1000; // Placeholder average
    const priceRatio = quote.estimatedCost / avgCost;
    if (priceRatio < 0.7) {
      score -= 10; // Too cheap might be suspicious
    } else if (priceRatio < 0.9) {
      score += 20; // Good value
    } else if (priceRatio < 1.1) {
      score += 10; // Fair price
    } else {
      score -= 10; // Expensive
    }

    // Rating factor
    if (quote.rating) {
      score += (quote.rating / 5) * 30;
    }

    // Review count factor (more reviews = more reliable)
    if (quote.reviewCount > 50) {
      score += 10;
    } else if (quote.reviewCount > 20) {
      score += 5;
    }

    // Service type factor
    if (quote.serviceType === 'full_service') {
      score += 10; // Convenience
    }

    // Insurance factor
    if (quote.insurance.included) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateDistance(address1: string, address2: string): number {
    // In real implementation, use geocoding API
    // For now, return a placeholder
    return 50; // km
  }

  private estimateMovingDays(distance: number, numberOfRooms: number): number {
    // 1 day for local moves (< 100km)
    // 2-3 days for long distance
    if (distance < 100) {
      return 1;
    } else if (distance < 500) {
      return 2;
    } else {
      return 3;
    }
  }

  private estimateMovingCost(distance: number, numberOfRooms: number): number {
    // Base cost: €500 + €100 per room + €2 per km
    return 500 + numberOfRooms * 100 + distance * 2;
  }

  /**
   * Updates task completion status
   */
  public updateTaskStatus(
    plan: MovingPlan,
    taskId: string,
    isCompleted: boolean
  ): MovingPlan {
    const updatedTasks = plan.checklist.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted,
          completedDate: isCompleted ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    const completedCount = updatedTasks.filter((t) => t.isCompleted).length;
    const completionPercentage = (completedCount / updatedTasks.length) * 100;

    return {
      ...plan,
      checklist: {
        ...plan.checklist,
        tasks: updatedTasks,
        completionPercentage: Math.round(completionPercentage),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Gets overdue tasks
   */
  public getOverdueTasks(plan: MovingPlan): MovingChecklist['tasks'] {
    const now = new Date();
    const moveDate = new Date(plan.moveDate);
    const weeksUntilMove = Math.ceil(
      (moveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    return plan.checklist.tasks.filter((task) => {
      if (task.isCompleted) return false;
      return task.weeksBeforeMove >= weeksUntilMove;
    });
  }
}
