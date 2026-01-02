/**
 * Property Comparison Tools
 * Side-by-side comparison of properties with intelligent insights
 */

import { z } from 'zod';

// ============================================================================
// COMPARISON SESSION
// ============================================================================

/**
 * Property comparison session for a user
 */
export const PropertyComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),

  // Properties being compared (2-4 recommended)
  propertyIds: z.array(z.string()).min(2).max(6),

  // Comparison preferences
  focusAreas: z.array(z.enum([
    'price',
    'location',
    'size',
    'schools',
    'investment',
    'amenities',
    'condition',
    'commute',
  ])).optional(),

  // Metadata
  createdAt: z.date(),
  lastViewedAt: z.date(),
  shared: z.boolean().default(false), // Shared with partner/family
  shareLink: z.string().optional(),
});

export type PropertyComparison = z.infer<typeof PropertyComparisonSchema>;

// ============================================================================
// COMPARISON ANALYSIS
// ============================================================================

/**
 * Key differences between properties
 */
export const ComparisonDifferenceSchema = z.object({
  category: z.string(), // "Price", "Square Footage", "School Rating"
  propertyValues: z.record(z.any()), // propertyId -> value
  significance: z.enum(['critical', 'important', 'minor']),
  explanation: z.string(), // "Property A costs $50k more but has 500 sq ft more space"
});

/**
 * Winners in each category
 */
export const ComparisonWinnerSchema = z.object({
  category: z.string(),
  winner: z.string(), // propertyId
  reason: z.string(),
  margin: z.string().optional(), // "by 20%", "by $100k"
});

/**
 * Detailed comparison analysis with AI insights
 */
export const ComparisonAnalysisSchema = z.object({
  comparisonId: z.string(),
  propertyIds: z.array(z.string()),

  // Key differences
  differences: z.array(ComparisonDifferenceSchema),

  // Category winners
  winners: z.array(ComparisonWinnerSchema),

  // Overall scores
  scores: z.record(z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.record(z.number()), // category -> score
  })), // propertyId -> scores

  // Side-by-side comparison
  sideBy Side: z.object({
    // Price & Affordability
    price: z.record(z.object({
      listPrice: z.number(),
      pricePerSqFt: z.number(),
      monthlyPayment: z.number().optional(),
      affordabilityScore: z.number().optional(),
    })),

    // Size & Space
    size: z.record(z.object({
      squareFeet: z.number(),
      bedrooms: z.number(),
      bathrooms: z.number(),
      lotSize: z.number().optional(),
      garageSpaces: z.number().optional(),
    })),

    // Location & Commute
    location: z.record(z.object({
      address: z.string(),
      neighborhood: z.string(),
      walkScore: z.number().optional(),
      transitScore: z.number().optional(),
      commuteMinutes: z.number().optional(),
    })),

    // Schools (if applicable)
    schools: z.record(z.object({
      elementaryRating: z.number().optional(),
      middleRating: z.number().optional(),
      highRating: z.number().optional(),
      averageRating: z.number().optional(),
    })).optional(),

    // Investment metrics (if applicable)
    investment: z.record(z.object({
      estimatedRent: z.number().optional(),
      capRate: z.number().optional(),
      cashOnCash: z.number().optional(),
      appreciation: z.number().optional(),
    })).optional(),

    // Condition & Age
    condition: z.record(z.object({
      yearBuilt: z.number(),
      age: z.number(),
      lastRenovated: z.number().optional(),
      conditionRating: z.enum(['excellent', 'good', 'fair', 'needs_work']).optional(),
      estimatedRepairs: z.number().optional(),
    })),

    // Amenities & Features
    amenities: z.record(z.object({
      pool: z.boolean(),
      fireplace: z.boolean(),
      ac: z.boolean(),
      heating: z.string().optional(),
      smartHome: z.boolean(),
      solarPanels: z.boolean(),
      updated Kitchen: z.boolean(),
      hardwoodFloors: z.boolean(),
    })),

    // HOA & Fees
    fees: z.record(z.object({
      hoaFee: z.number().optional(),
      propertyTax: z.number().optional(),
      insurance: z.number().optional(),
      totalMonthlyFees: z.number().optional(),
    })),
  }),

  // AI-generated insights
  insights: z.array(z.object({
    type: z.enum(['best_value', 'best_investment', 'best_schools', 'best_location', 'red_flag', 'hidden_gem']),
    propertyId: z.string(),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['critical', 'important', 'minor']),
  })),

  // Trade-offs
  tradeoffs: z.array(z.object({
    description: z.string(), // "Property A has better schools but Property B has lower monthly costs"
    propertyA: z.string(),
    propertyB: z.string(),
    consideration: z.string(), // "If schools are your priority, choose Property A"
  })),

  // Recommendation
  recommendation: z.object({
    topChoice: z.string(), // propertyId
    confidence: z.enum(['low', 'medium', 'high']),
    reasoning: z.string(),
    alternativeIfbudgetTight: z.string().optional(),
    alternativeIfPriorityChanges: z.string().optional(),
  }).optional(),

  generatedAt: z.date(),
});

export type ComparisonAnalysis = z.infer<typeof ComparisonAnalysisSchema>;

