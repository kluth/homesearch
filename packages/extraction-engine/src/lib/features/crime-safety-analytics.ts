/**
 * Crime Heat Map & Safety Analytics
 * Real-time crime data analysis with safety scoring by time and location.
 */

import { z } from 'zod';

export const CrimeSafetySchema = z.object({
  propertyId: z.string(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  safetyScore: z.number().min(0).max(100),
  crimeRate: z.number().describe('Crimes per 1000 residents'),
  crimesByType: z.object({
    violent: z.number(),
    property: z.number(),
    theft: z.number(),
    burglary: z.number(),
    assault: z.number(),
    vandalism: z.number(),
  }),
  recentIncidents: z.array(z.object({
    type: z.string(),
    date: z.string().datetime(),
    distance: z.number().describe('meters from property'),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  safetyByTimeOfDay: z.object({
    morning: z.number().min(0).max(100),
    afternoon: z.number().min(0).max(100),
    evening: z.number().min(0).max(100),
    night: z.number().min(0).max(100),
  }),
  trend: z.enum(['improving', 'stable', 'declining']),
  yearOverYearChange: z.number().describe('Percentage change'),
  heatMapZones: z.array(z.object({
    radius: z.number(),
    crimeCount: z.number(),
    severity: z.enum(['low', 'medium', 'high', 'very_high']),
  })),
  policeResponse: z.object({
    averageTime: z.number().describe('Minutes'),
    nearestStation: z.object({
      name: z.string(),
      distance: z.number().describe('km'),
    }),
  }),
  recommendations: z.array(z.string()),
});

export type CrimeSafety = z.infer<typeof CrimeSafetySchema>;

export class CrimeSafetyAnalytics {
  public analyzeSafety(
    propertyId: string,
    location: { latitude: number; longitude: number },
    address: string
  ): CrimeSafety {
    // Mock crime data - in production would call crime API
    const crimesByType = {
      violent: 12,
      property: 45,
      theft: 28,
      burglary: 15,
      assault: 8,
      vandalism: 10,
    };

    const totalCrimes = Object.values(crimesByType).reduce((sum, count) => sum + count, 0);
    const population = 5000; // Mock neighborhood population
    const crimeRate = (totalCrimes / population) * 1000;

    // Calculate safety score (inverse of crime rate)
    const safetyScore = Math.max(0, Math.min(100, 100 - (crimeRate * 2)));

    // Time of day analysis
    const safetyByTimeOfDay = {
      morning: Math.min(100, safetyScore + 10),
      afternoon: Math.min(100, safetyScore + 5),
      evening: safetyScore,
      night: Math.max(0, safetyScore - 15),
    };

    // Recent incidents
    const recentIncidents = this.generateRecentIncidents(location);

    // Trend analysis
    const yearOverYearChange = -8; // 8% reduction in crime
    const trend = yearOverYearChange < -5 ? 'improving' : yearOverYearChange > 5 ? 'declining' : 'stable';

    // Heat map zones
    const heatMapZones = [
      { radius: 500, crimeCount: 15, severity: 'medium' as const },
      { radius: 1000, crimeCount: 42, severity: 'low' as const },
      { radius: 2000, crimeCount: 118, severity: 'medium' as const },
    ];

    // Police response
    const policeResponse = {
      averageTime: 8,
      nearestStation: {
        name: 'Central Police Station',
        distance: 2.3,
      },
    };

    // Recommendations
    const recommendations = this.generateRecommendations(safetyScore, crimesByType);

    return {
      propertyId,
      location,
      safetyScore: Math.round(safetyScore),
      crimeRate: Math.round(crimeRate * 10) / 10,
      crimesByType,
      recentIncidents,
      safetyByTimeOfDay,
      trend,
      yearOverYearChange,
      heatMapZones,
      policeResponse,
      recommendations,
    };
  }

  private generateRecentIncidents(location: { latitude: number; longitude: number }) {
    const now = new Date();
    return [
      {
        type: 'Package Theft',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        distance: 180,
        severity: 'low' as const,
      },
      {
        type: 'Vehicle Break-in',
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        distance: 420,
        severity: 'medium' as const,
      },
    ];
  }

  private generateRecommendations(safetyScore: number, crimes: any): string[] {
    const recs: string[] = [];

    if (safetyScore < 60) {
      recs.push('Consider installing security system with cameras');
      recs.push('Join neighborhood watch program');
    }

    if (crimes.burglary > 10) {
      recs.push('Ensure all entry points have deadbolt locks');
    }

    if (crimes.theft > 20) {
      recs.push('Install motion-sensor lighting');
    }

    if (safetyScore >= 80) {
      recs.push('Area is very safe - maintain current security measures');
    }

    return recs;
  }
}
