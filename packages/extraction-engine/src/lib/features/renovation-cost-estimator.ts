/**
 * Renovation Cost Estimator
 * Comprehensive renovation cost calculator with ROI analysis and contractor matching.
 */

import { z } from 'zod';

export const RenovationProjectSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  room: z.string(),
  type: z.enum(['kitchen', 'bathroom', 'basement', 'addition', 'exterior', 'flooring', 'painting', 'roofing', 'hvac', 'custom']),
  scope: z.enum(['cosmetic', 'moderate', 'major', 'luxury']),
  estimatedCost: z.number().positive(),
  breakdown: z.object({
    materials: z.number().nonnegative(),
    labor: z.number().nonnegative(),
    permits: z.number().nonnegative(),
    contingency: z.number().nonnegative(),
  }),
  timeline: z.object({
    estimatedDays: z.number().int().positive(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  roi: z.object({
    valueAdded: z.number(),
    percentageReturn: z.number(),
    breakEvenYears: z.number().optional(),
  }),
  permitsRequired: z.array(z.string()),
  contractorBids: z.array(z.object({
    contractorId: z.string(),
    contractorName: z.string(),
    bidAmount: z.number().positive(),
    timeline: z.number().int().positive(),
    rating: z.number().min(0).max(5),
    reviewCount: z.number().int().nonnegative(),
  })).default([]),
});

export type RenovationProject = z.infer<typeof RenovationProjectSchema>;

export class RenovationCostEstimator {
  private readonly BASE_COSTS = {
    kitchen: { cosmetic: 5000, moderate: 15000, major: 35000, luxury: 75000 },
    bathroom: { cosmetic: 3000, moderate: 8000, major: 18000, luxury: 40000 },
    basement: { cosmetic: 2000, moderate: 12000, major: 30000, luxury: 60000 },
    flooring: { cosmetic: 2000, moderate: 5000, major: 10000, luxury: 20000 },
    painting: { cosmetic: 1000, moderate: 3000, major: 6000, luxury: 12000 },
    roofing: { cosmetic: 3000, moderate: 8000, major: 15000, luxury: 25000 },
    hvac: { cosmetic: 2000, moderate: 6000, major: 12000, luxury: 20000 },
  };

  public estimateRenovation(
    propertyId: string,
    room: string,
    type: RenovationProject['type'],
    scope: RenovationProject['scope'],
    squareMeters?: number
  ): RenovationProject {
    const baseCost = this.BASE_COSTS[type]?.[scope] ?? 10000;
    const areaMultiplier = squareMeters ? Math.max(1, squareMeters / 20) : 1;
    const adjustedCost = baseCost * areaMultiplier;

    const materialsCost = adjustedCost * 0.4;
    const laborCost = adjustedCost * 0.5;
    const permitsCost = adjustedCost * 0.05;
    const contingency = adjustedCost * 0.15;

    const totalCost = materialsCost + laborCost + permitsCost + contingency;
    const roi = this.calculateROI(type, scope, totalCost);
    const timelineDays = this.estimateTimeline(type, scope, squareMeters);

    return {
      id: `reno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId,
      room,
      type,
      scope,
      estimatedCost: Math.round(totalCost),
      breakdown: {
        materials: Math.round(materialsCost),
        labor: Math.round(laborCost),
        permits: Math.round(permitsCost),
        contingency: Math.round(contingency),
      },
      timeline: {
        estimatedDays: timelineDays,
      },
      roi,
      permitsRequired: this.getRequiredPermits(type, scope),
      contractorBids: [],
    };
  }

  private calculateROI(type: RenovationProject['type'], scope: RenovationProject['scope'], cost: number): RenovationProject['roi'] {
    const roiPercentages: Record<string, number> = {
      kitchen: 75,
      bathroom: 70,
      basement: 65,
      addition: 55,
      painting: 100,
      flooring: 80,
      roofing: 85,
      hvac: 60,
    };

    const baseROI = roiPercentages[type] ?? 60;
    const valueAdded = cost * (baseROI / 100);

    return {
      valueAdded: Math.round(valueAdded),
      percentageReturn: baseROI,
      breakEvenYears: cost > 0 ? Math.round((cost / (valueAdded * 0.05)) * 10) / 10 : undefined,
    };
  }

  private estimateTimeline(type: RenovationProject['type'], scope: RenovationProject['scope'], area?: number): number {
    const timelines: Record<string, Record<string, number>> = {
      kitchen: { cosmetic: 7, moderate: 21, major: 45, luxury: 90 },
      bathroom: { cosmetic: 5, moderate: 14, major: 30, luxury: 60 },
      painting: { cosmetic: 3, moderate: 7, major: 14, luxury: 21 },
      flooring: { cosmetic: 5, moderate: 10, major: 15, luxury: 25 },
      roofing: { cosmetic: 7, moderate: 14, major: 21, luxury: 30 },
    };

    const baseDays = timelines[type]?.[scope] ?? 30;
    return area && area > 50 ? Math.round(baseDays * 1.5) : baseDays;
  }

  private getRequiredPermits(type: RenovationProject['type'], scope: RenovationProject['scope']): string[] {
    const permits: string[] = [];

    if (scope === 'major' || scope === 'luxury') {
      permits.push('Building Permit');
    }

    if (type === 'kitchen' || type === 'bathroom') {
      permits.push('Plumbing Permit', 'Electrical Permit');
    }

    if (type === 'addition') {
      permits.push('Building Permit', 'Zoning Approval', 'Electrical Permit', 'Plumbing Permit');
    }

    if (type === 'roofing' && (scope === 'major' || scope === 'luxury')) {
      permits.push('Roofing Permit');
    }

    return permits;
  }

  public compareContractorBids(bids: RenovationProject['contractorBids']): {
    cheapest: typeof bids[number];
    bestRated: typeof bids[number];
    recommended: typeof bids[number];
    insights: string[];
  } {
    if (bids.length === 0) throw new Error('No bids to compare');

    const cheapest = bids.reduce((min, bid) => bid.bidAmount < min.bidAmount ? bid : min);
    const bestRated = bids.reduce((max, bid) => bid.rating > max.rating ? bid : max);

    const recommended = bids.reduce((best, bid) => {
      const bidScore = (bid.rating / 5) * 50 + ((cheapest.bidAmount / bid.bidAmount) * 50);
      const bestScore = (best.rating / 5) * 50 + ((cheapest.bidAmount / best.bidAmount) * 50);
      return bidScore > bestScore ? bid : best;
    });

    const insights = [
      `${cheapest.contractorName} offers lowest price: €${cheapest.bidAmount.toLocaleString()}`,
      `${bestRated.contractorName} has highest rating: ${bestRated.rating}/5`,
      `${recommended.contractorName} recommended for best value`,
    ];

    return { cheapest, bestRated, recommended, insights };
  }
}
