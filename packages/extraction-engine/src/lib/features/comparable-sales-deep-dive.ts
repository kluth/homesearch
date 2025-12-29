/**
 * Comparable Sales Deep Dive
 * Advanced comp analysis with granular adjustment factors.
 */

import { z } from 'zod';

export const ComparableSalesSchema = z.object({
  propertyId: z.string(),
  subject: z.object({
    address: z.string(),
    price: z.number(),
    squareMeters: z.number(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    yearBuilt: z.number(),
  }),
  comparables: z.array(z.object({
    id: z.string(),
    address: z.string(),
    salePrice: z.number(),
    saleDate: z.string(),
    distance: z.number(),
    similarity: z.number(),
    adjustments: z.object({
      size: z.number(),
      condition: z.number(),
      age: z.number(),
      location: z.number(),
      features: z.number(),
      market: z.number(),
      total: z.number(),
    }),
    adjustedPrice: z.number(),
    weight: z.number(),
  })),
  valuation: z.object({
    low: z.number(),
    median: z.number(),
    high: z.number(),
    confidence: z.number(),
  }),
  analysis: z.object({
    listingStatus: z.enum(['underpriced', 'fairly_priced', 'overpriced']),
    pricePerSqFt: z.object({
      subject: z.number(),
      compsAverage: z.number(),
      variance: z.number(),
    }),
    marketTrend: z.object({
      direction: z.enum(['appreciating', 'stable', 'declining']),
      rate: z.number(),
    }),
  }),
});

export type ComparableSales = z.infer<typeof ComparableSalesSchema>;

export class ComparableSalesAnalyzer {
  public analyzeComparables(propertyId: string, listPrice: number, area: number): ComparableSales {
    const subject = {
      address: '123 Main St',
      price: listPrice,
      squareMeters: area,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2005,
    };

    const comparables = this.findComparables(subject);
    const valuation = this.calculateValuation(comparables);
    const analysis = this.analyzeMarket(subject, comparables, valuation);

    return { propertyId, subject, comparables, valuation, analysis };
  }

  private findComparables(subject: any): ComparableSales['comparables'] {
    return [
      {
        id: 'comp-1',
        address: '125 Main St',
        salePrice: 445000,
        saleDate: '2024-11-15',
        distance: 0.2,
        similarity: 95,
        adjustments: { size: 5000, condition: -3000, age: 0, location: 0, features: 2000, market: 1000, total: 5000 },
        adjustedPrice: 450000,
        weight: 0.35,
      },
      {
        id: 'comp-2',
        address: '456 Oak Ave',
        salePrice: 438000,
        saleDate: '2024-10-20',
        distance: 0.5,
        similarity: 88,
        adjustments: { size: 8000, condition: 0, age: -2000, location: -1000, features: 0, market: 2000, total: 7000 },
        adjustedPrice: 445000,
        weight: 0.30,
      },
      {
        id: 'comp-3',
        address: '789 Elm St',
        salePrice: 452000,
        saleDate: '2024-12-01',
        distance: 0.3,
        similarity: 92,
        adjustments: { size: -3000, condition: 1000, age: 0, location: 500, features: -1000, market: 500, total: -2000 },
        adjustedPrice: 450000,
        weight: 0.35,
      },
    ];
  }

  private calculateValuation(comps: ComparableSales['comparables']): ComparableSales['valuation'] {
    const weightedAvg = comps.reduce((sum, c) => sum + c.adjustedPrice * c.weight, 0);
    const prices = comps.map(c => c.adjustedPrice).sort((a, b) => a - b);

    return {
      low: Math.round(prices[0] * 0.97),
      median: Math.round(weightedAvg),
      high: Math.round(prices[prices.length - 1] * 1.03),
      confidence: 85,
    };
  }

  private analyzeMarket(subject: any, comps: any[], valuation: any): ComparableSales['analysis'] {
    const listingStatus = subject.price < valuation.median * 0.97 ? 'underpriced' :
                         subject.price > valuation.median * 1.03 ? 'overpriced' : 'fairly_priced';

    return {
      listingStatus,
      pricePerSqFt: {
        subject: Math.round(subject.price / subject.squareMeters),
        compsAverage: Math.round(valuation.median / subject.squareMeters),
        variance: 2.5,
      },
      marketTrend: { direction: 'appreciating', rate: 4.5 },
    };
  }
}
