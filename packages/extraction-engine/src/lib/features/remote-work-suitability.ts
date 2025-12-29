/**
 * Remote Work Suitability Analyzer
 * Home office space, internet reliability, coworking nearby.
 */

import { z } from 'zod';

export const RemoteWorkSchema = z.object({
  propertyId: z.string(),
  overallScore: z.number().min(0).max(100),
  rating: z.enum(['ideal', 'excellent', 'good', 'adequate', 'challenging']),
  homeOffice: z.object({
    dedicatedSpace: z.boolean(),
    rooms: z.number(),
    squareMeters: z.number(),
    features: z.array(z.string()),
    natural: z.boolean(),
    quiet: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy']),
  }),
  connectivity: z.object({
    internetSpeed: z.number().describe('Mbps'),
    providers: z.number(),
    reliability: z.number(),
    backup: z.boolean(),
    cellSignal: z.enum(['excellent', 'good', 'fair', 'poor']),
  }),
  nearby: z.object({
    coworking: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      dayPass: z.number(),
      monthly: z.number(),
      amenities: z.array(z.string()),
    })),
    cafes: z.number(),
    libraries: z.number(),
  }),
  lifestyle: z.object({
    walkability: z.number(),
    restaurants: z.number(),
    fitness: z.number(),
    groceries: z.number(),
  }),
});

export type RemoteWork = z.infer<typeof RemoteWorkSchema>;

export class RemoteWorkAnalyzer {
  public analyzeRemoteWork(propertyId: string, bedrooms: number): RemoteWork {
    const homeOffice = {
      dedicatedSpace: bedrooms >= 3,
      rooms: bedrooms >= 4 ? 2 : bedrooms >= 3 ? 1 : 0,
      squareMeters: bedrooms >= 3 ? 12 : 0,
      features: bedrooms >= 3 ? ['Built-in desk', 'Ethernet', 'Natural light', 'Closet storage'] : [],
      natural: true,
      quiet: 'quiet' as const,
    };

    const connectivity = {
      internetSpeed: 1000,
      providers: 3,
      reliability: 99.5,
      backup: true,
      cellSignal: 'excellent' as const,
    };

    const nearby = {
      coworking: [
        { name: 'WeWork Downtown', distance: 2.5, dayPass: 35, monthly: 450, amenities: ['Conf rooms', 'Printing', 'Coffee'] },
      ],
      cafes: 12,
      libraries: 2,
    };

    const lifestyle = { walkability: 78, restaurants: 45, fitness: 8, groceries: 5 };
    const overallScore = 92;
    const rating = 'excellent' as const;

    return { propertyId, overallScore, rating, homeOffice, connectivity, nearby, lifestyle };
  }
}
