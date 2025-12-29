/**
 * Property Flip Analyzer
 * Complete fix-and-flip analysis with ARV, costs, and profit projections.
 */

import { z } from 'zod';

export const FlipAnalysisSchema = z.object({
  propertyId: z.string(),
  purchasePrice: z.number().positive(),
  arv: z.number().positive().describe('After Repair Value'),
  rehabCosts: z.object({
    structural: z.number(),
    electrical: z.number(),
    plumbing: z.number(),
    kitchen: z.number(),
    bathrooms: z.number(),
    flooring: z.number(),
    painting: z.number(),
    landscaping: z.number(),
    permits: z.number(),
    contingency: z.number(),
    total: z.number(),
  }),
  holdingCosts: z.object({
    mortgage: z.number(),
    propertyTax: z.number(),
    insurance: z.number(),
    utilities: z.number(),
    monthlyTotal: z.number(),
    estimatedMonths: z.number(),
    total: z.number(),
  }),
  sellingCosts: z.object({
    realEstateCommission: z.number(),
    closingCosts: z.number(),
    stagingPhotography: z.number(),
    total: z.number(),
  }),
  totalInvestment: z.number(),
  projectedProfit: z.number(),
  roi: z.number().describe('Return on investment percentage'),
  annualizedROI: z.number(),
  profitMargin: z.number().describe('Profit as percentage of ARV'),
  minimumARV: z.number().describe('Minimum ARV needed to break even'),
  seventyPercentRule: z.object({
    maxPurchasePrice: z.number(),
    withinRule: z.boolean(),
    description: z.string(),
  }),
  timeline: z.object({
    rehabWeeks: z.number(),
    marketingWeeks: z.number(),
    totalMonths: z.number(),
  }),
  riskFactors: z.array(z.string()),
  recommendation: z.enum(['excellent', 'good', 'marginal', 'avoid']),
});

export type FlipAnalysis = z.infer<typeof FlipAnalysisSchema>;

export class PropertyFlipAnalyzer {
  public analyzeFlip(
    propertyId: string,
    purchasePrice: number,
    estimatedARV: number,
    propertyCondition: 'excellent' | 'good' | 'fair' | 'poor',
    squareMeters: number
  ): FlipAnalysis {
    // Calculate rehab costs based on condition
    const rehabCosts = this.estimateRehabCosts(propertyCondition, squareMeters);

    // Calculate holding costs
    const estimatedMonths = this.estimateTimeline(propertyCondition).totalMonths;
    const holdingCosts = this.calculateHoldingCosts(purchasePrice, rehabCosts.total, estimatedMonths);

    // Calculate selling costs
    const sellingCosts = {
      realEstateCommission: estimatedARV * 0.06,
      closingCosts: estimatedARV * 0.02,
      stagingPhotography: 3000,
      total: 0,
    };
    sellingCosts.total = sellingCosts.realEstateCommission + sellingCosts.closingCosts + sellingCosts.stagingPhotography;

    // Total investment
    const totalInvestment = purchasePrice + rehabCosts.total + holdingCosts.total + sellingCosts.total;

    // Profit calculations
    const projectedProfit = estimatedARV - totalInvestment;
    const roi = (projectedProfit / totalInvestment) * 100;
    const annualizedROI = roi / (estimatedMonths / 12);
    const profitMargin = (projectedProfit / estimatedARV) * 100;

    // Break-even ARV
    const minimumARV = totalInvestment / 0.85; // Need 15% profit margin minimum

    // 70% Rule check
    const seventyPercentRule = {
      maxPurchasePrice: (estimatedARV * 0.70) - rehabCosts.total,
      withinRule: purchasePrice <= ((estimatedARV * 0.70) - rehabCosts.total),
      description: 'Purchase price should not exceed 70% of ARV minus rehab costs',
    };

    // Timeline
    const timeline = this.estimateTimeline(propertyCondition);

    // Risk factors
    const riskFactors = this.identifyRiskFactors(
      purchasePrice,
      estimatedARV,
      rehabCosts.total,
      profitMargin,
      seventyPercentRule.withinRule
    );

    // Recommendation
    let recommendation: FlipAnalysis['recommendation'];
    if (roi >= 20 && seventyPercentRule.withinRule && profitMargin >= 15) {
      recommendation = 'excellent';
    } else if (roi >= 15 && profitMargin >= 10) {
      recommendation = 'good';
    } else if (roi >= 10 && profitMargin >= 5) {
      recommendation = 'marginal';
    } else {
      recommendation = 'avoid';
    }

    return {
      propertyId,
      purchasePrice,
      arv: estimatedARV,
      rehabCosts,
      holdingCosts,
      sellingCosts,
      totalInvestment: Math.round(totalInvestment),
      projectedProfit: Math.round(projectedProfit),
      roi: Math.round(roi * 10) / 10,
      annualizedROI: Math.round(annualizedROI * 10) / 10,
      profitMargin: Math.round(profitMargin * 10) / 10,
      minimumARV: Math.round(minimumARV),
      seventyPercentRule: {
        ...seventyPercentRule,
        maxPurchasePrice: Math.round(seventyPercentRule.maxPurchasePrice),
      },
      timeline,
      riskFactors,
      recommendation,
    };
  }

