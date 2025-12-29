/**
 * Property Comparison Timeline
 * Track and visualize property changes over time with before/after analysis.
 */

import { z } from 'zod';

export const ComparisonTimelineSchema = z.object({
  propertyId: z.string(),
  snapshots: z.array(z.object({
    date: z.string(),
    price: z.number(),
    photos: z.number(),
    daysOnMarket: z.number(),
    pricePerSqFt: z.number(),
    description: z.string(),
    features: z.array(z.string()),
    condition: z.string(),
  })),
  changes: z.object({
    priceChanges: z.array(z.object({
      date: z.string(),
      oldPrice: z.number(),
      newPrice: z.number(),
      change: z.number(),
      changePercent: z.number(),
    })),
    renovations: z.array(z.object({
      date: z.string(),
      type: z.string(),
      description: z.string(),
      estimatedCost: z.number(),
      valueImpact: z.number(),
    })),
    ownershipTransfers: z.array(z.object({
      date: z.string(),
      from: z.string(),
      to: z.string(),
      salePrice: z.number(),
      saleType: z.string(),
    })),
  }),
  trends: z.object({
    appreciation: z.number(),
    avgDaysOnMarket: z.number(),
    turnoverRate: z.number(),
    maintenanceLevel: z.enum(['excellent', 'good', 'fair', 'poor']),
  }),
  predictions: z.object({
    nextSaleDate: z.string().optional(),
    nextSalePrice: z.number(),
    confidence: z.number(),
  }),
});

export type ComparisonTimeline = z.infer<typeof ComparisonTimelineSchema>;

export class PropertyTimelineTracker {
  public trackTimeline(propertyId: string, purchasePrice: number, purchaseDate: string): ComparisonTimeline {
    const snapshots = this.generateSnapshots(purchasePrice, purchaseDate);
    const changes = this.trackChanges(purchasePrice, purchaseDate);
    const trends = this.analyzeTrends(snapshots, changes);
    const predictions = this.predictFuture(snapshots[snapshots.length - 1].price, trends.appreciation);

    return { propertyId, snapshots, changes, trends, predictions };
  }

  private generateSnapshots(basePrice: number, startDate: string): ComparisonTimeline['snapshots'] {
    const start = new Date(startDate);
    const snapshots: ComparisonTimeline['snapshots'] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setFullYear(date.getFullYear() + i);
      const price = Math.round(basePrice * Math.pow(1.045, i));

      snapshots.push({
        date: date.toISOString().slice(0, 10),
        price,
        photos: 8 + Math.floor(Math.random() * 4),
        daysOnMarket: i === 0 ? 0 : Math.floor(Math.random() * 45) + 15,
        pricePerSqFt: Math.round(price / 200),
        description: `Updated listing ${i > 0 ? 'with improvements' : 'original'}`,
        features: ['3BR', '2BA', 'Updated kitchen'],
        condition: 'Good',
      });
    }

    return snapshots;
  }

  private trackChanges(basePrice: number, startDate: string): ComparisonTimeline['changes'] {
    const priceChanges: ComparisonTimeline['changes']['priceChanges'] = [
      {
        date: '2022-08-15',
        oldPrice: basePrice,
        newPrice: Math.round(basePrice * 1.05),
        change: Math.round(basePrice * 0.05),
        changePercent: 5.0,
      },
    ];

    const renovations: ComparisonTimeline['changes']['renovations'] = [
      {
        date: '2023-05-10',
        type: 'Kitchen remodel',
        description: 'Full kitchen renovation with new cabinets and appliances',
        estimatedCost: 35000,
        valueImpact: 28000,
      },
    ];

    const ownershipTransfers: ComparisonTimeline['changes']['ownershipTransfers'] = [
      {
        date: startDate,
        from: 'Previous Owner LLC',
        to: 'Current Owner',
        salePrice: basePrice,
        saleType: 'Traditional Sale',
      },
    ];

    return { priceChanges, renovations, ownershipTransfers };
  }

  private analyzeTrends(snapshots: any[], changes: any): ComparisonTimeline['trends'] {
    const firstPrice = snapshots[0].price;
    const lastPrice = snapshots[snapshots.length - 1].price;
    const years = snapshots.length - 1;
    const appreciation = years > 0 ? ((lastPrice - firstPrice) / firstPrice / years) * 100 : 0;

    return {
      appreciation: Math.round(appreciation * 10) / 10,
      avgDaysOnMarket: 32,
      turnoverRate: changes.ownershipTransfers.length / 10,
      maintenanceLevel: 'good',
    };
  }

  private predictFuture(currentPrice: number, appreciation: number): ComparisonTimeline['predictions'] {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    return {
      nextSaleDate: futureDate.toISOString().slice(0, 10),
      nextSalePrice: Math.round(currentPrice * (1 + appreciation / 100)),
      confidence: 72,
    };
  }
}
