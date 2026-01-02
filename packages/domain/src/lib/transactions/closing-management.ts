/**
 * Closing & Transaction Management
 * Complete transaction tracking from offer to keys
 * Addresses major pain point: 38% of buyers say closing process was stressful/confusing
 * Average time from offer to close: 30-45 days with 40+ documents to manage
 */

import { z } from 'zod';

// ============================================================================
// TRANSACTION
// ============================================================================

/**
 * Complete real estate transaction
 */
export const RealEstateTransactionSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  buyerId: z.string(),
  sellerId: z.string().optional(),

  // Transaction details
  transactionType: z.enum(['purchase', 'sale', 'both']), // Both if trading up
  purchasePrice: z.number(),
  listPrice: z.number().optional(),
  offerPrice: z.number(),

  // Financing
  financingType: z.enum(['conventional', 'fha', 'va', 'usda', 'cash', 'other']),
  loanAmount: z.number().optional(),
  downPayment: z.number(),

  // Timeline
  offerDate: z.date(),
  acceptanceDate: z.date().optional(),
  estimatedClosingDate: z.date(),
  actualClosingDate: z.date().optional(),
  possessionDate: z.date().optional(),

  // Status
  status: z.enum([
    'offer_submitted',
    'offer_countered',
    'under_contract',
    'due_diligence',
    'contingencies_pending',
    'clear_to_close',
    'closed',
    'cancelled',
    'failed',
  ]),

  // Parties involved
  parties: z.object({
    buyerAgent: z.object({
      id: z.string(),
      name: z.string(),
      brokerage: z.string(),
      phone: z.string(),
      email: z.string().email(),
    }).optional(),

    sellerAgent: z.object({
      id: z.string(),
      name: z.string(),
      brokerage: z.string(),
      phone: z.string(),
      email: z.string().email(),
    }).optional(),

    lender: z.object({
      id: z.string(),
      name: z.string(),
      loanOfficer: z.string(),
      phone: z.string(),
      email: z.string().email(),
      loanNumber: z.string().optional(),
    }).optional(),

    titleCompany: z.object({
      name: z.string(),
      officer: z.string(),
      phone: z.string(),
      email: z.string().email(),
      orderNumber: z.string().optional(),
    }).optional(),

    escrowCompany: z.object({
      name: z.string(),
      officer: z.string(),
      phone: z.string(),
      email: z.string().email(),
      escrowNumber: z.string().optional(),
    }).optional(),

    homeInspector: z.object({
      name: z.string(),
      company: z.string(),
      phone: z.string(),
    }).optional(),

    appraiser: z.object({
      name: z.string(),
      company: z.string(),
    }).optional(),

    attorney: z.object({
      name: z.string(),
      firm: z.string(),
      phone: z.string(),
      email: z.string().email(),
    }).optional(),
  }),

  // Documents
  documents: z.array(z.object({
    id: z.string(),
    type: z.enum([
      // Offer documents
      'purchase_agreement',
      'earnest_money_receipt',
      'seller_disclosure',
      'lead_paint_disclosure',

      // Loan documents
      'loan_application',
      'pre_approval_letter',
      'loan_estimate',
      'closing_disclosure',
      'promissory_note',
      'deed_of_trust',

      // Inspection & appraisal
      'home_inspection_report',
      'appraisal_report',
      'pest_inspection',
      'survey',

      // Title documents
      'title_commitment',
      'title_insurance_policy',
      'deed',

      // Closing documents
      'final_walkthrough',
      'hud_settlement_statement',
      'closing_statement',

      // Other
      'insurance_policy',
      'hoa_documents',
      'warranty_deed',
      'other',
    ]),
    filename: z.string(),
    url: z.string().url(),
    uploadedBy: z.string(),
    uploadedAt: z.date(),
    requiresSignature: z.boolean(),
    signed: z.boolean(),
    signedAt: z.date().optional(),
  })),

  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type RealEstateTransaction = z.infer<typeof RealEstateTransactionSchema>;

// ============================================================================
// OFFER MANAGEMENT
// ============================================================================

/**
 * Purchase offer details and negotiations
 */
