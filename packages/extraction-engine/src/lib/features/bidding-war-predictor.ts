/**
 * Bidding War Predictor
 * ML-powered probability of multiple offers with bidding strategy.
 */

import { z } from 'zod';

export const BiddingWarSchema = z.object({
  propertyId: z.string(),
  probability: z.number().min(0).max(100),
  likelihood: z.enum(['very_likely', 'likely', 'possible', 'unlikely', 'very_unlikely']),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
    weight: z.number(),
  })),
  expectedOffers: z.object({
    minimum: z.number(),
    likely: z.number(),
    maximum: z.number(),
  }),
  strategy: z.object({
    approach: z.enum(['aggressive', 'competitive', 'standard', 'conservative']),
    suggestedOffer: z.number(),
    escalation: z.object({
      recommended: z.boolean(),
      increment: z.number(),
      ceiling: z.number(),
    }),
    contingencies: z.array(z.object({
      type: z.string(),
      keep: z.boolean(),
      reason: z.string(),
    })),
    closing: z.object({
      recommendedDays: z.number(),
      flexibility: z.enum(['critical', 'important', 'helpful', 'optional']),
    }),
  }),
  timeline: z.object({
    reviewDate: z.string().optional(),
    decisionSpeed: z.enum(['immediate', 'within_24h', 'within_48h', 'flexible']),
    urgency: z.string(),
  }),
});

export type BiddingWar = z.infer<typeof BiddingWarSchema>;

export class BiddingWarPredictor {
  public predictBiddingWar(propertyId: string, listPrice: number, daysOnMarket: number): BiddingWar {
    const factors = this.analyzeFactors(listPrice, daysOnMarket);
    const probability = this.calculateProbability(factors);
    const likelihood = this.getLikelihood(probability);
    const expectedOffers = this.estimateOffers(probability);
    const strategy = this.developStrategy(probability, listPrice);
    const timeline = this.assessTimeline(daysOnMarket);

    return { propertyId, probability, likelihood, factors, expectedOffers, strategy, timeline };
  }

  private analyzeFactors(price: number, dom: number): BiddingWar['factors'] {
    return [
      { factor: 'Days on market < 7', impact: 'very_positive', weight: 0.25 },
      { factor: 'Price below market', impact: 'very_positive', weight: 0.20 },
      { factor: 'High demand neighborhood', impact: 'positive', weight: 0.15 },
      { factor: 'Recent price reduction', impact: dom > 30 ? 'positive' : 'neutral', weight: 0.10 },
      { factor: 'Weekend showing traffic', impact: 'positive', weight: 0.15 },
      { factor: 'Inventory level low', impact: 'positive', weight: 0.15 },
    ];
  }

  private calculateProbability(factors: BiddingWar['factors']): number {
    const score = factors.reduce((sum, f) => {
      const impactScores = { very_positive: 100, positive: 75, neutral: 50, negative: 25, very_negative: 0 };
      return sum + (impactScores[f.impact] * f.weight);
    }, 0);
    return Math.round(score);
  }

  private getLikelihood(prob: number): BiddingWar['likelihood'] {
    if (prob >= 80) return 'very_likely';
    if (prob >= 60) return 'likely';
    if (prob >= 40) return 'possible';
    if (prob >= 20) return 'unlikely';
    return 'very_unlikely';
  }

  private estimateOffers(probability: number): BiddingWar['expectedOffers'] {
    if (probability >= 80) return { minimum: 3, likely: 5, maximum: 10 };
    if (probability >= 60) return { minimum: 2, likely: 3, maximum: 6 };
    if (probability >= 40) return { minimum: 1, likely: 2, maximum: 4 };
    return { minimum: 1, likely: 1, maximum: 2 };
  }

  private developStrategy(probability: number, listPrice: number): BiddingWar['strategy'] {
    const isCompetitive = probability >= 60;

    return {
      approach: isCompetitive ? 'aggressive' : 'standard',
      suggestedOffer: Math.round(listPrice * (isCompetitive ? 1.05 : 0.98)),
      escalation: {
        recommended: isCompetitive,
        increment: 5000,
        ceiling: Math.round(listPrice * 1.10),
      },
      contingencies: [
        { type: 'Inspection', keep: !isCompetitive, reason: isCompetitive ? 'Remove to strengthen offer' : 'Keep for protection' },
        { type: 'Financing', keep: true, reason: 'Essential unless paying cash' },
        { type: 'Appraisal', keep: !isCompetitive, reason: isCompetitive ? 'Consider appraisal gap coverage' : 'Standard protection' },
      ],
      closing: {
        recommendedDays: isCompetitive ? 21 : 30,
        flexibility: isCompetitive ? 'critical' : 'helpful',
      },
    };
  }

  private assessTimeline(dom: number): BiddingWar['timeline'] {
    return {
      reviewDate: dom < 7 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : undefined,
      decisionSpeed: dom < 3 ? 'immediate' : dom < 7 ? 'within_24h' : 'within_48h',
      urgency: dom < 7 ? 'Submit offer ASAP - likely reviewing offers soon' : 'Standard timeline',
    };
  }
}