// ============================================================================
// COMPARISON MATRIX
// ============================================================================

/**
 * Customizable comparison matrix
 */
export const ComparisonMatrixSchema = z.object({
  comparisonId: z.string(),

  // Columns (properties)
  properties: z.array(z.object({
    propertyId: z.string(),
    thumbnail: z.string().url(),
    address: z.string(),
  })),

  // Rows (attributes to compare)
  attributes: z.array(z.object({
    category: z.string(), // "Price & Affordability"
    attributes: z.array(z.object({
      name: z.string(), // "List Price"
      values: z.record(z.any()), // propertyId -> value
      format: z.enum(['currency', 'number', 'percentage', 'text', 'boolean', 'rating']),
      highlight: z.enum(['higher_better', 'lower_better', 'neutral']).default('neutral'),
    })),
  })),

  // User customization
  customAttributes: z.array(z.object({
    name: z.string(),
    values: z.record(z.string()), // User-entered notes per property
  })).optional(),

  // Visual highlighting
  highlights: z.record(z.object({ // propertyId -> highlights
    bestValues: z.array(z.string()), // Attribute names where this property wins
    concerns: z.array(z.string()), // Attribute names with concerns
  })),
});

export type ComparisonMatrix = z.infer<typeof ComparisonMatrixSchema>;

// ============================================================================
// COMPARISON REPORT
// ============================================================================

/**
 * Exportable comparison report
 */
export const ComparisonReportSchema = z.object({
  comparisonId: z.string(),
  userId: z.string(),

  // Report metadata
  title: z.string().default('Property Comparison Report'),
  generatedAt: z.date(),
  properties: z.array(z.string()), // Property IDs

  // Sections
  sections: z.array(z.object({
    type: z.enum([
      'executive_summary',
      'price_comparison',
      'location_analysis',
      'school_comparison',
      'investment_analysis',
      'pros_cons',
      'recommendations',
      'detailed_matrix',
    ]),
    title: z.string(),
    content: z.any(), // Flexible content structure
    order: z.number(),
  })),

  // Export options
  format: z.enum(['pdf', 'excel', 'html', 'json']).default('pdf'),

  // Sharing
  shared: z.boolean().default(false),
  sharedWith: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    accessLevel: z.enum(['view', 'comment']),
  })).optional(),

  // Collaboration notes
  notes: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    propertyId: z.string().optional(), // Null = general note
    note: z.string(),
    createdAt: z.date(),
  })).optional(),
});

export type ComparisonReport = z.infer<typeof ComparisonReportSchema>;

// ============================================================================
// AUTOMATED COMPARISON SUGGESTIONS
// ============================================================================

/**
 * Suggest similar properties to add to comparison
 */
export const ComparisonSuggestionSchema = z.object({
  comparisonId: z.string(),
  currentPropertyIds: z.array(z.string()),

  suggestions: z.array(z.object({
    propertyId: z.string(),
    reason: z.string(), // "Similar price but better schools"
    similarity: z.number().min(0).max(1), // 0-1 similarity score
    advantages: z.array(z.string()), // What this property offers
    disadvantages: z.array(z.string()), // What this property lacks
    worthComparing: z.boolean(),
  })),

  generatedAt: z.date(),
});

export type ComparisonSuggestion = z.infer<typeof ComparisonSuggestionSchema>;

// ============================================================================
// DECISION FRAMEWORK
// ============================================================================

/**
 * Help users weigh their priorities
 */
export const DecisionFrameworkSchema = z.object({
  comparisonId: z.string(),
  userId: z.string(),

  // User's priorities (weighted)
  priorities: z.array(z.object({
    factor: z.enum([
      'price',
      'location',
      'schools',
      'size',
      'condition',
      'commute',
      'investment_potential',
      'amenities',
      'neighborhood_quality',
      'future_resale',
    ]),
    weight: z.number().min(1).max(10), // How important (1-10)
  })),

  // Calculated scores per property
  propertyScores: z.record(z.object({ // propertyId -> score
    totalScore: z.number(),
    weightedBreakdown: z.record(z.number()), // factor -> weighted score
  })),

  // Recommendation based on priorities
  recommendation: z.object({
    propertyId: z.string(),
    score: z.number(),
    match: z.number().min(0).max(100), // % match with priorities
    reasoning: z.array(z.string()),
  }),

  // What-if scenarios
  scenarios: z.array(z.object({
    name: z.string(), // "If budget is tight", "If schools are #1 priority"
    adjustedPriorities: z.record(z.number()), // factor -> adjusted weight
    newRecommendation: z.string(), // propertyId
    explanation: z.string(),
  })).optional(),
});

export type DecisionFramework = z.infer<typeof DecisionFrameworkSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const ComparisonSchemas = {
  PropertyComparison: PropertyComparisonSchema,
  ComparisonAnalysis: ComparisonAnalysisSchema,
  ComparisonMatrix: ComparisonMatrixSchema,
  ComparisonReport: ComparisonReportSchema,
  ComparisonSuggestion: ComparisonSuggestionSchema,
  DecisionFramework: DecisionFrameworkSchema,
};