export const PurchaseOfferSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  propertyId: z.string(),
  buyerId: z.string(),

  // Offer details
  offerAmount: z.number(),
  earnestMoneyDeposit: z.number(),
  downPaymentAmount: z.number(),
  downPaymentPercentage: z.number(),
  financingType: z.enum(['conventional', 'fha', 'va', 'usda', 'cash']),

  // Terms
  terms: z.object({
    // Contingencies
    contingencies: z.array(z.enum([
      'financing',
      'inspection',
      'appraisal',
      'sale_of_current_home',
      'hoa_review',
      'title',
      'survey',
      'final_walkthrough',
    ])),

    // Timeline
    inspectionPeriod: z.number(), // Days
    financingContingencyPeriod: z.number(),
    closingPeriod: z.number(), // Days from acceptance
    possessionDate: z.enum(['at_closing', 'specific_date', 'days_after_closing']),
    specificPossessionDate: z.date().optional(),
    daysAfterClosing: z.number().optional(),

    // Inclusions/exclusions
    included: z.array(z.string()).optional(), // "Refrigerator", "Washer/Dryer"
    excluded: z.array(z.string()).optional(),

    // Seller concessions
    sellerConcessions: z.number(), // $ amount seller pays toward buyer costs
    sellerRepairs: z.enum(['none', 'agreed_upon', 'up_to_amount']).optional(),
    repairAmount: z.number().optional(),

    // Special terms
    escalationClause: z.boolean(),
    escalationDetails: z.object({
      maxPrice: z.number(),
      incrementAmount: z.number(),
      proofRequired: z.boolean(),
    }).optional(),

    rentback: z.boolean(), // Seller rents from buyer post-closing
    rentbackDetails: z.object({
      days: z.number(),
      dailyRate: z.number(),
      deposit: z.number(),
    }).optional(),
  }),

  // Expiration
  expiresAt: z.date(),

  // Status
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'countered',
    'accepted',
    'rejected',
    'expired',
    'withdrawn',
  ]),

  // Negotiation history
  negotiationHistory: z.array(z.object({
    date: z.date(),
    party: z.enum(['buyer', 'seller']),
    action: z.enum(['submitted', 'countered', 'accepted', 'rejected']),
    offerAmount: z.number(),
    changes: z.array(z.string()), // "Increased earnest money to $10k", "Removed inspection contingency"
  })).optional(),

  // Competitive situation
  competitiveSituation: z.object({
    multipleOffers: z.boolean(),
    estimatedOfferCount: z.number().optional(),
    highestAndBest: z.boolean(),
  }).optional(),

  createdAt: z.date(),
  acceptedAt: z.date().optional(),
});

export type PurchaseOffer = z.infer<typeof PurchaseOfferSchema>;

// ============================================================================
// CONTINGENCIES TRACKING
// ============================================================================

/**
 * Contingency tracking and deadlines
 */
export const ContingencyTrackerSchema = z.object({
  transactionId: z.string(),

  contingencies: z.array(z.object({
    id: z.string(),
    type: z.enum([
      'financing',
      'inspection',
      'appraisal',
      'sale_of_current_home',
      'hoa_review',
      'title',
      'survey',
      'final_walkthrough',
      'custom',
    ]),
    description: z.string(),

    // Deadline
    deadlineDate: z.date(),
    daysRemaining: z.number(),
    overdue: z.boolean(),

    // Status
    status: z.enum(['pending', 'in_progress', 'satisfied', 'waived', 'failed']),

    // Actions required
    actionsRequired: z.array(z.object({
      action: z.string(),
      responsible: z.enum(['buyer', 'seller', 'lender', 'inspector', 'other']),
      completed: z.boolean(),
      completedDate: z.date().optional(),
    })),

    // Result
    result: z.object({
      satisfied: z.boolean().optional(),
      waivedBy: z.enum(['buyer', 'seller']).optional(),
      waivedDate: z.date().optional(),
      failureReason: z.string().optional(),
    }).optional(),

    // Documents
    relatedDocuments: z.array(z.string()), // Document IDs

    // Notes
    notes: z.array(z.object({
      date: z.date(),
      author: z.string(),
      note: z.string(),
    })).optional(),
  })),

  // Overall status
  allContingenciesSatisfied: z.boolean(),
  failedContingencies: z.number(),
  pendingContingencies: z.number(),

  lastUpdated: z.date(),
});

export type ContingencyTracker = z.infer<typeof ContingencyTrackerSchema>;

// ============================================================================
// CLOSING COSTS
// ============================================================================

/**
 * Detailed closing cost breakdown
 */
