/**
 * Energy Storage Potential Analyzer
 * Solar + battery system feasibility with ROI calculations.
 */

import { z } from 'zod';

export const EnergyStorageSchema = z.object({
  propertyId: z.string(),
  solar: z.object({
    roofArea: z.number(),
    usableArea: z.number(),
    orientation: z.enum(['optimal', 'good', 'fair', 'poor']),
    shading: z.enum(['none', 'minimal', 'moderate', 'significant']),
    systemSize: z.number().describe('kW'),
    annualProduction: z.number().describe('kWh'),
    offsetPercent: z.number(),
  }),
  battery: z.object({
    recommended: z.boolean(),
    capacity: z.number().describe('kWh'),
    backup: z.object({
      essentialLoad: z.number().describe('Hours'),
      wholeHome: z.number().describe('Hours'),
    }),
    options: z.array(z.object({
      brand: z.string(),
      capacity: z.number(),
      cost: z.number(),
      warranty: z.number(),
    })),
  }),
  economics: z.object({
    systemCost: z.number(),
    incentives: z.object({
      federal: z.number(),
      state: z.number(),
      utility: z.number(),
      total: z.number(),
    }),
    netCost: z.number(),
    annualSavings: z.number(),
    paybackYears: z.number(),
    roi25Year: z.number(),
  }),
  gridIndependence: z.object({
    currentReliance: z.number(),
    withSolar: z.number(),
    withBattery: z.number(),
    blackoutProtection: z.boolean(),
  }),
});

export type EnergyStorage = z.infer<typeof EnergyStorageSchema>;

export class EnergyStorageAnalyzer {
  public analyzeEnergyStorage(propertyId: string, roofArea: number, electricBill: number): EnergyStorage {
    const solar = this.analyzeSolar(roofArea, electricBill);
    const battery = this.analyzeBattery(solar.systemSize);
    const economics = this.calculateEconomics(solar, battery, electricBill);
    const gridIndependence = {
      currentReliance: 100,
      withSolar: 25,
      withBattery: 10,
      blackoutProtection: true,
    };

    return { propertyId, solar, battery, economics, gridIndependence };
  }

  private analyzeSolar(roofArea: number, bill: number): EnergyStorage['solar'] {
    const usableArea = roofArea * 0.7;
    const systemSize = (usableArea / 10) * 0.4;
    const annualProduction = systemSize * 1400;

    return {
      roofArea: Math.round(roofArea),
      usableArea: Math.round(usableArea),
      orientation: 'optimal',
      shading: 'minimal',
      systemSize: Math.round(systemSize * 10) / 10,
      annualProduction: Math.round(annualProduction),
      offsetPercent: 85,
    };
  }

  private analyzeBattery(systemSize: number): EnergyStorage['battery'] {
    return {
      recommended: true,
      capacity: 13.5,
      backup: { essentialLoad: 24, wholeHome: 8 },
      options: [
        { brand: 'Tesla Powerwall', capacity: 13.5, cost: 11500, warranty: 10 },
        { brand: 'LG Chem RESU', capacity: 16, cost: 12000, warranty: 10 },
      ],
    };
  }

  private calculateEconomics(solar: any, battery: any, bill: number): EnergyStorage['economics'] {
    const systemCost = solar.systemSize * 3000 + battery.options[0].cost;
    const federal = systemCost * 0.30;
    const state = systemCost * 0.10;
    const incentives = { federal, state, utility: 1000, total: federal + state + 1000 };
    const netCost = systemCost - incentives.total;
    const annualSavings = bill * 12 * 0.85;
    const paybackYears = netCost / annualSavings;
    const roi25Year = ((annualSavings * 25) / netCost - 1) * 100;

    return {
      systemCost: Math.round(systemCost),
      incentives: {
        federal: Math.round(federal),
        state: Math.round(state),
        utility: 1000,
        total: Math.round(incentives.total),
      },
      netCost: Math.round(netCost),
      annualSavings: Math.round(annualSavings),
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi25Year: Math.round(roi25Year),
    };
  }
}
