/**
 * Property Tax History Tracker
 * 20+ years of property tax history with appeal opportunities and future projections.
 */

import { z } from 'zod';

export const PropertyTaxHistorySchema = z.object({
  propertyId: z.string(),
  currentYear: z.object({
    year: z.number(),
    assessedValue: z.number(),
    taxableValue: z.number(),
    taxRate: z.number(),
    annualTax: z.number(),
    effectiveRate: z.number(),
  }),
  history: z.array(z.object({
    year: z.number(),
    assessedValue: z.number(),
    taxableValue: z.number(),
    taxRate: z.number(),
    annualTax: z.number(),
    changePercent: z.number(),
  })),
  trends: z.object({
    averageAnnualIncrease: z.number(),
    fiveYearIncrease: z.number(),
    tenYearIncrease: z.number(),
    totalIncreasePercent: z.number(),
  }),
  projections: z.array(z.object({
    year: z.number(),
    estimatedAssessedValue: z.number(),
    estimatedTax: z.number(),
  })),
  comparisons: z.object({
    vsNeighborhood: z.object({
      averageTax: z.number(),
      percentile: z.number(),
      overUnderPaying: z.number(),
    }),
    vsSimilarHomes: z.object({
      averageTax: z.number(),
      difference: z.number(),
      percentDifference: z.number(),
    }),
  }),
  appealOpportunities: z.array(z.object({
    year: z.number(),
    reason: z.string(),
    potentialSavings: z.number(),
    successProbability: z.number(),
    deadline: z.string(),
    recommendation: z.string(),
  })),
  exemptions: z.array(z.object({
    type: z.string(),
    eligible: z.boolean(),
    savings: z.number(),
    requirements: z.string(),
  })),
  specialAssessments: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    startYear: z.number(),
    endYear: z.number(),
    purpose: z.string(),
  })),
});

export type PropertyTaxHistory = z.infer<typeof PropertyTaxHistorySchema>;

export class PropertyTaxHistoryTracker {
  public analyzePropertyTaxHistory(
    propertyId: string,
    currentAssessedValue: number,
    currentMarketValue: number,
    location: {
      county: string;
      city: string;
      state: string;
    }
  ): PropertyTaxHistory {
    const currentYear = new Date().getFullYear();
    const taxRate = 0.012; // 1.2% effective rate

    // Generate 20+ years of history
    const history = this.generateTaxHistory(currentAssessedValue, currentYear, taxRate);

    // Current year data
    const currentYearData = {
      year: currentYear,
      assessedValue: currentAssessedValue,
      taxableValue: currentAssessedValue,
      taxRate: taxRate,
      annualTax: Math.round(currentAssessedValue * taxRate),
      effectiveRate: Math.round((currentAssessedValue * taxRate / currentMarketValue) * 100 * 100) / 100,
    };

    // Calculate trends
    const trends = this.calculateTrends(history);

    // Project future taxes
    const projections = this.projectFutureTaxes(
      currentAssessedValue,
      trends.averageAnnualIncrease,
      taxRate,
      currentYear
    );

    // Comparisons
    const neighborhoodAvg = currentAssessedValue * taxRate * 0.95;
    const similarHomesAvg = currentAssessedValue * taxRate * 1.05;

    const comparisons = {
      vsNeighborhood: {
        averageTax: Math.round(neighborhoodAvg),
        percentile: 62,
        overUnderPaying: Math.round(currentYearData.annualTax - neighborhoodAvg),
      },
      vsSimilarHomes: {
        averageTax: Math.round(similarHomesAvg),
        difference: Math.round(currentYearData.annualTax - similarHomesAvg),
        percentDifference: Math.round(((currentYearData.annualTax - similarHomesAvg) / similarHomesAvg) * 100 * 10) / 10,
      },
    };

    // Appeal opportunities
    const appealOpportunities = this.findAppealOpportunities(
      currentAssessedValue,
      currentMarketValue,
      currentYear,
      history
    );

    // Available exemptions
    const exemptions = [
      {
        type: 'Homestead Exemption',
        eligible: true,
        savings: Math.round(currentAssessedValue * 0.2 * taxRate),
        requirements: 'Primary residence requirement',
      },
      {
        type: 'Senior Exemption',
        eligible: false,
        savings: Math.round(currentAssessedValue * 0.1 * taxRate),
        requirements: 'Age 65+ and income under $75,000',
      },
      {
        type: 'Disability Exemption',
        eligible: false,
        savings: Math.round(currentAssessedValue * 0.15 * taxRate),
        requirements: 'Permanent disability certification',
      },
      {
        type: 'Veterans Exemption',
        eligible: false,
        savings: Math.round(currentAssessedValue * 0.12 * taxRate),
        requirements: 'Honorable discharge and disability rating',
      },
    ];

    // Special assessments
    const specialAssessments = [
      {
        type: 'Street Improvements',
        amount: 1200,
        startYear: currentYear - 2,
        endYear: currentYear + 8,
        purpose: 'Road repaving and sidewalk replacement',
      },
    ];

    return {
      propertyId,
      currentYear: currentYearData,
      history,
      trends,
      projections,
      comparisons,
      appealOpportunities,
      exemptions,
      specialAssessments,
    };
  }