export const ClosingCostsSchema = z.object({
  transactionId: z.string(),
  propertyId: z.string(),
  buyerId: z.string(),

  // Purchase details
  purchasePrice: z.number(),
  loanAmount: z.number(),
  downPayment: z.number(),

  // Buyer costs
  buyerCosts: z.object({
    // Loan costs
    loanCosts: z.object({
      originationFee: z.number(),
      applicationFee: z.number(),
      underwritingFee: z.number(),
      processingFee: z.number(),
      creditReportFee: z.number(),
      appraisalFee: z.number(),
      points: z.number(), // Discount points
    }),

    // Title & escrow
    titleEscrow: z.object({
      titleSearch: z.number(),
      titleInsurance: z.number(),
      escrowFee: z.number(),
      settlementFee: z.number(),
      notaryFee: z.number(),
      courierFee: z.number(),
    }),

    // Government fees
    government: z.object({
      recordingFees: z.number(),
      transferTax: z.number(),
      stampTax: z.number().optional(),
    }),

    // Inspections
    inspections: z.object({
      homeInspection: z.number(),
      pestInspection: z.number().optional(),
      radonTest: z.number().optional(),
      septicInspection: z.number().optional(),
      wellInspection: z.number().optional(),
      survey: z.number().optional(),
    }),

    // Prepaid items
    prepaids: z.object({
      homeownersInsurance: z.number(), // 1 year prepaid
      propertyTaxReserve: z.number(), // Months in escrow
      propertyTaxDaily: z.number(), // Prorated
      hoaDues: z.number().optional(),
      prepaidInterest: z.number(), // From closing to month end
      mortgageInsurance: z.number().optional(), // If PMI
    }),

    // Other
    other: z.object({
      hoaTransferFee: z.number().optional(),
      homeBuyerProtection: z.number().optional(), // Home warranty
      attorneyFees: z.number().optional(),
      miscellaneous: z.number().optional(),
    }),

    totalBuyerCosts: z.number(),
  }),

  // Seller concessions
  sellerConcessions: z.number(),

  // Net cost to buyer
  netCostToBuyer: z.number(), // Total costs - seller concessions

  // Cash to close
  cashToClose: z.number(), // Down payment + net costs - earnest money

  // Earnest money applied
  earnestMoneyCredit: z.number(),

  // Estimate vs actual
  estimateType: z.enum(['initial_estimate', 'loan_estimate', 'closing_disclosure', 'final']),

  // Comparison
  comparison: z.object({
    loanEstimateTotal: z.number().optional(),
    closingDisclosureTotal: z.number().optional(),
    variance: z.number().optional(),
    variances: z.array(z.object({
      item: z.string(),
      estimated: z.number(),
      actual: z.number(),
      difference: z.number(),
    })).optional(),
  }).optional(),

  generatedAt: z.date(),
});

export type ClosingCosts = z.infer<typeof ClosingCostsSchema>;

// ============================================================================
// TRANSACTION TIMELINE
// ============================================================================

/**
 * Transaction timeline with milestones and deadlines
 */
export const TransactionTimelineSchema = z.object({
  transactionId: z.string(),

  // Key dates
  keyDates: z.object({
    offerAccepted: z.date(),
    estimatedClosing: z.date(),
    actualClosing: z.date().optional(),
  }),

  // Milestones
  milestones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum([
      'offer',
      'financing',
      'inspection',
      'appraisal',
      'title',
      'closing_prep',
      'closing',
    ]),
    description: z.string(),

    // Timeline
    dueDate: z.date(),
    completedDate: z.date().optional(),

    // Status
    status: z.enum(['upcoming', 'due_soon', 'overdue', 'completed', 'cancelled']),
    completed: z.boolean(),

    // Dependencies
    dependencies: z.array(z.string()).optional(), // Milestone IDs that must be completed first
    blocks: z.array(z.string()).optional(), // Milestone IDs that depend on this

    // Responsible party
    responsibleParty: z.enum(['buyer', 'seller', 'lender', 'title_company', 'agent', 'attorney', 'inspector']),

    // Critical path
    isCritical: z.boolean(), // Delays would delay closing

    // Reminders
    reminders: z.array(z.object({
      daysB efore: z.number(),
      sent: z.boolean(),
      sentAt: z.date().optional(),
    })).optional(),
  })),

  // Progress
  progress: z.object({
    totalMilestones: z.number(),
    completedMilestones: z.number(),
    upcomingMilestones: z.number(),
    overdueMilestones: z.number(),
    percentComplete: z.number().min(0).max(100),

    estimatedDaysToClose: z.number(),
    onTrackForClosing: z.boolean(),
  }),

  // Critical path
  criticalPath: z.array(z.string()), // Milestone IDs on critical path

  lastUpdated: z.date(),
});

