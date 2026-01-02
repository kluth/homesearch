/**
 * Property History & HOA Due Diligence
 * Comprehensive property records, ownership history, permits, violations, and HOA research
 * Critical for informed decisions - 47% of buyers discover problems during due diligence
 * HOA issues are #2 regret for condo/townhome buyers
 */

import { z } from 'zod';

// ============================================================================
// PROPERTY OWNERSHIP HISTORY
// ============================================================================

/**
 * Complete ownership history of a property
 */
export const OwnershipHistorySchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Current ownership
  currentOwner: z.object({
    name: z.string(), // Public record
    ownershipType: z.enum(['individual', 'married_couple', 'llc', 'trust', 'corporation', 'government']),
    purchaseDate: z.date(),
    purchasePrice: z.number(),
    yearsOwned: z.number(),
    ownerOccupied: z.boolean().optional(),
  }),

  // Historical ownership
  previousOwners: z.array(z.object({
    name: z.string(),
    purchaseDate: z.date(),
    saleDate: z.date(),
    purchasePrice: z.number(),
    salePrice: z.number(),
    yearsOwned: z.number(),
    appreciation: z.number(), // Percentage
  })).optional(),

  // Title chain
  titleChain: z.object({
    clean: z.boolean(),
    issues: z.array(z.object({
      type: z.enum(['lien', 'judgment', 'easement', 'encumbrance', 'dispute']),
      description: z.string(),
      recordedDate: z.date(),
      resolved: z.boolean(),
      resolvedDate: z.date().optional(),
    })).optional(),
  }),

  // Sales history
  salesHistory: z.array(z.object({
    date: z.date(),
    price: z.number(),
    pricePerSqFt: z.number().optional(),
    saleType: z.enum(['mls', 'fsbo', 'foreclosure', 'short_sale', 'estate', 'relocation', 'unknown']),
    daysOnMarket: z.number().optional(),
  })),

  // Tax assessment history
  taxHistory: z.array(z.object({
    year: z.number(),
    assessedValue: z.number(),
    landValue: z.number(),
    improvementValue: z.number(),
    taxAmount: z.number(),
  })),

  lastUpdated: z.date(),
});

export type OwnershipHistory = z.infer<typeof OwnershipHistorySchema>;

// ============================================================================
// BUILDING PERMITS & RENOVATIONS
// ============================================================================

/**
 * Building permits and renovation history
 */
export const PermitHistorySchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // All permits
  permits: z.array(z.object({
    id: z.string(),
    permitNumber: z.string(),
    type: z.enum([
      'new_construction',
      'addition',
      'remodel',
      'electrical',
      'plumbing',
      'hvac',
      'roofing',
      'windows_doors',
      'deck_patio',
      'pool',
      'fence',
      'demolition',
      'other',
    ]),
    description: z.string(),

    // Status
    status: z.enum(['issued', 'in_progress', 'completed', 'finaled', 'expired', 'revoked']),

    // Dates
    issuedDate: z.date(),
    completedDate: z.date().optional(),
    finaledDate: z.date().optional(),
    expiredDate: z.date().optional(),

    // Value & scope
    estimatedCost: z.number().optional(),
    contractor: z.string().optional(),
    contractorLicense: z.string().optional(),

    // Red flags
    redFlags: z.array(z.object({
      type: z.enum(['never_finaled', 'expired_without_completion', 'revoked', 'unpermitted_work_suspected']),
      description: z.string(),
      severity: z.enum['low', 'medium', 'high'],
    })).optional(),
  })),

  // Summary
  summary: z.object({
    totalPermits: z.number(),
    unfinaledPermits: z.number(), // Completed but never got final inspection
    expiredPermits: z.number(),
    majorRenovations: z.number(),
    lastMajorRenovationYear: z.number().optional(),

    // Concerns
    concerns: z.array(z.string()).optional(),
  }),

  // Unpermitted work detected
  suspectedUnpermittedWork: z.array(z.object({
    suspicion: z.string(),
    basis: z.string(), // "Addition visible in photos but no permit on record"
    recommendation: z.string(),
  })).optional(),

  lastUpdated: z.date(),
});

export type PermitHistory = z.infer<typeof PermitHistorySchema>;

// ============================================================================
// CODE VIOLATIONS
// ============================================================================

/**
 * Code violations and citations
 */
