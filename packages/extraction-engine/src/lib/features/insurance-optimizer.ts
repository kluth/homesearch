/**
 * Insurance Optimizer
 * Find best home insurance rates and coverage options with bundling opportunities.
 */

import { z } from 'zod';

export const InsuranceQuoteSchema = z.object({
  propertyId: z.string(),
  propertyInfo: z.object({
    value: z.number(),
    yearBuilt: z.number(),
    squareMeters: z.number(),
    constructionType: z.string(),
    roofAge: z.number(),
  }),
  recommendedCoverage: z.object({
    dwelling: z.number(),
    personalProperty: z.number(),
    liability: z.number(),
    medicalPayments: z.number(),
    lossOfUse: z.number(),
  }),
  quotes: z.array(z.object({
    provider: z.string(),
    annualPremium: z.number(),
    monthlyPremium: z.number(),
    deductible: z.number(),
    coverageLevel: z.enum(['basic', 'standard', 'premium', 'comprehensive']),
    features: z.array(z.string()),
    discounts: z.array(z.object({
      name: z.string(),
      amount: z.number(),
    })),
    rating: z.object({
      overall: z.number(),
      customerService: z.number(),
      claimsProcess: z.number(),
      financialStrength: z.string(),
    }),
  })),
  bundleOpportunities: z.array(z.object({
    type: z.enum(['auto', 'life', 'umbrella']),
    provider: z.string(),
    savings: z.number(),
    totalPremium: z.number(),
  })),
  riskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['increases', 'decreases', 'neutral']),
    adjustment: z.number(),
  })),
  discountOpportunities: z.array(z.object({
    type: z.string(),
    potentialSavings: z.number(),
    requirements: z.string(),
    difficulty: z.enum(['easy', 'moderate', 'difficult']),
  })),
  comparison: z.object({
    lowestPremium: z.number(),
    highestPremium: z.number(),
    averagePremium: z.number(),
    potentialSavings: z.number(),
  }),
});

export type InsuranceQuote = z.infer<typeof InsuranceQuoteSchema>;

export class InsuranceOptimizer {
  public getInsuranceQuotes(
    propertyId: string,
    propertyValue: number,
    yearBuilt: number,
    squareMeters: number,
    location: {
      state: string;
      city: string;
      zipCode: string;
    },
    roofAge: number = 10
  ): InsuranceQuote {
    const propertyInfo = {
      value: propertyValue,
      yearBuilt,
      squareMeters,
      constructionType: yearBuilt > 1990 ? 'Frame' : 'Masonry',
      roofAge,
    };

    // Recommended coverage amounts
    const recommendedCoverage = {
      dwelling: propertyValue,
      personalProperty: Math.round(propertyValue * 0.5),
      liability: 300000,
      medicalPayments: 5000,
      lossOfUse: Math.round(propertyValue * 0.2),
    };

    // Risk factors
    const riskFactors = this.assessRiskFactors(propertyInfo, location);

    // Base premium calculation
    const basePremium = this.calculateBasePremium(propertyValue, squareMeters, yearBuilt, riskFactors);

    // Generate quotes from different providers
    const quotes = this.generateQuotes(basePremium, recommendedCoverage);

    // Bundle opportunities
    const bundleOpportunities = this.findBundleOpportunities(quotes);

    // Discount opportunities
    const discountOpportunities = this.findDiscountOpportunities(propertyInfo);

    // Comparison
    const premiums = quotes.map(q => q.annualPremium);
    const comparison = {
      lowestPremium: Math.min(...premiums),
      highestPremium: Math.max(...premiums),
      averagePremium: Math.round(premiums.reduce((a, b) => a + b, 0) / premiums.length),
      potentialSavings: Math.max(...premiums) - Math.min(...premiums),
    };

    return {
      propertyId,
      propertyInfo,
      recommendedCoverage,
      quotes,
      bundleOpportunities,
      riskFactors,
      discountOpportunities,
      comparison,
    };
  }

  private calculateBasePremium(
    value: number,
    area: number,
    yearBuilt: number,
    riskFactors: any[]
  ): number {
    let premium = value * 0.003; // Base 0.3% of home value

    // Age adjustment
    const age = new Date().getFullYear() - yearBuilt;
    if (age > 30) premium *= 1.3;
    else if (age > 20) premium *= 1.15;
    else if (age < 5) premium *= 0.9;

    // Apply risk factors
    riskFactors.forEach(risk => {
      premium *= (1 + risk.adjustment / 100);
    });

    return Math.round(premium);
  }

