/**
 * New Construction Tracker
 * Track new developments, builder reputation, and construction progress.
 */

import { z } from 'zod';

export const NewConstructionSchema = z.object({
  propertyId: z.string(),
  development: z.object({
    name: z.string(),
    builder: z.string(),
    totalUnits: z.number(),
    unitsAvailable: z.number(),
    phase: z.enum(['planning', 'pre_construction', 'under_construction', 'near_completion', 'completed']),
    completionDate: z.string(),
    percentComplete: z.number(),
  }),
  builder: z.object({
    name: z.string(),
    rating: z.object({
      overall: z.number().min(0).max(5),
      quality: z.number(),
      onTime: z.number(),
      customerService: z.number(),
      value: z.number(),
    }),
    yearsInBusiness: z.number(),
    completedProjects: z.number(),
    activeWarranties: z.object({
      structural: z.number().describe('Years'),
      systems: z.number(),
      workmanship: z.number(),
    }),
    reviews: z.array(z.object({
      source: z.string(),
      rating: z.number(),
      count: z.number(),
    })),
  }),
  pricing: z.object({
    basePrice: z.number(),
    pricePerSqFt: z.number(),
    upgrades: z.array(z.object({
      category: z.string(),
      description: z.string(),
      cost: z.number(),
    })),
    incentives: z.array(z.object({
      type: z.string(),
      value: z.number(),
      description: z.string(),
      expiration: z.string().optional(),
    })),
    totalEstimated: z.number(),
  }),
  features: z.object({
    standardFeatures: z.array(z.string()),
    energyEfficiency: z.object({
      certification: z.string(),
      estimatedSavings: z.number(),
      features: z.array(z.string()),
    }),
    smartHome: z.array(z.string()),
    structuralWarranty: z.string(),
  }),
  timeline: z.object({
    permitApproved: z.string().optional(),
    constructionStart: z.string().optional(),
    framingComplete: z.string().optional(),
    dryInComplete: z.string().optional(),
    estimatedCompletion: z.string(),
    possessionDate: z.string().optional(),
    milestones: z.array(z.object({
      name: z.string(),
      completed: z.boolean(),
      date: z.string().optional(),
    })),
  }),
  comparisons: z.object({
    vsResale: z.object({
      resaleAverage: z.number(),
      difference: z.number(),
      advantages: z.array(z.string()),
      disadvantages: z.array(z.string()),
    }),
    vsOtherBuilders: z.array(z.object({
      builder: z.string(),
      similarModel: z.string(),
      price: z.number(),
      features: z.string(),
    })),
  }),
  financingOptions: z.object({
    builderPreferredLender: z.object({
      name: z.string(),
      incentive: z.number(),
      rate: z.number(),
    }),
    buyerLenderAllowed: z.boolean(),
    constructionLoan: z.object({
      required: z.boolean(),
      convertToMortgage: z.boolean(),
    }),
  }),
  risks: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'moderate', 'high']),
    mitigation: z.string(),
  })),
  inspection: z.object({
    preConstructionInspection: z.boolean(),
    framingInspection: z.boolean(),
    preDrywallInspection: z.boolean(),
    finalWalkthrough: z.boolean(),
    thirdPartyAllowed: z.boolean(),
  }),
});

export type NewConstruction = z.infer<typeof NewConstructionSchema>;

export class NewConstructionTracker {
  public trackNewConstruction(
    propertyId: string,
    developmentName: string,
    builderName: string,
    basePrice: number,
    estimatedCompletion: string
  ): NewConstruction {
    // Development info
    const development = {
      name: developmentName,
      builder: builderName,
      totalUnits: 85,
      unitsAvailable: 23,
      phase: 'under_construction' as const,
      completionDate: estimatedCompletion,
      percentComplete: 65,
    };

    // Builder reputation
    const builder = this.analyzeBuilder(builderName);

    // Pricing analysis
    const pricing = this.analyzePricing(basePrice);

    // Features
    const features = this.getFeatures();

    // Construction timeline
    const timeline = this.buildTimeline(estimatedCompletion);

    // Comparisons
    const comparisons = this.compareOptions(basePrice);

    // Financing options
    const financingOptions = {
      builderPreferredLender: {
        name: 'Builder Mortgage Co',
        incentive: 5000,
        rate: 6.25,
      },
      buyerLenderAllowed: true,
      constructionLoan: {
        required: false,
        convertToMortgage: true,
      },
    };

    // Risks
    const risks = this.identifyRisks(development.phase);

    // Inspection opportunities
    const inspection = {
      preConstructionInspection: true,
      framingInspection: true,
      preDrywallInspection: true,
      finalWalkthrough: true,
      thirdPartyAllowed: true,
    };

    return {
      propertyId,
      development,
      builder,
      pricing,
      features,
      timeline,
      comparisons,
      financingOptions,
      risks,
      inspection,
    };
  }

  private analyzeBuilder(name: string): NewConstruction['builder'] {
    return {
      name,
      rating: {
        overall: 4.2,
        quality: 4.5,
        onTime: 3.8,
        customerService: 4.0,
        value: 4.3,
      },
      yearsInBusiness: 28,
      completedProjects: 145,
      activeWarranties: {
        structural: 10,
        systems: 2,
        workmanship: 1,
      },
      reviews: [
        { source: 'BuilderTrend', rating: 4.3, count: 342 },
        { source: 'HomeOwnerReviews', rating: 4.1, count: 156 },
        { source: 'BBB', rating: 4.5, count: 89 },
      ],
    };
  }