  private estimateRehabCosts(condition: string, area: number): FlipAnalysis['rehabCosts'] {
    const baseMultipliers = {
      excellent: 0.1,
      good: 0.3,
      fair: 0.5,
      poor: 0.8,
    };

    const multiplier = baseMultipliers[condition as keyof typeof baseMultipliers];
    const baseCostPerSqm = 500;

    const structural = area * baseCostPerSqm * multiplier * 0.2;
    const electrical = area * baseCostPerSqm * multiplier * 0.15;
    const plumbing = area * baseCostPerSqm * multiplier * 0.15;
    const kitchen = condition === 'poor' || condition === 'fair' ? 15000 : 8000;
    const bathrooms = condition === 'poor' || condition === 'fair' ? 10000 : 5000;
    const flooring = area * 50 * multiplier;
    const painting = area * 20;
    const landscaping = 3000;
    const permits = 2000;

    const subtotal = structural + electrical + plumbing + kitchen + bathrooms + flooring + painting + landscaping + permits;
    const contingency = subtotal * 0.15;
    const total = subtotal + contingency;

    return {
      structural: Math.round(structural),
      electrical: Math.round(electrical),
      plumbing: Math.round(plumbing),
      kitchen: Math.round(kitchen),
      bathrooms: Math.round(bathrooms),
      flooring: Math.round(flooring),
      painting: Math.round(painting),
      landscaping: Math.round(landscaping),
      permits: Math.round(permits),
      contingency: Math.round(contingency),
      total: Math.round(total),
    };
  }

  private calculateHoldingCosts(purchasePrice: number, rehabCost: number, months: number): FlipAnalysis['holdingCosts'] {
    const loanAmount = purchasePrice + rehabCost;
    const monthlyMortgage = (loanAmount * 0.08) / 12; // 8% hard money rate
    const monthlyPropertyTax = (purchasePrice * 0.015) / 12;
    const monthlyInsurance = 150;
    const monthlyUtilities = 200;

    const monthlyTotal = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyUtilities;
    const total = monthlyTotal * months;

    return {
      mortgage: Math.round(monthlyMortgage),
      propertyTax: Math.round(monthlyPropertyTax),
      insurance: monthlyInsurance,
      utilities: monthlyUtilities,
      monthlyTotal: Math.round(monthlyTotal),
      estimatedMonths: months,
      total: Math.round(total),
    };
  }

  private estimateTimeline(condition: string): FlipAnalysis['timeline'] {
    const rehabWeeks = {
      excellent: 4,
      good: 8,
      fair: 12,
      poor: 16,
    }[condition] || 12;

    const marketingWeeks = 8;
    const totalMonths = Math.ceil((rehabWeeks + marketingWeeks) / 4);

    return {
      rehabWeeks,
      marketingWeeks,
      totalMonths,
    };
  }

  private identifyRiskFactors(
    purchasePrice: number,
    arv: number,
    rehabCost: number,
    profitMargin: number,
    within70Rule: boolean
  ): string[] {
    const risks: string[] = [];

    if (!within70Rule) {
      risks.push('Violates 70% rule - purchase price too high');
    }

    if (profitMargin < 10) {
      risks.push('Low profit margin - little room for error');
    }

    if (rehabCost > purchasePrice * 0.5) {
      risks.push('High rehab costs relative to purchase price');
    }

    if (arv / purchasePrice < 1.3) {
      risks.push('Limited spread between purchase and ARV');
    }

    if (risks.length === 0) {
      risks.push('No major risk factors identified');
    }

    return risks;
  }
}
