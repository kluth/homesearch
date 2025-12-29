/**
 * Offer Tracker
 *
 * Comprehensive system for managing property offers, counter-offers,
 * and negotiations throughout the buying process.
 *
 * Features:
 * - Offer creation and submission tracking
 * - Counter-offer management
 * - Negotiation timeline and history
 * - Contingency tracking
 * - Deadline management and reminders
 * - Offer comparison and strategy
 * - Communication logging
 * - Document attachment
 * - Success metrics and analytics
 *
 * @module OfferTracker
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const ContingencySchema = z.object({
  type: z.enum([
    'financing',
    'inspection',
    'appraisal',
    'sale_of_current_home',
    'attorney_review',
    'title_search',
    'homeowners_association',
    'other',
  ]),
  description: z.string(),
  deadlineDate: z.string().datetime(),
  isCompleted: z.boolean().default(false),
  completedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const OfferTermsSchema = z.object({
  offerPrice: z.number().positive(),
  downPaymentAmount: z.number().nonnegative(),
  downPaymentPercent: z.number().min(0).max(100),
  financingType: z.enum(['cash', 'conventional', 'fha', 'va', 'usda', 'other']),
  closingDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  contingencies: z.array(ContingencySchema).default([]),
  earnestMoneyDeposit: z.number().nonnegative(),
  escalationClause: z
    .object({
      maxPrice: z.number().positive(),
      incrementAmount: z.number().positive(),
      capAmount: z.number().positive().optional(),
    })
    .optional(),
  sellerConcessions: z.number().nonnegative().default(0),
  includesPersonalProperty: z.array(z.string()).default([]),
  specialConditions: z.array(z.string()).default([]),
});

export const OfferSchema = z.object({
  id: z.string(),
  userId: z.string(),
  propertyId: z.string(),
  propertyAddress: z.string(),
  listingPrice: z.number().positive(),
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'countered',
    'accepted',
    'rejected',
    'withdrawn',
    'expired',
  ]),
  terms: OfferTermsSchema,
  submittedDate: z.string().datetime().optional(),
  responseDeadline: z.string().datetime().optional(),
  sellerResponseDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  notes: z.string().optional(),
  agentName: z.string().optional(),
  agentContact: z.string().optional(),
  sellerAgentName: z.string().optional(),
  sellerAgentContact: z.string().optional(),
  documentIds: z.array(z.string()).default([]),
});

export const CounterOfferSchema = z.object({
  id: z.string(),
  originalOfferId: z.string(),
  counterNumber: z.number().int().positive(),
  fromParty: z.enum(['buyer', 'seller']),
  terms: OfferTermsSchema,
  submittedDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  status: z.enum(['pending', 'accepted', 'rejected', 'countered_again']),
  responseDate: z.string().datetime().optional(),
  changes: z.array(
    z.object({
      field: z.string(),
      previousValue: z.any(),
      newValue: z.any(),
      reasoning: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
});

export const NegotiationHistorySchema = z.object({
  offerId: z.string(),
  timeline: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string().datetime(),
      eventType: z.enum([
        'offer_created',
        'offer_submitted',
        'counter_offer_received',
        'counter_offer_sent',
        'offer_accepted',
        'offer_rejected',
        'offer_withdrawn',
        'offer_expired',
        'inspection_completed',
        'financing_approved',
        'appraisal_completed',
        'contingency_removed',
        'note_added',
        'document_uploaded',
      ]),
      actor: z.enum(['buyer', 'seller', 'buyer_agent', 'seller_agent', 'system']),
      description: z.string(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  counterOffers: z.array(CounterOfferSchema).default([]),
  currentOffer: OfferSchema,
  totalNegotiationDays: z.number().int().nonnegative(),
  numberOfCounters: z.number().int().nonnegative(),
});

export const OfferStrategySchema = z.object({
  propertyId: z.string(),
  marketAnalysis: z.object({
    listingPrice: z.number(),
    averageListPrice: z.number(),
    averageSoldPrice: z.number(),
    daysOnMarket: z.number().int(),
    averageDaysOnMarket: z.number().int(),
    priceTrend: z.enum(['increasing', 'stable', 'decreasing']),
    competitionLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
  }),
  recommendedStrategy: z.enum([
    'lowball',
    'below_asking',
    'at_asking',
    'above_asking',
    'best_and_final',
  ]),
  suggestedOfferPrice: z.number(),
  suggestedOfferRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  strengthFactors: z.array(z.string()),
  weaknessFactors: z.array(z.string()),
  recommendations: z.array(z.string()),
  probabilityOfAcceptance: z.number().min(0).max(100),
});

export const OfferComparisonSchema = z.object({
  propertyId: z.string(),
  offers: z.array(
    z.object({
      offerId: z.string(),
      scenario: z.string(),
      offerPrice: z.number(),
      netCost: z.number(),
      estimatedMonthlyPayment: z.number(),
      acceptanceProbability: z.number(),
      strengthScore: z.number().min(0).max(100),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    })
  ),
  recommended: z.string(),
  insights: z.array(z.string()),
});

export const OfferAnalyticsSchema = z.object({
  userId: z.string(),
  totalOffersMade: z.number().int().nonnegative(),
  offersAccepted: z.number().int().nonnegative(),
  offersRejected: z.number().int().nonnegative(),
  offersWithdrawn: z.number().int().nonnegative(),
  offersExpired: z.number().int().nonnegative(),
  acceptanceRate: z.number().min(0).max(100),
  averageNegotiationDays: z.number(),
  averageCountersPerOffer: z.number(),
  averageOfferToListRatio: z.number(),
  averageFinalPriceReduction: z.number(),
  mostSuccessfulStrategy: z.string(),
  insights: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type Contingency = z.infer<typeof ContingencySchema>;
export type OfferTerms = z.infer<typeof OfferTermsSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type CounterOffer = z.infer<typeof CounterOfferSchema>;
export type NegotiationHistory = z.infer<typeof NegotiationHistorySchema>;
export type OfferStrategy = z.infer<typeof OfferStrategySchema>;
export type OfferComparison = z.infer<typeof OfferComparisonSchema>;
export type OfferAnalytics = z.infer<typeof OfferAnalyticsSchema>;

// ============================================================================
// Interfaces
// ============================================================================

export interface CreateOfferRequest {
  userId: string;
  propertyId: string;
  propertyAddress: string;
  listingPrice: number;
  terms: OfferTerms;
  agentName?: string;
  agentContact?: string;
  notes?: string;
}

export interface SubmitOfferRequest {
  offerId: string;
  responseDeadline?: string;
  additionalDocumentIds?: string[];
}

export interface CreateCounterOfferRequest {
  originalOfferId: string;
  fromParty: 'buyer' | 'seller';
  modifiedTerms: Partial<OfferTerms>;
  changes: CounterOffer['changes'];
  expirationDate: string;
  notes?: string;
}

export interface UpdateOfferStatusRequest {
  offerId: string;
  newStatus: Offer['status'];
  notes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Offer Tracker
// ============================================================================

export class OfferTracker {
  /**
   * Creates a new offer (draft state)
   */
  public createOffer(request: CreateOfferRequest): Offer {
    const offer: Offer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      propertyId: request.propertyId,
      propertyAddress: request.propertyAddress,
      listingPrice: request.listingPrice,
      status: 'draft',
      terms: request.terms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: request.notes,
      agentName: request.agentName,
      agentContact: request.agentContact,
      documentIds: [],
    };

    return offer;
  }

  /**
   * Submits an offer to the seller
   */
  public submitOffer(offer: Offer, request: SubmitOfferRequest): Offer {
    const submittedOffer: Offer = {
      ...offer,
      status: 'submitted',
      submittedDate: new Date().toISOString(),
      responseDeadline: request.responseDeadline,
      documentIds: [
        ...offer.documentIds,
        ...(request.additionalDocumentIds ?? []),
      ],
      updatedAt: new Date().toISOString(),
    };

    return submittedOffer;
  }

  /**
   * Creates a counter-offer
   */
  public createCounterOffer(
    originalOffer: Offer,
    existingCounters: CounterOffer[],
    request: CreateCounterOfferRequest
  ): CounterOffer {
    const counterNumber = existingCounters.length + 1;

    // Get the latest terms (from last counter or original)
    const latestTerms =
      existingCounters.length > 0
        ? existingCounters[existingCounters.length - 1].terms
        : originalOffer.terms;

    // Merge modified terms
    const newTerms: OfferTerms = {
      ...latestTerms,
      ...request.modifiedTerms,
    };

    const counterOffer: CounterOffer = {
      id: `counter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalOfferId: originalOffer.id,
      counterNumber,
      fromParty: request.fromParty,
      terms: newTerms,
      submittedDate: new Date().toISOString(),
      expirationDate: request.expirationDate,
      status: 'pending',
      changes: request.changes,
      notes: request.notes,
    };

    return counterOffer;
  }

  /**
   * Accepts a counter-offer
   */
  public acceptCounterOffer(
    offer: Offer,
    counterOffer: CounterOffer
  ): { offer: Offer; counterOffer: CounterOffer } {
    const updatedOffer: Offer = {
      ...offer,
      terms: counterOffer.terms,
      status: 'accepted',
      sellerResponseDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCounter: CounterOffer = {
      ...counterOffer,
      status: 'accepted',
      responseDate: new Date().toISOString(),
    };

    return {
      offer: updatedOffer,
      counterOffer: updatedCounter,
    };
  }

  /**
   * Rejects an offer or counter-offer
   */
  public rejectOffer(offer: Offer, rejectionReason?: string): Offer {
    return {
      ...offer,
      status: 'rejected',
      sellerResponseDate: new Date().toISOString(),
      notes: rejectionReason
        ? `${offer.notes ? offer.notes + '\n\n' : ''}Rejection reason: ${rejectionReason}`
        : offer.notes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Withdraws an offer
   */
  public withdrawOffer(offer: Offer, withdrawalReason?: string): Offer {
    return {
      ...offer,
      status: 'withdrawn',
      notes: withdrawalReason
        ? `${offer.notes ? offer.notes + '\n\n' : ''}Withdrawal reason: ${withdrawalReason}`
        : offer.notes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates contingency status
   */
  public updateContingency(
    offer: Offer,
    contingencyType: Contingency['type'],
    updates: Partial<Contingency>
  ): Offer {
    const updatedContingencies = offer.terms.contingencies.map((c) => {
      if (c.type === contingencyType) {
        return { ...c, ...updates };
      }
      return c;
    });

    return {
      ...offer,
      terms: {
        ...offer.terms,
        contingencies: updatedContingencies,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Removes a contingency
   */
  public removeContingency(offer: Offer, contingencyType: Contingency['type']): Offer {
    const updatedContingencies = offer.terms.contingencies.map((c) => {
      if (c.type === contingencyType) {
        return {
          ...c,
          isCompleted: true,
          completedDate: new Date().toISOString(),
        };
      }
      return c;
    });

    return {
      ...offer,
      terms: {
        ...offer.terms,
        contingencies: updatedContingencies,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates negotiation history
   */
  public getNegotiationHistory(
    offer: Offer,
    counterOffers: CounterOffer[]
  ): NegotiationHistory {
    const timeline: NegotiationHistory['timeline'] = [];

    // Add offer creation event
    timeline.push({
      id: `event-${Date.now()}-1`,
      timestamp: offer.createdAt,
      eventType: 'offer_created',
      actor: 'buyer',
      description: `Offer created for €${offer.terms.offerPrice.toLocaleString()}`,
    });

    // Add submission event
    if (offer.submittedDate) {
      timeline.push({
        id: `event-${Date.now()}-2`,
        timestamp: offer.submittedDate,
        eventType: 'offer_submitted',
        actor: 'buyer',
        description: 'Offer submitted to seller',
      });
    }

    // Add counter-offer events
    counterOffers.forEach((counter, index) => {
      timeline.push({
        id: `event-counter-${counter.id}`,
        timestamp: counter.submittedDate,
        eventType: counter.fromParty === 'seller' ? 'counter_offer_received' : 'counter_offer_sent',
        actor: counter.fromParty === 'seller' ? 'seller' : 'buyer',
        description: `Counter-offer #${counter.counterNumber}: €${counter.terms.offerPrice.toLocaleString()}`,
        metadata: {
          changes: counter.changes,
        },
      });

      if (counter.responseDate) {
        timeline.push({
          id: `event-counter-response-${counter.id}`,
          timestamp: counter.responseDate,
          eventType:
            counter.status === 'accepted' ? 'offer_accepted' : 'offer_rejected',
          actor: counter.fromParty === 'seller' ? 'buyer' : 'seller',
          description: `Counter-offer #${counter.counterNumber} ${counter.status}`,
        });
      }
    });

    // Add final status event
    if (offer.status === 'accepted' && offer.sellerResponseDate) {
      timeline.push({
        id: `event-${Date.now()}-accepted`,
        timestamp: offer.sellerResponseDate,
        eventType: 'offer_accepted',
        actor: 'seller',
        description: 'Offer accepted!',
      });
    } else if (offer.status === 'rejected' && offer.sellerResponseDate) {
      timeline.push({
        id: `event-${Date.now()}-rejected`,
        timestamp: offer.sellerResponseDate,
        eventType: 'offer_rejected',
        actor: 'seller',
        description: 'Offer rejected',
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate negotiation duration
    const firstEvent = new Date(timeline[0].timestamp);
    const lastEvent = new Date(timeline[timeline.length - 1].timestamp);
    const totalDays = Math.ceil(
      (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      offerId: offer.id,
      timeline,
      counterOffers,
      currentOffer: offer,
      totalNegotiationDays: totalDays,
      numberOfCounters: counterOffers.length,
    };
  }

  /**
   * Generates offer strategy recommendations
   */
  public generateOfferStrategy(
    propertyId: string,
    listingPrice: number,
    marketData: {
      averageListPrice: number;
      averageSoldPrice: number;
      daysOnMarket: number;
      averageDaysOnMarket: number;
      recentSales: Array<{ listPrice: number; soldPrice: number }>;
      activeListings: number;
    }
  ): OfferStrategy {
    // Analyze price trends
    const listToSoldRatio =
      marketData.recentSales.length > 0
        ? marketData.recentSales.reduce((sum, sale) => sum + sale.soldPrice / sale.listPrice, 0) /
          marketData.recentSales.length
        : 0.97; // Default to 97% if no data

    const priceTrend: OfferStrategy['marketAnalysis']['priceTrend'] =
      listingPrice > marketData.averageListPrice * 1.05
        ? 'increasing'
        : listingPrice < marketData.averageListPrice * 0.95
        ? 'decreasing'
        : 'stable';

    // Determine competition level
    const competitionLevel: OfferStrategy['marketAnalysis']['competitionLevel'] =
      marketData.daysOnMarket < 7 || marketData.activeListings > 20
        ? 'very_high'
        : marketData.daysOnMarket < 15
        ? 'high'
        : marketData.daysOnMarket < 30
        ? 'moderate'
        : 'low';

    // Recommend strategy
    let recommendedStrategy: OfferStrategy['recommendedStrategy'];
    let suggestedOfferPrice: number;

    if (competitionLevel === 'very_high') {
      recommendedStrategy = 'above_asking';
      suggestedOfferPrice = listingPrice * 1.03; // 3% above asking
    } else if (competitionLevel === 'high') {
      recommendedStrategy = 'at_asking';
      suggestedOfferPrice = listingPrice;
    } else if (marketData.daysOnMarket > 60) {
      recommendedStrategy = 'lowball';
      suggestedOfferPrice = listingPrice * 0.90; // 10% below asking
    } else {
      recommendedStrategy = 'below_asking';
      suggestedOfferPrice = listingPrice * 0.95; // 5% below asking
    }

    // Adjust based on list-to-sold ratio
    suggestedOfferPrice = Math.round(suggestedOfferPrice * listToSoldRatio);

    const suggestedOfferRange = {
      min: Math.round(listingPrice * (listToSoldRatio - 0.05)),
      max: Math.round(listingPrice * (listToSoldRatio + 0.02)),
    };

    // Identify strength and weakness factors
    const strengthFactors: string[] = [];
    const weaknessFactors: string[] = [];

    if (competitionLevel === 'low' || competitionLevel === 'moderate') {
      strengthFactors.push('Low competition gives you negotiating power');
    } else {
      weaknessFactors.push('High competition may require stronger offer');
    }

    if (marketData.daysOnMarket > marketData.averageDaysOnMarket) {
      strengthFactors.push('Property has been on market longer than average');
    }

    if (priceTrend === 'decreasing') {
      strengthFactors.push('Market prices are trending down');
    } else if (priceTrend === 'increasing') {
      weaknessFactors.push('Market prices are trending up');
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (competitionLevel === 'very_high') {
      recommendations.push('Consider an escalation clause to stay competitive');
      recommendations.push('Minimize contingencies to strengthen your offer');
      recommendations.push('Offer a quick closing date if possible');
    }

    if (marketData.daysOnMarket > 60) {
      recommendations.push('Seller may be motivated - negotiate confidently');
      recommendations.push('Request seller concessions for closing costs');
    }

    recommendations.push('Get pre-approved for financing to show you\'re a serious buyer');
    recommendations.push('Include a personal letter to the seller');

    // Calculate probability of acceptance
    let probability = 50; // Base 50%

    if (recommendedStrategy === 'above_asking') probability += 30;
    else if (recommendedStrategy === 'at_asking') probability += 20;
    else if (recommendedStrategy === 'below_asking') probability += 5;
    else if (recommendedStrategy === 'lowball') probability -= 20;

    if (competitionLevel === 'low') probability += 15;
    else if (competitionLevel === 'very_high') probability -= 15;

    if (marketData.daysOnMarket > 60) probability += 10;

    probability = Math.max(10, Math.min(90, probability));

    return {
      propertyId,
      marketAnalysis: {
        listingPrice,
        averageListPrice: marketData.averageListPrice,
        averageSoldPrice: marketData.averageSoldPrice,
        daysOnMarket: marketData.daysOnMarket,
        averageDaysOnMarket: marketData.averageDaysOnMarket,
        priceTrend,
        competitionLevel,
      },
      recommendedStrategy,
      suggestedOfferPrice,
      suggestedOfferRange,
      strengthFactors,
      weaknessFactors,
      recommendations,
      probabilityOfAcceptance: Math.round(probability),
    };
  }

  /**
   * Compares multiple offer scenarios
   */
  public compareOfferScenarios(
    propertyId: string,
    listingPrice: number,
    scenarios: Array<{
      name: string;
      offerPrice: number;
      downPaymentPercent: number;
      interestRate: number;
      hasEscalation?: boolean;
      minimalContingencies?: boolean;
    }>
  ): OfferComparison {
    const offers = scenarios.map((scenario) => {
      const downPayment = scenario.offerPrice * (scenario.downPaymentPercent / 100);
      const loanAmount = scenario.offerPrice - downPayment;
      const monthlyRate = scenario.interestRate / 100 / 12;
      const numberOfPayments = 30 * 12;

      const monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      const netCost = scenario.offerPrice + monthlyPayment * numberOfPayments - loanAmount;

      // Calculate strength score
      let strengthScore = 50;

      const offerToListRatio = scenario.offerPrice / listingPrice;
      if (offerToListRatio >= 1.05) strengthScore += 30;
      else if (offerToListRatio >= 1.0) strengthScore += 20;
      else if (offerToListRatio >= 0.95) strengthScore += 5;
      else strengthScore -= 15;

      if (scenario.downPaymentPercent >= 20) strengthScore += 10;
      if (scenario.hasEscalation) strengthScore += 15;
      if (scenario.minimalContingencies) strengthScore += 10;

      strengthScore = Math.max(0, Math.min(100, strengthScore));

      const acceptanceProbability = strengthScore;

      const pros: string[] = [];
      const cons: string[] = [];

      if (scenario.offerPrice >= listingPrice) {
        pros.push('At or above asking price');
      } else {
        cons.push(`${Math.round(((listingPrice - scenario.offerPrice) / listingPrice) * 100)}% below asking`);
      }

      if (scenario.downPaymentPercent >= 20) {
        pros.push(`Strong ${scenario.downPaymentPercent}% down payment`);
      } else {
        cons.push('Lower down payment may be less competitive');
      }

      if (scenario.hasEscalation) {
        pros.push('Escalation clause protects against competing offers');
      }

      if (scenario.minimalContingencies) {
        pros.push('Minimal contingencies speed up closing');
      } else {
        cons.push('Multiple contingencies may delay closing');
      }

      pros.push(`Monthly payment: €${Math.round(monthlyPayment).toLocaleString()}`);

      return {
        offerId: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scenario: scenario.name,
        offerPrice: scenario.offerPrice,
        netCost,
        estimatedMonthlyPayment: monthlyPayment,
        acceptanceProbability,
        strengthScore,
        pros,
        cons,
      };
    });

    // Sort by strength score
    offers.sort((a, b) => b.strengthScore - a.strengthScore);

    const recommended = offers[0].offerId;

    const insights: string[] = [];

    insights.push(
      `"${offers[0].scenario}" has the highest probability of acceptance at ${offers[0].acceptanceProbability}%`
    );

    const lowestCost = offers.reduce((min, offer) => (offer.netCost < min.netCost ? offer : min));
    if (lowestCost.offerId !== recommended) {
      insights.push(
        `"${lowestCost.scenario}" has the lowest total cost at €${Math.round(lowestCost.netCost).toLocaleString()}`
      );
    }

    const lowestMonthly = offers.reduce((min, offer) =>
      offer.estimatedMonthlyPayment < min.estimatedMonthlyPayment ? offer : min
    );
    insights.push(
      `"${lowestMonthly.scenario}" has the lowest monthly payment at €${Math.round(lowestMonthly.estimatedMonthlyPayment).toLocaleString()}`
    );

    return {
      propertyId,
      offers,
      recommended,
      insights,
    };
  }

  /**
   * Calculates offer analytics for a user
   */
  public calculateAnalytics(offers: Offer[], counterOffers: CounterOffer[]): OfferAnalytics {
    const totalOffers = offers.length;
    const accepted = offers.filter((o) => o.status === 'accepted').length;
    const rejected = offers.filter((o) => o.status === 'rejected').length;
    const withdrawn = offers.filter((o) => o.status === 'withdrawn').length;
    const expired = offers.filter((o) => o.status === 'expired').length;

    const acceptanceRate = totalOffers > 0 ? (accepted / totalOffers) * 100 : 0;

    // Calculate average negotiation days for completed offers
    const completedOffers = offers.filter((o) =>
      ['accepted', 'rejected', 'withdrawn'].includes(o.status)
    );

    const avgNegotiationDays =
      completedOffers.length > 0
        ? completedOffers.reduce((sum, offer) => {
            if (!offer.submittedDate || !offer.sellerResponseDate) return sum;
            const days =
              (new Date(offer.sellerResponseDate).getTime() -
                new Date(offer.submittedDate).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedOffers.length
        : 0;

    // Average counters per offer
    const countersPerOffer =
      totalOffers > 0
        ? counterOffers.length / totalOffers
        : 0;

    // Average offer-to-list ratio
    const avgOfferToListRatio =
      totalOffers > 0
        ? offers.reduce((sum, offer) => sum + offer.terms.offerPrice / offer.listingPrice, 0) /
          totalOffers
        : 0;

    // Average final price reduction (for accepted offers)
    const acceptedOffers = offers.filter((o) => o.status === 'accepted');
    const avgFinalPriceReduction =
      acceptedOffers.length > 0
        ? acceptedOffers.reduce(
            (sum, offer) => sum + (offer.listingPrice - offer.terms.offerPrice),
            0
          ) / acceptedOffers.length
        : 0;

    // Determine most successful strategy
    const strategySuccess: Record<string, number> = {};

    acceptedOffers.forEach((offer) => {
      const ratio = offer.terms.offerPrice / offer.listingPrice;
      let strategy = '';

      if (ratio >= 1.05) strategy = 'Above Asking';
      else if (ratio >= 1.0) strategy = 'At Asking';
      else if (ratio >= 0.95) strategy = 'Below Asking';
      else strategy = 'Lowball';

      strategySuccess[strategy] = (strategySuccess[strategy] || 0) + 1;
    });

    const mostSuccessfulStrategy =
      Object.entries(strategySuccess).reduce(
        (max, [strategy, count]) => (count > max.count ? { strategy, count } : max),
        { strategy: 'N/A', count: 0 }
      ).strategy;

    // Generate insights
    const insights: string[] = [];

    if (acceptanceRate >= 75) {
      insights.push('Excellent acceptance rate - your offers are competitive!');
    } else if (acceptanceRate >= 50) {
      insights.push('Good acceptance rate - consider strengthening future offers');
    } else if (acceptanceRate < 30 && totalOffers >= 3) {
      insights.push('Low acceptance rate - you may be underoffering or facing high competition');
    }

    if (avgNegotiationDays < 7) {
      insights.push('Quick negotiations - you respond and decide efficiently');
    } else if (avgNegotiationDays > 14) {
      insights.push('Longer negotiations - consider faster decision-making');
    }

    if (countersPerOffer > 2) {
      insights.push('Multiple counters per offer - consider stronger initial offers');
    }

    if (mostSuccessfulStrategy !== 'N/A') {
      insights.push(`Your most successful strategy: ${mostSuccessfulStrategy}`);
    }

    return {
      userId: '', // Would be from context
      totalOffersMade: totalOffers,
      offersAccepted: accepted,
      offersRejected: rejected,
      offersWithdrawn: withdrawn,
      offersExpired: expired,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      averageNegotiationDays: Math.round(avgNegotiationDays * 10) / 10,
      averageCountersPerOffer: Math.round(countersPerOffer * 10) / 10,
      averageOfferToListRatio: Math.round(avgOfferToListRatio * 1000) / 1000,
      averageFinalPriceReduction: Math.round(avgFinalPriceReduction),
      mostSuccessfulStrategy,
      insights,
    };
  }

  /**
   * Checks for expiring offers and deadlines
   */
  public checkExpiringDeadlines(offers: Offer[]): Array<{
    offerId: string;
    propertyAddress: string;
    deadlineType: 'offer_expiration' | 'response_deadline' | 'contingency';
    deadlineDate: string;
    daysUntilDeadline: number;
    urgency: 'critical' | 'high' | 'medium';
  }> {
    const now = new Date();
    const deadlines: Array<{
      offerId: string;
      propertyAddress: string;
      deadlineType: 'offer_expiration' | 'response_deadline' | 'contingency';
      deadlineDate: string;
      daysUntilDeadline: number;
      urgency: 'critical' | 'high' | 'medium';
    }> = [];

    for (const offer of offers) {
      // Check offer expiration
      if (offer.terms.expirationDate && offer.status === 'submitted') {
        const expirationDate = new Date(offer.terms.expirationDate);
        const daysUntil = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 3 && daysUntil >= 0) {
          deadlines.push({
            offerId: offer.id,
            propertyAddress: offer.propertyAddress,
            deadlineType: 'offer_expiration',
            deadlineDate: offer.terms.expirationDate,
            daysUntilDeadline: daysUntil,
            urgency: daysUntil <= 1 ? 'critical' : 'high',
          });
        }
      }

      // Check contingency deadlines
      if (offer.status === 'accepted') {
        for (const contingency of offer.terms.contingencies) {
          if (!contingency.isCompleted) {
            const contingencyDate = new Date(contingency.deadlineDate);
            const daysUntil = Math.ceil(
              (contingencyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntil <= 7 && daysUntil >= 0) {
              deadlines.push({
                offerId: offer.id,
                propertyAddress: offer.propertyAddress,
                deadlineType: 'contingency',
                deadlineDate: contingency.deadlineDate,
                daysUntilDeadline: daysUntil,
                urgency: daysUntil <= 2 ? 'critical' : daysUntil <= 5 ? 'high' : 'medium',
              });
            }
          }
        }
      }
    }

    // Sort by urgency and days until deadline
    deadlines.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilDeadline - b.daysUntilDeadline;
    });

    return deadlines;
  }
}