export const ViolationHistorySchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Current violations (unresolved)
  currentViolations: z.array(z.object({
    id: z.string(),
    violationType: z.enum([
      'building_code',
      'zoning',
      'fire_code',
      'health',
      'safety',
      'maintenance',
      'occupancy',
      'environmental',
    ]),
    description: z.string(),
    issuedDate: z.date(),
    deadline: z.date().optional(),
    fine: z.number().optional(),
    severity: z.enum(['minor', 'moderate', 'serious', 'critical']),

    status: z.enum(['open', 'in_compliance', 'appealed', 'legal_action']),

    // Impact on sale
    mustResolveBeforeSale: z.boolean(),
    estimatedCostToFix: z.number().optional(),
  })),

  // Historical violations (resolved)
  historicalViolations: z.array(z.object({
    violationType: z.enum([
      'building_code',
      'zoning',
      'fire_code',
      'health',
      'safety',
      'maintenance',
      'occupancy',
      'environmental',
    ]),
    description: z.string(),
    issuedDate: z.date(),
    resolvedDate: z.date(),
    fine: z.number().optional(),
  })).optional(),

  // Summary
  summary: z.object({
    totalCurrentViolations: z.number(),
    totalHistoricalViolations: z.number(),
    pattern: z.enum(['none', 'isolated', 'recurring', 'chronic']),
    concernLevel: z.enum(['none', 'low', 'moderate', 'high']),
  }),

  lastUpdated: z.date(),
});

export type ViolationHistory = z.infer<typeof ViolationHistorySchema>;

// ============================================================================
// HOA INFORMATION
// ============================================================================

/**
 * Comprehensive HOA research
 */
export const HOAInformationSchema = z.object({
  id: z.string(),
  propertyId: z.string(),

  // Basic info
  hasHOA: z.boolean(),
  hoaName: z.string().optional(),
  managementCompany: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
    website: z.string().url().optional(),
  }).optional(),

  // Fees
  fees: z.object({
    monthlyFee: z.number(),
    annualFee: z.number(),
    specialAssessments: z.array(z.object({
      purpose: z.string(),
      amount: z.number(),
      dueDate: z.date(),
      oneTime: z.boolean(),
    })).optional(),

    // Fee history
    feeHistory: z.array(z.object({
      year: z.number(),
      monthlyFee: z.number(),
      percentIncrease: z.number(),
    })).optional(),

    nextIncrease: z.object({
      effectiveDate: z.date(),
      newMonthlyFee: z.number(),
      percentIncrease: z.number(),
    }).optional(),

    includesUtilities: z.array(z.enum(['water', 'sewer', 'trash', 'gas', 'cable', 'internet'])).optional(),
  }).optional(),

  // Financial health
  financialHealth: z.object({
    reserves: z.number(), // Total reserve fund
    reservesPerUnit: z.number(),
    percentFunded: z.number(), // % of ideal reserve level
    operatingBudget: z.number(), // Annual
    delinquencyRate: z.number(), // % of owners behind on fees

    rating: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
    concerns: z.array(z.string()).optional(),

    // Reserve study
    lastReserveStudy: z.date().optional(),
    upcomingCapitalExpenses: z.array(z.object({
      item: z.string(), // "Roof replacement", "Elevator upgrade"
      estimatedCost: z.number(),
      estimatedYear: z.number(),
      funded: z.boolean(),
    })).optional(),
  }).optional(),

  // Rules & Restrictions
  rules: z.object({
    // Rental restrictions
    rentals: z.object({
      allowed: z.boolean(),
      restrictions: z.string().optional(), // "Maximum 30% rental units", "Minimum lease 6 months"
      currentRentalPercentage: z.number().optional(),
      waitlist: z.boolean(),
    }).optional(),

    // Pet policy
    pets: z.object({
      allowed: z.boolean(),
      restrictions: z.string().optional(), // "Dogs under 25 lbs", "Maximum 2 pets"
      deposit: z.number().optional(),
    }).optional(),

    // Parking
    parking: z.object({
      assignedSpaces: z.number(),
      guestParking: z.boolean(),
      restrictions: z.string().optional(),
    }).optional(),

    // Modifications
    exteriorModifications: z.object({
      requiresApproval: z.boolean(),
      restrictions: z.array(z.string()).optional(), // "No satellite dishes", "Pre-approved paint colors only"
    }).optional(),

    // Common restrictions
    commonRestrictions: z.array(z.string()).optional(), // "No clotheslines", "No storage on balconies"
  }).optional(),

  // Amenities
  amenities: z.array(z.enum([
    'pool',
    'gym',
    'clubhouse',
    'tennis',
    'basketball',
    'playground',
    'dog_park',
    'concierge',
    'security',
    'guest_suite',
    'business_center',
    'storage',
  ])).optional(),

  // Litigation
  litigation: z.object({
    currentLawsuits: z.array(z.object({
      description: z.string(),
      filedDate: z.date(),
      status: z.enum(['active', 'settled', 'dismissed']),
      potentialImpact: z.enum(['low', 'moderate', 'high']),
    })).optional(),

    historicalLawsuits: z.number(),
    hasConstructionDefectClaims: z.boolean(),
  }).optional(),

  // Owner satisfaction
  ownerSatisfaction: z.object({
    rating: z.number().min(1).max(5).optional(),
    reviewCount: z.number(),
    commonComplaints: z.array(z.string()).optional(),
    commonPraise: z.array(z.string()).optional(),
  }).optional(),

  // Board info
  board: z.object({
    meetingFrequency: z.string().optional(), // "Monthly", "Quarterly"
    ownersCanAttend: z.boolean(),
    minutesAvailable: z.boolean(),
    currentBoardMembers: z.number().optional(),
    electionProcess: z.string().optional(),
  }).optional(),

  // Documents available
  documents: z.object({
    ccrsAvailable: z.boolean(), // Covenants, Conditions & Restrictions
    bylawsAvailable: z.boolean(),
    budgetAvailable: z.boolean(),
    reserveStudyAvailable: z.boolean(),
    meetingMinutesAvailable: z.boolean(),

    documentLinks: z.array(z.object({
      type: z.enum(['ccrs', 'bylaws', 'budget', 'reserve_study', 'minutes', 'other']),
      filename: z.string(),
      url: z.string().url(),
      lastUpdated: z.date().optional(),
    })).optional(),
  }),

  // Overall assessment
  overallAssessment: z.object({
    score: z.number().min(0).max(100),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),

    redFlags: z.array(z.object({
      type: z.enum([
        'financial_issues',
        'litigation',
        'special_assessments',
        'declining_reserves',
        'deferred_maintenance',
        'restrictive_rules',
        'management_issues',
      ]),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
    })).optional(),

    strengths: z.array(z.string()).optional(),
    concerns: z.array(z.string()).optional(),

    recommendation: z.enum(['proceed_confidently', 'proceed_with_caution', 'investigate_further', 'reconsider']),
  }),

  lastUpdated: z.date(),
});