  private analyzePricing(basePrice: number): NewConstruction['pricing'] {
    const upgrades: NewConstruction['pricing']['upgrades'] = [
      {
        category: 'Kitchen',
        description: 'Premium appliances package',
        cost: 12000,
      },
      {
        category: 'Flooring',
        description: 'Hardwood throughout main level',
        cost: 8500,
      },
      {
        category: 'Master Bath',
        description: 'Luxury tile and fixtures upgrade',
        cost: 6000,
      },
      {
        category: 'Smart Home',
        description: 'Complete automation package',
        cost: 5000,
      },
    ];

    const incentives: NewConstruction['pricing']['incentives'] = [
      {
        type: 'Closing cost credit',
        value: 8000,
        description: 'Builder pays up to $8,000 in closing costs',
        expiration: '2025-03-31',
      },
      {
        type: 'Rate buydown',
        value: 5000,
        description: '2-1 buydown with preferred lender',
      },
      {
        type: 'Free upgrades',
        value: 15000,
        description: 'Select from premium upgrade package',
        expiration: '2025-02-28',
      },
    ];

    const popularUpgrades = upgrades.slice(0, 2).reduce((sum, u) => sum + u.cost, 0);

    return {
      basePrice,
      pricePerSqFt: Math.round(basePrice / 200),
      upgrades,
      incentives,
      totalEstimated: basePrice + popularUpgrades,
    };
  }

  private getFeatures(): NewConstruction['features'] {
    return {
      standardFeatures: [
        'Energy Star certified appliances',
        'Granite countertops',
        'Smart thermostat',
        'USB outlets throughout',
        'LED lighting package',
        'Programmable irrigation system',
        'Architectural shingles - 30 year',
        'Covered patio',
      ],
      energyEfficiency: {
        certification: 'ENERGY STAR Certified Home',
        estimatedSavings: 2400,
        features: [
          'High-efficiency HVAC system',
          'Low-E windows',
          'Spray foam insulation',
          'LED lighting',
          'ENERGY STAR appliances',
          'Tankless water heater',
        ],
      },
      smartHome: [
        'Smart thermostat',
        'Video doorbell',
        'Smart garage door opener',
        'Pre-wired for security system',
        'CAT6 ethernet throughout',
      ],
      structuralWarranty: '10-year structural warranty included',
    };
  }

  private buildTimeline(completion: string): NewConstruction['timeline'] {
    const completionDate = new Date(completion);
    const start = new Date(completionDate);
    start.setMonth(start.getMonth() - 8);

    const milestones: NewConstruction['timeline']['milestones'] = [
      { name: 'Foundation poured', completed: true, date: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { name: 'Framing complete', completed: true, date: new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { name: 'Roof complete', completed: true, date: new Date(start.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { name: 'Windows installed', completed: true, date: new Date(start.getTime() + 135 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { name: 'Drywall complete', completed: false },
      { name: 'Interior finishes', completed: false },
      { name: 'Landscaping', completed: false },
      { name: 'Final inspection', completed: false },
    ];

    return {
      permitApproved: new Date(start.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      constructionStart: start.toISOString().slice(0, 10),
      framingComplete: milestones[1].date,
      dryInComplete: milestones[3].date,
      estimatedCompletion: completion,
      possessionDate: new Date(completionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      milestones,
    };
  }

  private compareOptions(basePrice: number): NewConstruction['comparisons'] {
    const resaleAverage = basePrice * 0.92;

    return {
      vsResale: {
        resaleAverage: Math.round(resaleAverage),
        difference: Math.round(basePrice - resaleAverage),
        advantages: [
          'Everything is new - no repairs needed',
          'Latest building codes and energy efficiency',
          'Customize finishes and upgrades',
          'Builder warranty coverage',
          'Modern floor plan and features',
        ],
        disadvantages: [
          'Higher price per square foot',
          'Wait time for construction',
          'Less mature landscaping',
          'Neighborhood still developing',
          'Potential for construction delays',
        ],
      },
      vsOtherBuilders: [
        {
          builder: 'Premium Homes',
          similarModel: 'Model 2400',
          price: basePrice + 15000,
          features: 'More upgrades standard, smaller lots',
        },
        {
          builder: 'Value Builders',
          similarModel: 'Classic Series',
          price: basePrice - 25000,
          features: 'Basic finishes, good value',
        },
      ],
    };
  }

  private identifyRisks(phase: string): NewConstruction['risks'] {
    return [
      {
        type: 'Construction delays',
        severity: 'moderate',
        mitigation: 'Include delay penalties in contract, rent-back clause if needed',
      },
      {
        type: 'Builder bankruptcy',
        severity: 'low',
        mitigation: 'Research builder financial stability, use escrow for deposits',
      },
      {
        type: 'Cost overruns on upgrades',
        severity: 'moderate',
        mitigation: 'Get all upgrade costs in writing, budget 10% cushion',
      },
      {
        type: 'Quality issues',
        severity: 'low',
        mitigation: 'Hire independent inspector at key milestones',
      },
      {
        type: 'Market appreciation risk',
        severity: 'low',
        mitigation: 'If market declines, new construction premium may not hold',
      },
    ];
  }
}
