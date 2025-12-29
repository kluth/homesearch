/**
 * Environmental & Sustainability Analyzer
 * Energy efficiency, carbon footprint, and green certification analysis.
 */

import { z } from 'zod';

export const EnergyEfficiencySchema = z.object({
  propertyId: z.string(),
  epcRating: z.enum(['A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G']),
  epcScore: z.number().min(0).max(100),
  annualEnergyConsumption: z.number().nonnegative().describe('kWh/year'),
  annualEnergyCost: z.number().nonnegative(),
  co2Emissions: z.number().nonnegative().describe('kg CO2/year'),
  recommendations: z.array(z.object({
    improvement: z.string(),
    estimatedCost: z.number().positive(),
    annualSavings: z.number().positive(),
    paybackYears: z.number().positive(),
    co2Reduction: z.number().positive(),
  })),
});

export const SolarPotentialSchema = z.object({
  propertyId: z.string(),
  roofArea: z.number().positive().describe('Square meters'),
  suitability: z.enum(['excellent', 'good', 'fair', 'poor']),
  estimatedPanelCapacity: z.number().positive().describe('kW'),
  annualProduction: z.number().positive().describe('kWh/year'),
  installationCost: z.number().positive(),
  annualSavings: z.number().positive(),
  paybackPeriod: z.number().positive().describe('Years'),
  lifetimeSavings: z.number().positive(),
  carbonOffset: z.number().positive().describe('kg CO2/year'),
  incentives: z.array(z.object({
    name: z.string(),
    amount: z.number().positive(),
    type: z.enum(['rebate', 'tax_credit', 'grant']),
  })),
});

export const GreenCertificationSchema = z.object({
  propertyId: z.string(),
  certifications: z.array(z.object({
    type: z.enum(['LEED', 'Energy_Star', 'BREEAM', 'Passive_House', 'Green_Star']),
    level: z.string().optional(),
    certifiedDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    score: z.number().optional(),
  })),
  eligibleFor: z.array(z.string()),
  valueImpact: z.number().describe('Percentage increase in property value'),
});

export type EnergyEfficiency = z.infer<typeof EnergyEfficiencySchema>;
export type SolarPotential = z.infer<typeof SolarPotentialSchema>;
export type GreenCertification = z.infer<typeof GreenCertificationSchema>;

export class EnvironmentalAnalyzer {
  public analyzeEnergyEfficiency(propertyId: string, buildingData: {
    area: number;
    yearBuilt: number;
    heatingType: string;
    insulation: string;
  }): EnergyEfficiency {
    const age = new Date().getFullYear() - buildingData.yearBuilt;
    let epcScore = 100;

    if (age > 50) epcScore -= 40;
    else if (age > 30) epcScore -= 25;
    else if (age > 15) epcScore -= 15;

    if (buildingData.insulation === 'poor') epcScore -= 20;
    else if (buildingData.insulation === 'moderate') epcScore -= 10;

    epcScore = Math.max(0, Math.min(100, epcScore));

    const epcRating = this.scoreToRating(epcScore);
    const annualConsumption = buildingData.area * (100 - epcScore) * 0.5;
    const annualCost = annualConsumption * 0.15;
    const co2Emissions = annualConsumption * 0.5;

    return {
      propertyId,
      epcRating,
      epcScore,
      annualEnergyConsumption: Math.round(annualConsumption),
      annualEnergyCost: Math.round(annualCost),
      co2Emissions: Math.round(co2Emissions),
      recommendations: this.generateRecommendations(epcScore),
    };
  }

  public analyzeSolarPotential(propertyId: string, roofData: {
    area: number;
    orientation: string;
    tilt: number;
    shading: number;
  }): SolarPotential {
    let suitabilityScore = 100;

    if (roofData.orientation !== 'south') suitabilityScore -= 15;
    if (roofData.tilt < 30 || roofData.tilt > 45) suitabilityScore -= 10;
    suitabilityScore -= roofData.shading;

    const suitability = suitabilityScore >= 80 ? 'excellent' : suitabilityScore >= 60 ? 'good' : suitabilityScore >= 40 ? 'fair' : 'poor';

    const usableArea = roofData.area * 0.7;
    const panelCapacity = usableArea * 0.15;
    const annualProduction = panelCapacity * 1000 * (suitabilityScore / 100);
    const installationCost = panelCapacity * 1500;
    const annualSavings = annualProduction * 0.15;
    const payback = installationCost / annualSavings;

    return {
      propertyId,
      roofArea: roofData.area,
      suitability,
      estimatedPanelCapacity: Math.round(panelCapacity * 10) / 10,
      annualProduction: Math.round(annualProduction),
      installationCost: Math.round(installationCost),
      annualSavings: Math.round(annualSavings),
      paybackPeriod: Math.round(payback * 10) / 10,
      lifetimeSavings: Math.round(annualSavings * 25),
      carbonOffset: Math.round(annualProduction * 0.5),
      incentives: [],
    };
  }

  private scoreToRating(score: number): EnergyEfficiency['epcRating'] {
    if (score >= 95) return 'A++';
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    if (score >= 25) return 'E';
    if (score >= 10) return 'F';
    return 'G';
  }

  private generateRecommendations(currentScore: number): EnergyEfficiency['recommendations'] {
    const recs: EnergyEfficiency['recommendations'] = [];

    if (currentScore < 70) {
      recs.push({
        improvement: 'Upgrade insulation',
        estimatedCost: 5000,
        annualSavings: 800,
        paybackYears: 6.25,
        co2Reduction: 1000,
      });
    }

    if (currentScore < 80) {
      recs.push({
        improvement: 'Install double-glazed windows',
        estimatedCost: 8000,
        annualSavings: 500,
        paybackYears: 16,
        co2Reduction: 600,
      });
    }

    return recs;
  }
}
