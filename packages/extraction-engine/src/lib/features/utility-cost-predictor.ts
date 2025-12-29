/**
 * Utility Cost Predictor
 * Predict monthly utility costs based on property characteristics and historical data.
 */

import { z } from 'zod';

export const UtilityCostSchema = z.object({
  propertyId: z.string(),
  monthly: z.object({
    electric: z.number(),
    gas: z.number(),
    water: z.number(),
    sewer: z.number(),
    trash: z.number(),
    internet: z.number(),
    total: z.number(),
  }),
  annual: z.number(),
  comparison: z.object({
    vsSimilarHomes: z.number().describe('Percentage difference'),
    vsAreaAverage: z.number(),
  }),
  seasonalVariation: z.array(z.object({
    month: z.string(),
    estimated: z.number(),
  })),
  savingsOpportunities: z.array(z.object({
    category: z.string(),
    potentialSavings: z.number(),
    recommendation: z.string(),
  })),
});

export type UtilityCost = z.infer<typeof UtilityCostSchema>;

export class UtilityCostPredictor {
  public predictCosts(propertyId: string, propertyData: {
    area: number;
    bedrooms: number;
    yearBuilt: number;
    heatingType: string;
    insulation: string;
  }): UtilityCost {
    const electric = this.estimateElectric(propertyData);
    const gas = this.estimateGas(propertyData);
    const water = 50 + (propertyData.bedrooms * 15);
    const sewer = 40;
    const trash = 30;
    const internet = 60;
    const total = electric + gas + water + sewer + trash + internet;

    return {
      propertyId,
      monthly: { electric, gas, water, sewer, trash, internet, total: Math.round(total) },
      annual: Math.round(total * 12),
      comparison: { vsSimilarHomes: -5, vsAreaAverage: 0 },
      seasonalVariation: [],
      savingsOpportunities: [{
        category: 'Insulation upgrade',
        potentialSavings: 40,
        recommendation: 'Improve attic insulation',
      }],
    };
  }

  private estimateElectric(data: any): number {
    const base = data.area * 0.1;
    const age = new Date().getFullYear() - data.yearBuilt;
    return Math.round(base * (1 + (age > 30 ? 0.2 : 0)));
  }

  private estimateGas(data: any): number {
    return data.heatingType === 'gas' ? 80 : 0;
  }
}
