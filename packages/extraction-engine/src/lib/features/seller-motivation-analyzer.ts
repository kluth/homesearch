/**
 * Seller Motivation Analyzer
 * Detect urgency signals from listing data and behavior patterns.
 */

import { z } from 'zod';

export const SellerMotivationSchema = z.object({
  propertyId: z.string(),
  motivationScore: z.number().min(0).max(100),
  level: z.enum(['very_motivated', 'motivated', 'moderate', 'flexible', 'firm']),
  signals: z.array(z.object({
    signal: z.string(),
    strength: z.enum(['strong', 'moderate', 'weak']),
    points: z.number(),
  })),
  analysis: z.object({
    priceHistory: z.object({
      originalPrice: z.number(),
      currentPrice: z.number(),
      reductions: z.number(),
      totalReduction: z.number(),
      reductionPercent: z.number(),
    }),
    timing: z.object({
      daysOnMarket: z.number(),
      seasonality: z.string(),
      urgencyLevel: z.enum(['high', 'moderate', 'low']),
    }),
    circumstances: z.array(z.string()),
  }),
  negotiation: z.object({
    strategy: z.string(),
    openingOffer: z.number(),
    expectedCounteroffer: z.number(),
    likelySettlement: z.number(),
    leverage: z.enum(['strong_buyer', 'buyer_advantage', 'balanced', 'seller_advantage']),
  }),
});

export type SellerMotivation = z.infer<typeof SellerMotivationSchema>;

export class SellerMotivationAnalyzer {
  public analyzeMotivation(propertyId: string, originalPrice: number, currentPrice: number, daysOnMarket: number): SellerMotivation {
    const signals = this.detectSignals(originalPrice, currentPrice, daysOnMarket);
    const motivationScore = this.calculateScore(signals);
    const level = this.getLevel(motivationScore);
    const analysis = this.performAnalysis(originalPrice, currentPrice, daysOnMarket);
    const negotiation = this.developNegotiationStrategy(motivationScore, currentPrice);

    return { propertyId, motivationScore, level, signals, analysis, negotiation };
  }

  private detectSignals(original: number, current: number, dom: number): SellerMotivation['signals'] {
    const signals: SellerMotivation['signals'] = [];

    if (current < original) {
      const reduction = ((original - current) / original) * 100;
      if (reduction > 10) signals.push({ signal: 'Major price reduction', strength: 'strong', points: 25 });
      else if (reduction > 5) signals.push({ signal: 'Significant price reduction', strength: 'moderate', points: 15 });
      else signals.push({ signal: 'Price reduction', strength: 'weak', points: 8 });
    }

    if (dom > 90) signals.push({ signal: 'Extended time on market', strength: 'strong', points: 20 });
    else if (dom > 60) signals.push({ signal: 'Long time on market', strength: 'moderate', points: 12 });
    else if (dom > 30) signals.push({ signal: 'Moderate time on market', strength: 'weak', points: 5 });

    if (dom > 60 && current < original * 0.95) {
      signals.push({ signal: 'Multiple price reductions + long DOM', strength: 'strong', points: 15 });
    }

    return signals;
  }

  private calculateScore(signals: SellerMotivation['signals']): number {
    return Math.min(100, signals.reduce((sum, s) => sum + s.points, 0));
  }

  private getLevel(score: number): SellerMotivation['level'] {
    if (score >= 75) return 'very_motivated';
    if (score >= 55) return 'motivated';
    if (score >= 35) return 'moderate';
    if (score >= 20) return 'flexible';
    return 'firm';
  }

  private performAnalysis(original: number, current: number, dom: number): SellerMotivation['analysis'] {
    const totalReduction = original - current;
    const reductions = totalReduction > 0 ? (totalReduction > original * 0.1 ? 2 : 1) : 0;

    return {
      priceHistory: {
        originalPrice: original,
        currentPrice: current,
        reductions,
        totalReduction: Math.round(totalReduction),
        reductionPercent: Math.round(((totalReduction / original) * 100) * 10) / 10,
      },
      timing: {
        daysOnMarket: dom,
        seasonality: 'Off-season',
        urgencyLevel: dom > 90 ? 'high' : dom > 60 ? 'moderate' : 'low',
      },
      circumstances: ['Price reductions indicate flexibility', 'Extended marketing period', 'May have other time constraints'],
    };
  }

  private developNegotiationStrategy(score: number, listPrice: number): SellerMotivation['negotiation'] {
    const discount = score >= 75 ? 0.92 : score >= 55 ? 0.95 : score >= 35 ? 0.97 : 0.99;

    return {
      strategy: score >= 75
        ? 'Aggressive offer - seller likely to negotiate significantly'
        : 'Standard negotiation with room for compromise',
      openingOffer: Math.round(listPrice * discount),
      expectedCounteroffer: Math.round(listPrice * (discount + (1 - discount) * 0.4)),
      likelySettlement: Math.round(listPrice * (discount + (1 - discount) * 0.6)),
      leverage: score >= 75 ? 'strong_buyer' : score >= 55 ? 'buyer_advantage' : 'balanced',
    };
  }
}
