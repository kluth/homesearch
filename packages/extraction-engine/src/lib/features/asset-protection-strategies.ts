/**
 * Asset Protection Strategies
 * LLC structures, liability shields, and estate planning for real estate.
 */

import { z } from 'zod';

export const AssetProtectionSchema = z.object({
  propertyId: z.string(),
  currentRisk: z.object({
    level: z.enum(['low', 'moderate', 'high', 'critical']),
    exposures: z.array(z.string()),
  }),
  strategies: z.array(z.object({
    strategy: z.string(),
    protection: z.enum(['excellent', 'good', 'moderate', 'limited']),
    cost: z.number(),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    benefits: z.array(z.string()),
    drawbacks: z.array(z.string()),
  })),
  llcStructure: z.object({
    recommended: z.boolean(),
    type: z.enum(['single_member', 'multi_member', 'series']),
    setup: z.number(),
    annual: z.number(),
    benefits: z.array(z.string()),
  }),
  insurance: z.object({
    umbrella: z.object({
      recommended: z.number(),
      cost: z.number(),
    }),
    landlord: z.object({
      required: z.boolean(),
      cost: z.number(),
    }),
  }),
  estate: z.object({
    tools: z.array(z.string()),
    considerations: z.array(z.string()),
  }),
});

export type AssetProtection = z.infer<typeof AssetProtectionSchema>;

export class AssetProtectionAnalyzer {
  public analyze(propertyId: string, value: number, isRental: boolean): AssetProtection {
    const currentRisk = {
      level: isRental ? ('high' as const) : ('moderate' as const),
      exposures: isRental ? ['Tenant lawsuits', 'Property damage', 'Liability claims'] : ['General liability'],
    };

    const strategies = [
      {
        strategy: 'Single-Member LLC',
        protection: 'good' as const,
        cost: 1500,
        complexity: 'simple' as const,
        benefits: ['Liability separation', 'Professional image', 'Tax flexibility'],
        drawbacks: ['Annual fees', 'Separate accounting'],
      },
    ];

    const llcStructure = {
      recommended: isRental || value > 300000,
      type: 'single_member' as const,
      setup: 1500,
      annual: 800,
      benefits: ['Limits personal liability', 'Privacy protection', 'Estate planning tool'],
    };

    const insurance = {
      umbrella: { recommended: 2000000, cost: 350 },
      landlord: { required: isRental, cost: isRental ? 1200 : 0 },
    };

    const estate = {
      tools: ['Revocable trust', 'Transfer on death deed', 'LLC membership interests'],
      considerations: ['Avoid probate', 'Privacy', 'Tax planning'],
    };

    return { propertyId, currentRisk, strategies, llcStructure, insurance, estate };
  }
}
