/**
 * Property Watchlist & Alert System
 * Monitor properties with intelligent alerts for price changes, status updates, and opportunities.
 */

import { z } from 'zod';

export const PropertyWatchlistSchema = z.object({
  userId: z.string(),
  watchedProperties: z.array(z.object({
    propertyId: z.string(),
    addedDate: z.string(),
    initialPrice: z.number(),
    currentPrice: z.number(),
    status: z.enum(['active', 'pending', 'sold', 'off_market', 'price_reduced']),
    alerts: z.array(z.object({
      type: z.enum(['price_change', 'status_change', 'open_house', 'new_listing', 'back_on_market', 'price_improvement']),
      date: z.string(),
      message: z.string(),
      importance: z.enum(['low', 'medium', 'high', 'urgent']),
      actionable: z.boolean(),
    })),
    metrics: z.object({
      daysWatched: z.number(),
      totalPriceChanges: z.number(),
      priceChangePercent: z.number(),
      viewedTimes: z.number(),
    }),
  })),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
    alertTypes: z.array(z.enum(['price_drop', 'status_change', 'open_house', 'new_similar', 'market_update'])),
    priceDropThreshold: z.number().describe('Minimum % price drop to alert'),
  }),
  recommendations: z.array(z.object({
    propertyId: z.string(),
    reason: z.string(),
    similarity: z.number().min(0).max(100),
    advantage: z.string(),
  })),
  insights: z.object({
    avgTimeToSale: z.number().describe('Days'),
    priceDropProbability: z.number().describe('Percentage'),
    competitionLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
    suggestedAction: z.string(),
  }),
});

export type PropertyWatchlist = z.infer<typeof PropertyWatchlistSchema>;

export class PropertyWatchlistManager {
  public getWatchlist(userId: string): PropertyWatchlist {
    const watchedProperties: PropertyWatchlist['watchedProperties'] = [
      {
        propertyId: 'prop-123',
        addedDate: '2024-12-01',
        initialPrice: 450000,
        currentPrice: 435000,
        status: 'price_reduced',
        alerts: [
          {
            type: 'price_change',
            date: '2024-12-15',
            message: 'Price reduced by $15,000 (3.3%)',
            importance: 'high',
            actionable: true,
          },
          {
            type: 'open_house',
            date: '2024-12-20',
            message: 'Open house scheduled for this Sunday 1-3 PM',
            importance: 'medium',
            actionable: true,
          },
        ],
        metrics: {
          daysWatched: 28,
          totalPriceChanges: 1,
          priceChangePercent: -3.3,
          viewedTimes: 8,
        },
      },
      {
        propertyId: 'prop-456',
        addedDate: '2024-11-15',
        initialPrice: 525000,
        currentPrice: 525000,
        status: 'active',
        alerts: [
          {
            type: 'status_change',
            date: '2024-12-10',
            message: 'Back on market after failed inspection',
            importance: 'urgent',
            actionable: true,
          },
        ],
        metrics: {
          daysWatched: 44,
          totalPriceChanges: 0,
          priceChangePercent: 0,
          viewedTimes: 12,
        },
      },
    ];

    const preferences: PropertyWatchlist['preferences'] = {
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      alertTypes: ['price_drop', 'status_change', 'open_house'],
      priceDropThreshold: 2.0,
    };

    const recommendations: PropertyWatchlist['recommendations'] = [
      {
        propertyId: 'prop-789',
        reason: 'Similar to prop-123 but $20k less',
        similarity: 92,
        advantage: 'Better school district, similar layout',
      },
      {
        propertyId: 'prop-890',
        reason: 'Just listed in your preferred neighborhood',
        similarity: 85,
        advantage: 'Newer construction, move-in ready',
      },
    ];

    const insights: PropertyWatchlist['insights'] = {
      avgTimeToSale: 32,
      priceDropProbability: 45,
      competitionLevel: 'moderate',
      suggestedAction: 'Monitor prop-123 closely - price drop suggests motivated seller. Consider making offer before open house.',
    };

    return {
      userId,
      watchedProperties,
      preferences,
      recommendations,
      insights,
    };
  }
}
