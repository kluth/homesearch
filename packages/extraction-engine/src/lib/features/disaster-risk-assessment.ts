/**
 * Natural Disaster & Risk Assessment
 * Comprehensive disaster risk analysis and insurance implications.
 */

import { z } from 'zod';

export const DisasterRiskSchema = z.object({
  propertyId: z.string(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  risks: z.object({
    flood: z.object({
      zone: z.enum(['none', 'minimal', 'moderate', 'high', 'very_high']),
      floodplainStatus: z.boolean(),
      baseFloodElevation: z.number().optional(),
      insuranceRequired: z.boolean(),
      historicalEvents: z.number().int().nonnegative(),
      lastEventDate: z.string().datetime().optional(),
    }),
    earthquake: z.object({
      riskLevel: z.enum(['none', 'low', 'moderate', 'high', 'very_high']),
      magnitude: z.number().min(0).max(10).optional(),
      faultLineDistance: z.number().optional().describe('km'),
      historicalEvents: z.number().int().nonnegative(),
    }),
    hurricane: z.object({
      riskLevel: z.enum(['none', 'low', 'moderate', 'high', 'very_high']),
      windZone: z.string().optional(),
      stormSurgeRisk: z.boolean(),
      historicalHits: z.number().int().nonnegative(),
    }),
    wildfire: z.object({
      riskLevel: z.enum(['none', 'low', 'moderate', 'high', 'very_high']),
      distanceToWildland: z.number().optional().describe('km'),
      fireHistory: z.number().int().nonnegative(),
      mitigationRequired: z.boolean(),
    }),
    tornado: z.object({
      riskLevel: z.enum(['none', 'low', 'moderate', 'high', 'very_high']),
      averagePerYear: z.number(),
      historicalEvents: z.number().int().nonnegative(),
    }),
  }),
  overallRiskScore: z.number().min(0).max(100),
  insuranceImpact: z.object({
    estimatedPremiumIncrease: z.number().describe('Percentage'),
    requiresSpecialCoverage: z.boolean(),
    estimatedAnnualCost: z.number().positive(),
  }),
  mitigationOptions: z.array(z.object({
    type: z.string(),
    cost: z.number().positive(),
    premiumReduction: z.number().describe('Percentage'),
  })),
  evacuationPlan: z.object({
    routes: z.array(z.string()),
    shelters: z.array(z.object({
      name: z.string(),
      address: z.string(),
      distance: z.number(),
    })),
    estimatedEvacuationTime: z.number().describe('Minutes'),
  }),
});

export type DisasterRisk = z.infer<typeof DisasterRiskSchema>;

export class DisasterRiskAssessment {
  public assessProperty(propertyId: string, location: { latitude: number; longitude: number }, address: string): DisasterRisk {
    const floodRisk = this.assessFloodRisk(location);
    const earthquakeRisk = this.assessEarthquakeRisk(location);
    const hurricaneRisk = this.assessHurricaneRisk(location);
    const wildfireRisk = this.assessWildfireRisk(location);
    const tornadoRisk = this.assessTornadoRisk(location);

    const riskScores = [
      this.riskLevelToScore(floodRisk.zone),
      this.riskLevelToScore(earthquakeRisk.riskLevel),
      this.riskLevelToScore(hurricaneRisk.riskLevel),
      this.riskLevelToScore(wildfireRisk.riskLevel),
      this.riskLevelToScore(tornadoRisk.riskLevel),
    ];

    const overallRiskScore = Math.round(riskScores.reduce((sum, s) => sum + s, 0) / riskScores.length);

    return {
      propertyId,
      location,
      risks: {
        flood: floodRisk,
        earthquake: earthquakeRisk,
        hurricane: hurricaneRisk,
        wildfire: wildfireRisk,
        tornado: tornadoRisk,
      },
      overallRiskScore,
      insuranceImpact: this.calculateInsuranceImpact(overallRiskScore, floodRisk.insuranceRequired),
      mitigationOptions: this.getMitigationOptions(floodRisk, earthquakeRisk, wildfireRisk),
      evacuationPlan: {
        routes: ['Route 1: North via Highway 101', 'Route 2: East via Main St'],
        shelters: [],
        estimatedEvacuationTime: 30,
      },
    };
  }

  private assessFloodRisk(location: { latitude: number; longitude: number }): DisasterRisk['risks']['flood'] {
    const zone = Math.random() > 0.7 ? 'moderate' : 'minimal';
    return {
      zone,
      floodplainStatus: zone !== 'minimal',
      insuranceRequired: zone === 'high' || zone === 'very_high',
      historicalEvents: Math.floor(Math.random() * 3),
    };
  }

  private assessEarthquakeRisk(location: { latitude: number; longitude: number }): DisasterRisk['risks']['earthquake'] {
    const inSeismicZone = Math.abs(location.latitude) > 30 && Math.abs(location.latitude) < 50;
    return {
      riskLevel: inSeismicZone ? 'moderate' : 'low',
      faultLineDistance: inSeismicZone ? 50 : 200,
      historicalEvents: inSeismicZone ? 5 : 1,
    };
  }

  private assessHurricaneRisk(location: { latitude: number; longitude: number }): DisasterRisk['risks']['hurricane'] {
    const coastalArea = Math.abs(location.latitude) < 35;
    return {
      riskLevel: coastalArea ? 'moderate' : 'low',
      stormSurgeRisk: coastalArea,
      historicalHits: coastalArea ? 8 : 2,
    };
  }

  private assessWildfireRisk(location: { latitude: number; longitude: number }): DisasterRisk['risks']['wildfire'] {
    return {
      riskLevel: 'low',
      distanceToWildland: 10,
      fireHistory: 0,
      mitigationRequired: false,
    };
  }

  private assessTornadoRisk(location: { latitude: number; longitude: number }): DisasterRisk['risks']['tornado'] {
    const tornadoAlley = location.latitude > 35 && location.latitude < 45 && location.longitude < -95;
    return {
      riskLevel: tornadoAlley ? 'high' : 'low',
      averagePerYear: tornadoAlley ? 3 : 0.5,
      historicalEvents: tornadoAlley ? 12 : 2,
    };
  }

  private riskLevelToScore(level: string): number {
    const scores = { none: 0, minimal: 10, low: 20, moderate: 40, high: 70, very_high: 90 };
    return scores[level as keyof typeof scores] ?? 0;
  }

  private calculateInsuranceImpact(riskScore: number, floodInsuranceRequired: boolean): DisasterRisk['insuranceImpact'] {
    const premiumIncrease = riskScore * 0.5;
    const baseCost = 1200;
    const estimatedCost = baseCost * (1 + premiumIncrease / 100) + (floodInsuranceRequired ? 800 : 0);

    return {
      estimatedPremiumIncrease: Math.round(premiumIncrease),
      requiresSpecialCoverage: floodInsuranceRequired || riskScore > 60,
      estimatedAnnualCost: Math.round(estimatedCost),
    };
  }

  private getMitigationOptions(flood: any, earthquake: any, wildfire: any): DisasterRisk['mitigationOptions'] {
    const options: DisasterRisk['mitigationOptions'] = [];

    if (flood.zone === 'moderate' || flood.zone === 'high') {
      options.push({
        type: 'Flood barriers and drainage improvements',
        cost: 8000,
        premiumReduction: 15,
      });
    }

    if (earthquake.riskLevel === 'high' || earthquake.riskLevel === 'very_high') {
      options.push({
        type: 'Seismic retrofitting',
        cost: 15000,
        premiumReduction: 20,
      });
    }

    return options;
  }
}
