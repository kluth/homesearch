/**
 * Off-Market Property Finder
 * Identify pre-listing opportunities and motivated sellers.
 */

import { z } from 'zod';

export const OffMarketPropertySchema = z.object({
  propertyId: z.string(),
  status: z.enum(['pre_listing', 'fsbo', 'expired_listing', 'withdrawn', 'pocket_listing', 'probate', 'distressed']),
  owner: z.object({
    name: z.string(),
    ownership: z.number().describe('Years'),
    lastSale: z.object({
      date: z.string(),
      price: z.number(),
    }),
  }),
  motivation: z.object({
    score: z.number().min(0).max(100),
    signals: z.array(z.string()),
    level: z.enum(['very_high', 'high', 'moderate', 'low', 'unknown']),
  }),
  opportunity: z.object({
    estimatedValue: z.number(),
    targetPrice: z.number(),
    discount: z.number(),
    competition: z.enum(['none', 'low', 'moderate', 'high']),
  }),
  approach: z.object({
    method: z.enum(['direct_mail', 'door_knock', 'agent_contact', 'letter', 'phone']),
    script: z.string(),
    timing: z.string(),
    legalConsiderations: z.array(z.string()),
  }),
});

export type OffMarketProperty = z.infer<typeof OffMarketPropertySchema>;

export class OffMarketPropertyFinder {
  public analyzeOffMarket(propertyId: string, ownershipYears: number): OffMarketProperty {
    const status = this.determineStatus(ownershipYears);
    const owner = { name: 'John Smith', ownership: ownershipYears, lastSale: { date: '2010-06-15', price: 285000 } };
    const motivation = this.assessMotivation(ownershipYears, status);
    const opportunity = { estimatedValue: 450000, targetPrice: 420000, discount: 30000, competition: 'low' as const };
    const approach = this.recommendApproach(motivation.level);

    return { propertyId, status, owner, motivation, opportunity, approach };
  }

  private determineStatus(years: number): OffMarketProperty['status'] {
    if (years > 30) return 'probate';
    if (years > 15) return 'pre_listing';
    return 'pocket_listing';
  }

  private assessMotivation(years: number, status: string): OffMarketProperty['motivation'] {
    const signals = [
      'Long ownership - likely high equity',
      'Property in desirable neighborhood',
      'Owner approaching retirement age',
    ];

    return {
      score: years > 20 ? 75 : 55,
      signals,
      level: years > 20 ? 'high' : 'moderate',
    };
  }

  private recommendApproach(motivation: string): OffMarketProperty['approach'] {
    return {
      method: 'direct_mail',
      script: 'Professional letter expressing interest in purchasing home if owner considering selling',
      timing: 'Initial contact within 2 weeks',
      legalConsiderations: ['Comply with solicitation laws', 'Respect Do Not Mail lists', 'Professional representation'],
    };
  }
}