export type TransactionTimeline = z.infer<typeof TransactionTimelineSchema>;

// ============================================================================
// FINAL WALKTHROUGH
// ============================================================================

/**
 * Final walkthrough checklist and issues
 */
export const FinalWalkthroughSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  propertyId: z.string(),

  // Scheduling
  scheduledDate: z.date(),
  completedDate: z.date().optional(),

  // Attendees
  attendees: z.array(z.object({
    role: z.enum(['buyer', 'buyer_agent', 'seller', 'seller_agent', 'other']),
    name: z.string(),
  })),

  // Checklist
  checklist: z.array(z.object({
    category: z.enum([
      'systems',
      'appliances',
      'agreed_repairs',
      'included_items',
      'cleanliness',
      'utilities',
      'damage',
      'other',
    ]),
    item: z.string(),
    status: z.enum(['satisfactory', 'issue', 'not_applicable']),
    issue: z.string().optional(),
    resolution: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
  })),

  // Issues found
  issues: z.array(z.object({
    description: z.string(),
    severity: z.enum(['minor', 'moderate', 'major', 'critical']),
    photos: z.array(z.string().url()).optional(),
    resolution: z.enum(['seller_will_fix', 'credit_at_closing', 'buyer_accepts_as_is', 'negotiate']).optional(),
    resolutionAmount: z.number().optional(),
    resolved: z.boolean(),
  })).optional(),

  // Overall result
  result: z.enum(['approved', 'approved_with_conditions', 'issues_require_resolution', 'rejected']),

  // Signatures
  buyerSignature: z.object({
    signed: z.boolean(),
    signedAt: z.date().optional(),
    signatureUrl: z.string().url().optional(),
  }),

  notes: z.string().optional(),

  createdAt: z.date(),
});

export type FinalWalkthrough = z.infer<typeof FinalWalkthroughSchema>;

// ============================================================================
// CLOSING DAY
// ============================================================================

/**
 * Closing day checklist and details
 */
export const ClosingDaySchema = z.object({
  transactionId: z.string(),

  // Closing details
  closingDate: z.date(),
  closingTime: z.string(),
  location: z.object({
    type: z.enum(['title_company', 'attorney_office', 'escrow_office', 'remote']),
    name: z.string(),
    address: z.string(),
    phone: z.string(),
  }),

  // Required attendees
  requiredAttendees: z.array(z.object({
    role: z.enum(['buyer', 'seller', 'buyer_agent', 'seller_agent', 'title_officer', 'attorney', 'lender_rep']),
    name: z.string(),
    confirmed: z.boolean(),
  })),

  // Items to bring
  buyerChecklist: z.array(z.object({
    item: z.string(),
    required: z.boolean(),
    obtained: z.boolean(),
    notes: z.string().optional(),
  })),

  // Final numbers
  finalNumbers: z.object({
    purchasePrice: z.number(),
    loanAmount: z.number(),
    cashToClose: z.number(),
    fundsWired: z.boolean(),
    wireConfirmation: z.string().optional(),
  }),

  // Documents to sign
  documentsToSign: z.array(z.object({
    documentName: z.string(),
    pageCount: z.number(),
    signed: z.boolean(),
  })),

  // Keys & access
  keysAndAccess: z.object({
    keysReceived: z.boolean(),
    garageDoorOpeners: z.number(),
    mailboxKey: z.boolean(),
    securityCodes: z.boolean(),
    otherAccessItems: z.array(z.string()).optional(),
  }).optional(),

  // Status
  status: z.enum(['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled']),
  completedAt: z.date().optional(),

  // Post-closing
  recordedAt: z.date().optional(), // When deed is recorded
  recordingNumber: z.string().optional(),

  createdAt: z.date(),
});

export type ClosingDay = z.infer<typeof ClosingDaySchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export const TransactionSchemas = {
  RealEstateTransaction: RealEstateTransactionSchema,
  PurchaseOffer: PurchaseOfferSchema,
  ContingencyTracker: ContingencyTrackerSchema,
  ClosingCosts: ClosingCostsSchema,
  TransactionTimeline: TransactionTimelineSchema,
  FinalWalkthrough: FinalWalkthroughSchema,
  ClosingDay: ClosingDaySchema,
};