  private assessRiskFactors(propertyInfo: any, location: any): InsuranceQuote['riskFactors'] {
    const factors: InsuranceQuote['riskFactors'] = [];

    // Roof age
    if (propertyInfo.roofAge > 15) {
      factors.push({
        factor: 'Roof age over 15 years',
        impact: 'increases',
        adjustment: 20,
      });
    } else if (propertyInfo.roofAge < 5) {
      factors.push({
        factor: 'New roof',
        impact: 'decreases',
        adjustment: -10,
      });
    }

    // Location risks (mock - would use real data)
    factors.push({
      factor: 'Low crime area',
      impact: 'decreases',
      adjustment: -5,
    });

    // Home age
    const age = new Date().getFullYear() - propertyInfo.yearBuilt;
    if (age > 50) {
      factors.push({
        factor: 'Historic home age',
        impact: 'increases',
        adjustment: 15,
      });
    }

    return factors;
  }

  private generateQuotes(basePremium: number, coverage: any): InsuranceQuote['quotes'] {
    const providers = [
      {
        name: 'State Farm',
        multiplier: 1.0,
        rating: { overall: 4.5, customerService: 4.7, claimsProcess: 4.3, financialStrength: 'A++' },
        discounts: [
          { name: 'Multi-policy', amount: 200 },
          { name: 'Claims-free', amount: 150 },
        ],
      },
      {
        name: 'Allstate',
        multiplier: 1.05,
        rating: { overall: 4.3, customerService: 4.2, claimsProcess: 4.4, financialStrength: 'A+' },
        discounts: [
          { name: 'Safe home', amount: 175 },
        ],
      },
      {
        name: 'USAA',
        multiplier: 0.85,
        rating: { overall: 4.8, customerService: 4.9, claimsProcess: 4.7, financialStrength: 'A++' },
        discounts: [
          { name: 'Military', amount: 300 },
          { name: 'Multi-policy', amount: 250 },
        ],
      },
      {
        name: 'Liberty Mutual',
        multiplier: 1.1,
        rating: { overall: 4.1, customerService: 4.0, claimsProcess: 4.2, financialStrength: 'A' },
        discounts: [
          { name: 'New customer', amount: 100 },
        ],
      },
    ];

    return providers.map(provider => {
      const annualPremium = Math.round(basePremium * provider.multiplier -
        provider.discounts.reduce((sum, d) => sum + d.amount, 0));

      return {
        provider: provider.name,
        annualPremium,
        monthlyPremium: Math.round(annualPremium / 12),
        deductible: 1000,
        coverageLevel: 'standard' as const,
        features: [
          'Replacement cost coverage',
          'Water backup coverage',
          'Identity theft protection',
          '24/7 claims service',
        ],
        discounts: provider.discounts,
        rating: provider.rating,
      };
    });
  }

  private findBundleOpportunities(quotes: InsuranceQuote['quotes']): InsuranceQuote['bundleOpportunities'] {
    return [
      {
        type: 'auto',
        provider: 'State Farm',
        savings: 400,
        totalPremium: Math.round(quotes[0].annualPremium * 0.85 + 1200),
      },
      {
        type: 'umbrella',
        provider: 'State Farm',
        savings: 150,
        totalPremium: Math.round(quotes[0].annualPremium * 0.95 + 300),
      },
    ];
  }

  private findDiscountOpportunities(propertyInfo: any): InsuranceQuote['discountOpportunities'] {
    return [
      {
        type: 'Smart home security system',
        potentialSavings: 200,
        requirements: 'Install monitored alarm system',
        difficulty: 'moderate',
      },
      {
        type: 'Fire/smoke detection',
        potentialSavings: 100,
        requirements: 'Professional monitoring of smoke/fire alarms',
        difficulty: 'easy',
      },
      {
        type: 'Water leak detection',
        potentialSavings: 150,
        requirements: 'Install smart water leak sensors',
        difficulty: 'easy',
      },
      {
        type: 'Storm shutters',
        potentialSavings: 300,
        requirements: 'Install hurricane/storm shutters',
        difficulty: 'difficult',
      },
      {
        type: 'Roof upgrade',
        potentialSavings: 500,
        requirements: 'Replace roof with impact-resistant materials',
        difficulty: 'difficult',
      },
    ];
  }
}