  private generateTaxHistory(
    currentValue: number,
    currentYear: number,
    taxRate: number
  ): PropertyTaxHistory['history'] {
    const history: PropertyTaxHistory['history'] = [];
    const years = 25;

    for (let i = years; i >= 0; i--) {
      const year = currentYear - i;
      const appreciationFactor = Math.pow(1.035, i); // 3.5% annual appreciation
      const assessedValue = Math.round(currentValue / appreciationFactor);
      const annualTax = Math.round(assessedValue * taxRate);

      let changePercent = 0;
      if (history.length > 0) {
        const prevTax = history[history.length - 1].annualTax;
        changePercent = Math.round(((annualTax - prevTax) / prevTax) * 100 * 10) / 10;
      }

      history.push({
        year,
        assessedValue,
        taxableValue: assessedValue,
        taxRate: Math.round(taxRate * 1000) / 1000,
        annualTax,
        changePercent,
      });
    }

    return history;
  }

  private calculateTrends(history: PropertyTaxHistory['history']): PropertyTaxHistory['trends'] {
    const currentTax = history[history.length - 1].annualTax;
    const fiveYearAgo = history[history.length - 6]?.annualTax || currentTax;
    const tenYearAgo = history[history.length - 11]?.annualTax || currentTax;
    const oldestTax = history[0].annualTax;

    const totalYears = history.length - 1;
    const averageAnnualIncrease = totalYears > 0
      ? Math.round(((currentTax - oldestTax) / oldestTax / totalYears) * 100 * 10) / 10
      : 0;

    return {
      averageAnnualIncrease,
      fiveYearIncrease: Math.round(((currentTax - fiveYearAgo) / fiveYearAgo) * 100 * 10) / 10,
      tenYearIncrease: Math.round(((currentTax - tenYearAgo) / tenYearAgo) * 100 * 10) / 10,
      totalIncreasePercent: Math.round(((currentTax - oldestTax) / oldestTax) * 100 * 10) / 10,
    };
  }

  private projectFutureTaxes(
    currentValue: number,
    annualIncreasePercent: number,
    taxRate: number,
    currentYear: number
  ): PropertyTaxHistory['projections'] {
    const projections: PropertyTaxHistory['projections'] = [];

    for (let year = 1; year <= 10; year++) {
      const estimatedValue = currentValue * Math.pow(1 + annualIncreasePercent / 100, year);
      const estimatedTax = estimatedValue * taxRate;

      projections.push({
        year: currentYear + year,
        estimatedAssessedValue: Math.round(estimatedValue),
        estimatedTax: Math.round(estimatedTax),
      });
    }

    return projections;
  }

  private findAppealOpportunities(
    assessedValue: number,
    marketValue: number,
    currentYear: number,
    history: PropertyTaxHistory['history']
  ): PropertyTaxHistory['appealOpportunities'] {
    const opportunities: PropertyTaxHistory['appealOpportunities'] = [];

    // Over-assessment appeal
    if (assessedValue > marketValue * 1.05) {
      const overassessment = assessedValue - marketValue;
      const savings = overassessment * 0.012;

      opportunities.push({
        year: currentYear,
        reason: 'Property assessed above market value',
        potentialSavings: Math.round(savings),
        successProbability: 75,
        deadline: `${currentYear}-09-01`,
        recommendation: 'Strong case - assessed value exceeds market by ' +
          `${Math.round(((assessedValue / marketValue - 1) * 100))}%`,
      });
    }

    // Comparable properties appeal
    const recentIncrease = history[history.length - 1].changePercent;
    if (recentIncrease > 10) {
      opportunities.push({
        year: currentYear,
        reason: 'Disproportionate increase compared to neighborhood',
        potentialSavings: Math.round(assessedValue * 0.05 * 0.012),
        successProbability: 55,
        deadline: `${currentYear}-09-01`,
        recommendation: `Recent increase of ${recentIncrease}% is above typical adjustment`,
      });
    }

    // Property condition appeal
    opportunities.push({
      year: currentYear,
      reason: 'Property defects or needed repairs not reflected',
      potentialSavings: Math.round(assessedValue * 0.08 * 0.012),
      successProbability: 40,
      deadline: `${currentYear}-09-01`,
      recommendation: 'Document all repairs, deferred maintenance, and condition issues',
    });

    return opportunities;
  }
}
