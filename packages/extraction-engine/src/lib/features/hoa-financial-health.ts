/**
 * HOA/Condo Association Financial Health Analyzer
 */

import { z } from 'zod';

export const HOAFinancialHealthSchema = z.object({
  propertyId: z.string(),
  hoaName: z.string(),
  monthlyFee: z.number(),
  reserves: z.number(),
  recommendedReserves: z.number(),
  reserveFundingRatio: z.number(),
  specialAssessments: z.array(z.object({
    year: z.number(),
    amount: z.number(),
    reason: z.string(),
  })),
  delinquencyRate: z.number(),
  litigation: z.array(z.object({
    case: z.string(),
    status: z.string(),
    amount: z.number().optional(),
  })),
  financialHealthScore: z.number().min(0).max(100),
  warnings: z.array(z.string()),
});

export type HOAFinancialHealth = z.infer<typeof HOAFinancialHealthSchema>;

export class HOAFinancialAnalyzer {
  public analyzeHOA(propertyId: string, hoaData: any): HOAFinancialHealth {
    const reserveFundingRatio = hoaData.reserves / hoaData.recommendedReserves;
    let score = 100;
    
    if (reserveFundingRatio < 0.5) score -= 30;
    if (hoaData.delinquencyRate > 10) score -= 20;
    if (hoaData.litigation.length > 0) score -= 25;
    
    return {
      ...hoaData,
      propertyId,
      reserveFundingRatio: Math.round(reserveFundingRatio * 100),
      financialHealthScore: Math.max(0, score),
      warnings: score < 60 ? ['Low reserves', 'High delinquency'] : [],
    };
  }
}
