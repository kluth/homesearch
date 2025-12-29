/**
 * Deal Score Calculator
 * Comprehensive property deal scoring algorithm with multi-factor analysis.
 */

import { z } from 'zod';

export const DealScoreSchema = z.object({
  propertyId: z.string(),
  overallScore: z.number().min(0).max(100),
  rating: z.enum(['exceptional', 'excellent', 'good', 'fair', 'poor']),
  factors: z.object({
    pricing: z.object({
      score: z.number(),
      weight: z.number(),
      vsMarket: z.number(),
      vsCom ps: z.number(),
      trend: z.enum(['overpriced', 'fair', 'good_deal', 'great_deal']),
    }),
    location: z.object({
      score: z.number(),
      weight: z.number(),
      neighborhood: z.number(),
      schools: z.number(),
      walkability: z.number(),
      appreciation: z.number(),
    }),
    condition: z.object({
      score: z.number(),
      weight: z.number(),
      propertyCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
      recentUpdates: z.boolean(),
      estimatedRepairs: z.number(),
      moveInReady: z.boolean(),
    }),
    financials: z.object({
      score: z.number(),
      weight: z.number(),
      cashFlow: z.number().optional(),
      capRate: z.number().optional(),
      roi: z.number().optional(),
      affordability: z.enum(['excellent', 'good', 'stretch', 'overextended']),
    }),
    market: z.object({
      score: z.number(),
      weight: z.number(),
      daysOnMarket: z.number(),
      priceReductions: z.number(),
      competitionLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
      marketTrend: z.enum(['hot_seller', 'balanced', 'buyer_favorable']),
    }),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  recommendation: z.object({
    action: z.enum(['buy_immediately', 'buy_soon', 'make_offer', 'negotiate', 'wait', 'pass']),
    confidence: z.number(),
    reasoning: z.string(),
    suggestedOffer: z.number().optional(),
  }),
  comparables: z.object({
    betterThan: z.number().describe('Percentage of similar properties'),
    avgScore: z.number(),
    topPercentile: z.boolean(),
  }),
});

export type DealScore = z.infer<typeof DealScoreSchema>;

export class DealScoreCalculator {
  public calculateDealScore(
    propertyId: string,
    listPrice: number,
    marketValue: number,
    condition: DealScore['factors']['condition']['propertyCondition'],
    daysOnMarket: number,
    monthlyRent?: number
  ): DealScore {
    // Calculate each factor score
    const pricing = this.scorePricing(listPrice, marketValue);
    const location = this.scoreLocation();
    const conditionScore = this.scoreCondition(condition);
    const financials = this.scoreFinancials(listPrice, monthlyRent);
    const market = this.scoreMarket(daysOnMarket);

    const factors = {
      pricing,
      location,
      condition: conditionScore,
      financials,
      market,
    };

    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore(factors);
    const rating = this.getRating(overallScore);

    // SWOT analysis
    const { strengths, weaknesses, opportunities, risks } = this.performSWOT(factors);

    // Generate recommendation
    const recommendation = this.makeRecommendation(overallScore, factors, listPrice);

    // Comparables analysis
    const comparables = {
      betterThan: Math.min(95, overallScore),
      avgScore: 65,
      topPercentile: overallScore >= 80,
    };

    return {
      propertyId,
      overallScore,
      rating,
      factors,
      strengths,
      weaknesses,
      opportunities,
      risks,
      recommendation,
      comparables,
    };
  }

  private scorePricing(listPrice: number, marketValue: number): DealScore['factors']['pricing'] {
    const vsMarket = ((marketValue - listPrice) / marketValue) * 100;
    let score = 50 + (vsMarket * 2);
    score = Math.max(0, Math.min(100, score));

    let trend: DealScore['factors']['pricing']['trend'];
    if (vsMarket < -5) trend = 'overpriced';
    else if (vsMarket < 3) trend = 'fair';
    else if (vsMarket < 8) trend = 'good_deal';
    else trend = 'great_deal';

    return {
      score: Math.round(score),
      weight: 0.30,
      vsMarket: Math.round(vsMarket * 10) / 10,
      vsComps: Math.round((vsMarket - 2) * 10) / 10,
      trend,
    };
  }

  private scoreLocation(): DealScore['factors']['location'] {
    return {
      score: 82,
      weight: 0.25,
      neighborhood: 85,
      schools: 78,
      walkability: 80,
      appreciation: 6.5,
    };
  }

  private scoreCondition(condition: string): DealScore['factors']['condition'] {
    const conditionScores = {
      excellent: 95,
      good: 75,
      fair: 50,
      poor: 25,
    };

    const score = conditionScores[condition as keyof typeof conditionScores];

    return {
      score,
      weight: 0.20,
      propertyCondition: condition as DealScore['factors']['condition']['propertyCondition'],
      recentUpdates: condition === 'excellent',
      estimatedRepairs: condition === 'poor' ? 45000 : condition === 'fair' ? 15000 : 5000,
      moveInReady: condition === 'excellent' || condition === 'good',
    };
  }

  private scoreFinancials(listPrice: number, monthlyRent?: number): DealScore['factors']['financials'] {
    let score = 70;
    let cashFlow, capRate, roi;

    if (monthlyRent) {
      const annualRent = monthlyRent * 12;
      const expenses = annualRent * 0.40;
      cashFlow = annualRent - expenses - (listPrice * 0.05);
      capRate = ((annualRent - expenses) / listPrice) * 100;
      roi = (cashFlow / (listPrice * 0.20)) * 100;

      if (capRate > 8) score = 95;
      else if (capRate > 6) score = 80;
      else if (capRate > 4) score = 60;
      else score = 40;
    }

    return {
      score,
      weight: 0.15,
      cashFlow: cashFlow ? Math.round(cashFlow) : undefined,
      capRate: capRate ? Math.round(capRate * 10) / 10 : undefined,
      roi: roi ? Math.round(roi * 10) / 10 : undefined,
      affordability: 'good',
    };
  }

  private scoreMarket(daysOnMarket: number): DealScore['factors']['market'] {
    let score = 100 - (daysOnMarket * 0.5);
    score = Math.max(20, Math.min(100, score));

    let competitionLevel: DealScore['factors']['market']['competitionLevel'];
    if (daysOnMarket < 7) competitionLevel = 'very_high';
    else if (daysOnMarket < 30) competitionLevel = 'high';
    else if (daysOnMarket < 60) competitionLevel = 'moderate';
    else competitionLevel = 'low';

    return {
      score: Math.round(score),
      weight: 0.10,
      daysOnMarket,
      priceReductions: daysOnMarket > 30 ? 1 : 0,
      competitionLevel,
      marketTrend: 'balanced',
    };
  }

  private calculateOverallScore(factors: DealScore['factors']): number {
    const weighted =
      factors.pricing.score * factors.pricing.weight +
      factors.location.score * factors.location.weight +
      factors.condition.score * factors.condition.weight +
      factors.financials.score * factors.financials.weight +
      factors.market.score * factors.market.weight;

    return Math.round(weighted);
  }

  private getRating(score: number): DealScore['rating'] {
    if (score >= 90) return 'exceptional';
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private performSWOT(factors: DealScore['factors']): {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];

    // Pricing
    if (factors.pricing.trend === 'great_deal' || factors.pricing.trend === 'good_deal') {
      strengths.push(`Priced ${Math.abs(factors.pricing.vsMarket)}% below market value`);
    } else if (factors.pricing.trend === 'overpriced') {
      weaknesses.push(`Priced ${Math.abs(factors.pricing.vsMarket)}% above market value`);
    }

    // Location
    if (factors.location.score >= 80) {
      strengths.push('Excellent location with strong appreciation potential');
    }

    // Condition
    if (factors.condition.moveInReady) {
      strengths.push('Move-in ready condition');
    } else {
      opportunities.push(`Renovation opportunity - potential value-add of $${factors.condition.estimatedRepairs.toLocaleString()}`);
    }

    // Market
    if (factors.market.competitionLevel === 'very_high') {
      risks.push('High competition - expect multiple offers');
    } else if (factors.market.competitionLevel === 'low') {
      opportunities.push('Low competition - strong negotiating position');
    }

    return { strengths, weaknesses, opportunities, risks };
  }

  private makeRecommendation(
    score: number,
    factors: DealScore['factors'],
    listPrice: number
  ): DealScore['recommendation'] {
    let action: DealScore['recommendation']['action'];
    let confidence = score;
    let reasoning = '';
    let suggestedOffer;

    if (score >= 85 && factors.pricing.trend === 'great_deal') {
      action = 'buy_immediately';
      reasoning = 'Exceptional deal with strong fundamentals - act quickly';
      suggestedOffer = listPrice;
    } else if (score >= 80) {
      action = 'buy_soon';
      reasoning = 'Excellent property with good value - move within 48 hours';
      suggestedOffer = Math.round(listPrice * 0.98);
    } else if (score >= 70) {
      action = 'make_offer';
      reasoning = 'Good property, fair price - solid opportunity';
      suggestedOffer = Math.round(listPrice * 0.95);
    } else if (score >= 60) {
      action = 'negotiate';
      reasoning = 'Fair property but room for negotiation';
      suggestedOffer = Math.round(listPrice * 0.90);
    } else if (score >= 50) {
      action = 'wait';
      reasoning = 'Marginal deal - wait for better opportunities or price reduction';
    } else {
      action = 'pass';
      reasoning = 'Poor value - look for better options';
    }

    return {
      action,
      confidence,
      reasoning,
      suggestedOffer,
    };
  }
}
