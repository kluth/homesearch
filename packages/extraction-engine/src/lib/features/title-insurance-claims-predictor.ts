/**
 * Title Insurance Claims Predictor
 * Predict title insurance claim probability based on property history.
 */

import { z } from 'zod';

export const TitleInsuranceClaimsSchema = z.object({
  propertyId: z.string(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
  claimProbability: z.number().describe('Percentage'),
  factors: z.array(z.object({
    factor: z.string(),
    risk: z.enum(['increases', 'decreases', 'neutral']),
    impact: z.number(),
  })),
  historicalIssues: z.object({
    liens: z.number(),
    foreclosures: z.number(),
    transfers: z.number(),
    disputes: z.number(),
  }),
  commonClaims: z.array(z.object({
    type: z.string(),
    probability: z.number(),
    averageCost: z.number(),
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    cost: z.number(),
  })),
  insurance: z.object({
    ownerPolicy: z.object({
      recommended: z.boolean(),
      coverage: z.number(),
      premium: z.number(),
    }),
    lenderPolicy: z.object({
      required: z.boolean(),
      coverage: z.number(),
      premium: z.number(),
    }),
  }),
});

export type TitleInsuranceClaims = z.infer<typeof TitleInsuranceClaimsSchema>;

export class TitleInsuranceClaimsPredictor {
  public predictClaims(propertyId: string, value: number, age: number, transfers: number): TitleInsuranceClaims {
    const factors = [
      { factor: 'Property age over 50 years', risk: age > 50 ? ('increases' as const) : ('neutral' as const), impact: age > 50 ? 15 : 0 },
      { factor: 'Multiple ownership transfers', risk: transfers > 5 ? ('increases' as const) : ('neutral' as const), impact: transfers > 5 ? 12 : 0 },
      { factor: 'Clear title search', risk: 'decreases' as const, impact: -10 },
    ];

    const riskScore = 35 + factors.reduce((sum, f) => sum + f.impact, 0);
    const riskLevel = riskScore < 20 ? 'very_low' : riskScore < 40 ? 'low' : riskScore < 60 ? 'moderate' : riskScore < 80 ? 'high' : 'very_high';
    const claimProbability = riskScore * 0.1;

    const historicalIssues = { liens: 0, foreclosures: 0, transfers, disputes: 0 };

    const commonClaims = [
      { type: 'Undisclosed lien', probability: 2.5, averageCost: 15000 },
      { type: 'Boundary dispute', probability: 1.8, averageCost: 8500 },
      { type: 'Forged documents', probability: 0.5, averageCost: 35000 },
    ];

    const recommendations = [
      { action: 'Purchase owner\'s title insurance', priority: 'critical' as const, cost: value * 0.005 },
      { action: 'Order comprehensive title search', priority: 'critical' as const, cost: 350 },
    ];

    const insurance = {
      ownerPolicy: { recommended: true, coverage: value, premium: Math.round(value * 0.005) },
      lenderPolicy: { required: true, coverage: value * 0.8, premium: Math.round(value * 0.004) },
    };

    return { propertyId, riskScore, riskLevel, claimProbability, factors, historicalIssues, commonClaims, recommendations, insurance };
  }
}