export type HOAInformation = z.infer<typeof HOAInformationSchema>;

// ============================================================================
// PROPERTY LIENS & ENCUMBRANCES
// ============================================================================

/**
 * Liens, judgments, and encumbrances
 */
export const LienEncumbranceSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Active liens
  activeLiens: z.array(z.object({
    id: z.string(),
    type: z.enum([
      'mortgage',
      'tax_lien',
      'mechanics_lien',
      'judgment_lien',
      'hoa_lien',
      'child_support',
      'irs_lien',
      'other',
    ]),
    holder: z.string(),
    amount: z.number(),
    recordedDate: z.date(),
    priority: z.number(), // 1 = first lien, 2 = second, etc.

    mustBePaidAtClosing: z.boolean(),
    impact: z.enum(['none', 'minor', 'moderate', 'major', 'deal_breaker']),
  })),

  // Easements
  easements: z.array(z.object({
    type: z.enum(['utility', 'access', 'drainage', 'conservation', 'solar', 'other']),
    description: z.string(),
    recordedDate: z.date(),
    beneficiary: z.string(), // "City water department", "Neighboring property"
    impactOnUse: z.enum(['minimal', 'moderate', 'significant']),
  })).optional(),

  // Deed restrictions
  deedRestrictions: z.array(z.object({
    description: z.string(),
    recordedDate: z.date(),
    expirationDate: z.date().optional(),
    enforceableBy: z.string(),
  })).optional(),

  // Summary
  summary: z.object({
    totalLiens: z.number(),
    totalLienAmount: z.number(),
    titleClearance: z.enum(['clear', 'minor_issues', 'significant_issues', 'major_problems']),
    recommendation: z.string(),
  }),

  lastUpdated: z.date(),
});

export type LienEncumbrance = z.infer<typeof LienEncumbranceSchema>;

// ============================================================================
// COMPREHENSIVE DUE DILIGENCE REPORT
// ============================================================================

/**
 * Complete due diligence report
 */
export const DueDiligenceReportSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // All components
  ownershipHistory: OwnershipHistorySchema,
  permitHistory: PermitHistorySchema,
  violations: ViolationHistorySchema,
  hoaInfo: HOAInformationSchema.optional(),
  liensEncumbrances: LienEncumbranceSchema,

  // Overall risk assessment
  riskAssessment: z.object({
    overallRisk: z.enum(['low', 'moderate', 'elevated', 'high']),
    score: z.number().min(0).max(100), // Higher = lower risk

    riskFactors: z.array(z.object({
      category: z.enum(['title', 'permits', 'violations', 'hoa', 'liens', 'legal']),
      issue: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      recommendation: z.string(),
    })),
  }),

  // Action items
  actionItems: z.array(z.object({
    priority: z.enum(['must_do', 'should_do', 'nice_to_do']),
    action: z.string(),
    estimatedCost: z.number().optional(),
    timeframe: z.string(), // "Before closing", "Within 90 days"
  })),

  // Professional recommendations
  recommendedProfessionals: z.array(z.object({
    type: z.enum(['attorney', 'title_company', 'home_inspector', 'contractor', 'hoa_attorney', 'surveyor']),
    reason: z.string(),
  })).optional(),

  generatedAt: z.date(),
  validUntil: z.date(), // Should be refreshed before closing
});

export type DueDiligenceReport = z.infer<typeof DueDiligenceReportSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const DueDiligenceSchemas = {
  OwnershipHistory: OwnershipHistorySchema,
  PermitHistory: PermitHistorySchema,
  ViolationHistory: ViolationHistorySchema,
  HOAInformation: HOAInformationSchema,
  LienEncumbrance: LienEncumbranceSchema,
  DueDiligenceReport: DueDiligenceReportSchema,
};
