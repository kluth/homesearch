/**
 * Commute & Transportation Analyzer
 * Multi-modal commute analysis with cost and environmental impact.
 */

import { z } from 'zod';

export const CommuteAnalysisSchema = z.object({
  id: z.string(),
  propertyAddress: z.string(),
  workplaceAddress: z.string(),
  modes: z.array(z.object({
    mode: z.enum(['driving', 'transit', 'bicycling', 'walking', 'carpooling']),
    distance: z.number().positive().describe('km'),
    duration: z.number().positive().describe('minutes'),
    durationWithTraffic: z.object({
      best: z.number(),
      typical: z.number(),
      worst: z.number(),
    }),
    monthlyCost: z.number().nonnegative(),
    breakdown: z.object({
      fuel: z.number().optional(),
      parking: z.number().optional(),
      tolls: z.number().optional(),
      transit: z.number().optional(),
      maintenance: z.number().optional(),
    }).optional(),
    carbonFootprint: z.number().describe('kg CO2/month'),
    healthBenefits: z.number().min(0).max(100).optional(),
    stressLevel: z.enum(['low', 'moderate', 'high']),
    reliability: z.enum(['excellent', 'good', 'fair', 'poor']),
  })),
  recommended: z.string(),
  multiWorkplaceSupport: z.array(z.object({
    workplace: z.string(),
    frequency: z.string(),
    avgCommute: z.number(),
  })).optional(),
});

export type CommuteAnalysis = z.infer<typeof CommuteAnalysisSchema>;

export class CommuteAnalyzer {
  public analyzeCommute(propertyAddress: string, workplaceAddress: string): CommuteAnalysis {
    const distance = this.calculateDistance(propertyAddress, workplaceAddress);

    const modes = [
      this.analyzeDriving(distance),
      this.analyzeTransit(distance),
      this.analyzeBicycling(distance),
      this.analyzeWalking(distance),
    ];

    const recommended = this.recommendMode(modes);

    return {
      id: `commute-${Date.now()}`,
      propertyAddress,
      workplaceAddress,
      modes,
      recommended,
    };
  }

  private analyzeDriving(distance: number): CommuteAnalysis['modes'][number] {
    const duration = (distance / 0.8); // 48 km/h average
    const monthlyCost = (distance * 2 * 22 * 0.15) + 150 + 50; // fuel + parking + tolls

    return {
      mode: 'driving',
      distance,
      duration: Math.round(duration),
      durationWithTraffic: {
        best: Math.round(duration * 0.8),
        typical: Math.round(duration),
        worst: Math.round(duration * 1.5),
      },
      monthlyCost: Math.round(monthlyCost),
      breakdown: {
        fuel: Math.round(distance * 2 * 22 * 0.15),
        parking: 150,
        tolls: 50,
        maintenance: 50,
      },
      carbonFootprint: Math.round(distance * 2 * 22 * 0.12),
      stressLevel: 'moderate',
      reliability: 'good',
    };
  }

  private analyzeTransit(distance: number): CommuteAnalysis['modes'][number] {
    const duration = (distance / 0.5) + 20; // 30 km/h + waiting
    const monthlyCost = 100;

    return {
      mode: 'transit',
      distance,
      duration: Math.round(duration),
      durationWithTraffic: {
        best: Math.round(duration * 0.9),
        typical: Math.round(duration),
        worst: Math.round(duration * 1.2),
      },
      monthlyCost,
      breakdown: { transit: monthlyCost },
      carbonFootprint: Math.round(distance * 2 * 22 * 0.04),
      stressLevel: 'low',
      reliability: 'good',
    };
  }

  private analyzeBicycling(distance: number): CommuteAnalysis['modes'][number] {
    const duration = (distance / 0.25); // 15 km/h

    return {
      mode: 'bicycling',
      distance,
      duration: Math.round(duration),
      durationWithTraffic: {
        best: Math.round(duration),
        typical: Math.round(duration),
        worst: Math.round(duration * 1.1),
      },
      monthlyCost: 20,
      breakdown: { maintenance: 20 },
      carbonFootprint: 0,
      healthBenefits: distance < 10 ? 90 : 70,
      stressLevel: distance < 10 ? 'low' : 'moderate',
      reliability: 'fair',
    };
  }

  private analyzeWalking(distance: number): CommuteAnalysis['modes'][number] {
    const duration = (distance / 0.083); // 5 km/h

    return {
      mode: 'walking',
      distance,
      duration: Math.round(duration),
      durationWithTraffic: {
        best: Math.round(duration),
        typical: Math.round(duration),
        worst: Math.round(duration),
      },
      monthlyCost: 0,
      carbonFootprint: 0,
      healthBenefits: 100,
      stressLevel: 'low',
      reliability: 'excellent',
    };
  }

  private calculateDistance(from: string, to: string): number {
    return 15 + Math.random() * 20; // Mock: 15-35 km
  }

  private recommendMode(modes: CommuteAnalysis['modes']): string {
    const scores = modes.map(m => {
      let score = 0;
      if (m.duration < 30) score += 30;
      else if (m.duration < 60) score += 20;
      score += (200 - m.monthlyCost) / 10;
      score += (100 - m.carbonFootprint) / 5;
      if (m.healthBenefits) score += m.healthBenefits / 5;
      return { mode: m.mode, score };
    });

    return scores.reduce((best, curr) => curr.score > best.score ? curr : best).mode;
  }
}
