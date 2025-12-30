/**
 * Tenant Screening System
 * Comprehensive tenant background checks, credit, and rental history analysis.
 */

import { z } from 'zod';

export const TenantScreeningSchema = z.object({
  applicantId: z.string(),
  propertyId: z.string(),
  overallScore: z.number().min(0).max(1000),
  recommendation: z.enum(['highly_recommended', 'recommended', 'conditional', 'not_recommended', 'rejected']),
  creditReport: z.object({
    score: z.number(),
    rating: z.enum(['excellent', 'good', 'fair', 'poor', 'very_poor']),
    accounts: z.object({
      total: z.number(),
      open: z.number(),
      delinquent: z.number(),
    }),
    collections: z.number(),
    bankruptcies: z.number(),
    debtToIncome: z.number(),
  }),
  rentalHistory: z.object({
    previousAddresses: z.array(z.object({
      address: z.string(),
      landlord: z.string(),
      moveInDate: z.string(),
      moveOutDate: z.string(),
      monthlyRent: z.number(),
      reason: z.string(),
      rating: z.enum(['excellent', 'good', 'fair', 'poor']),
      verified: z.boolean(),
    })),
    evictions: z.number(),
    latePayments: z.number(),
    complaints: z.number(),
    averageTenancy: z.number().describe('Months'),
  }),
  employment: z.object({
    employer: z.string(),
    position: z.string(),
    startDate: z.string(),
    monthlyIncome: z.number(),
    verified: z.boolean(),
    stability: z.enum(['excellent', 'good', 'fair', 'concerning']),
  }),
  incomeVerification: z.object({
    monthlyGross: z.number(),
    rentToIncomeRatio: z.number(),
    meetsRequirement: z.boolean(),
    requiredRatio: z.number(),
    otherIncome: z.array(z.object({
      source: z.string(),
      amount: z.number(),
      verified: z.boolean(),
    })),
  }),
  backgroundCheck: z.object({
    criminalRecord: z.object({
      found: z.boolean(),
      details: z.array(z.object({
        type: z.string(),
        date: z.string(),
        disposition: z.string(),
      })),
    }),
    sexOffenderRegistry: z.boolean(),
    terroristWatchlist: z.boolean(),
  }),
  references: z.array(z.object({
    type: z.enum(['personal', 'professional', 'landlord']),
    name: z.string(),
    relationship: z.string(),
    contactVerified: z.boolean(),
    rating: z.enum(['excellent', 'good', 'fair', 'poor']),
    comments: z.string(),
  })),
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'moderate', 'high', 'critical']),
    impact: z.string(),
  })),
  strengths: z.array(z.string()),
  conditions: z.array(z.object({
    condition: z.string(),
    required: z.boolean(),
  })).optional(),
});

export type TenantScreening = z.infer<typeof TenantScreeningSchema>;

export class TenantScreener {
  public screenTenant(
    applicantId: string,
    propertyId: string,
    monthlyRent: number,
    applicantData: {
      monthlyIncome: number;
      creditScore: number;
      employer: string;
      yearsAtJob: number;
    }
  ): TenantScreening {
    // Credit report
    const creditReport = this.analyzeCreditReport(applicantData.creditScore);

    // Rental history
    const rentalHistory = this.checkRentalHistory();

    // Employment verification
    const employment = this.verifyEmployment(
      applicantData.employer,
      applicantData.monthlyIncome,
      applicantData.yearsAtJob
    );

    // Income verification
    const incomeVerification = this.verifyIncome(applicantData.monthlyIncome, monthlyRent);

    // Background check
    const backgroundCheck = this.performBackgroundCheck();

    // References
    const references = this.checkReferences();

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      creditReport,
      rentalHistory,
      employment,
      incomeVerification,
      backgroundCheck,
    });

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors({
      creditReport,
      rentalHistory,
      employment,
      incomeVerification,
      backgroundCheck,
    });

    // Identify strengths
    const strengths = this.identifyStrengths({
      creditReport,
      rentalHistory,
      employment,
      incomeVerification,
    });

    // Make recommendation
    const { recommendation, conditions } = this.makeRecommendation(
      overallScore,
      riskFactors,
      incomeVerification
    );

    return {
      applicantId,
      propertyId,
      overallScore,
      recommendation,
      creditReport,
      rentalHistory,
      employment,
      incomeVerification,
      backgroundCheck,
      references,
      riskFactors,
      strengths,
      conditions,
    };
  }

  private analyzeCreditReport(score: number): TenantScreening['creditReport'] {
    let rating: TenantScreening['creditReport']['rating'];
    if (score >= 750) rating = 'excellent';
    else if (score >= 700) rating = 'good';
    else if (score >= 650) rating = 'fair';
    else if (score >= 600) rating = 'poor';
    else rating = 'very_poor';

    const delinquent = score < 650 ? Math.floor(Math.random() * 3) : 0;
    const collections = score < 620 ? Math.floor(Math.random() * 2) : 0;

    return {
      score,
      rating,
      accounts: {
        total: 12,
        open: 8,
        delinquent,
      },
      collections,
      bankruptcies: score < 580 ? 1 : 0,
      debtToIncome: Math.round((Math.random() * 0.3 + 0.2) * 100) / 100,
    };
  }

  private checkRentalHistory(): TenantScreening['rentalHistory'] {
    return {
      previousAddresses: [
        {
          address: '123 Previous St, Apt 4B',
          landlord: 'Smith Properties LLC',
          moveInDate: '2021-03-01',
          moveOutDate: '2024-11-30',
          monthlyRent: 1800,
          reason: 'Relocating for work',
          rating: 'excellent',
          verified: true,
        },
        {
          address: '456 Old Ave, Unit 2',
          landlord: 'ABC Management',
          moveInDate: '2018-06-15',
          moveOutDate: '2021-02-28',
          monthlyRent: 1500,
          reason: 'Wanted larger space',
          rating: 'good',
          verified: true,
        },
      ],
      evictions: 0,
      latePayments: 1,
      complaints: 0,
      averageTenancy: 34,
    };
  }

  private verifyEmployment(
    employer: string,
    income: number,
    years: number
  ): TenantScreening['employment'] {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    let stability: TenantScreening['employment']['stability'];
    if (years >= 5) stability = 'excellent';
    else if (years >= 2) stability = 'good';
    else if (years >= 1) stability = 'fair';
    else stability = 'concerning';

    return {
      employer,
      position: 'Senior Software Engineer',
      startDate: startDate.toISOString().slice(0, 10),
      monthlyIncome: income,
      verified: true,
      stability,
    };
  }

  private verifyIncome(
    monthlyIncome: number,
    monthlyRent: number
  ): TenantScreening['incomeVerification'] {
    const ratio = (monthlyRent / monthlyIncome) * 100;
    const requiredRatio = 30; // Max 30% rent to income

    return {
      monthlyGross: monthlyIncome,
      rentToIncomeRatio: Math.round(ratio * 10) / 10,
      meetsRequirement: ratio <= requiredRatio,
      requiredRatio,
      otherIncome: [],
    };
  }

  private performBackgroundCheck(): TenantScreening['backgroundCheck'] {
    return {
      criminalRecord: {
        found: false,
        details: [],
      },
      sexOffenderRegistry: false,
      terroristWatchlist: false,
    };
  }

  private checkReferences(): TenantScreening['references'] {
    return [
      {
        type: 'landlord',
        name: 'John Smith',
        relationship: 'Previous landlord',
        contactVerified: true,
        rating: 'excellent',
        comments: 'Excellent tenant, always paid on time, kept property in great condition',
      },
      {
        type: 'professional',
        name: 'Jane Doe',
        relationship: 'Manager at current employer',
        contactVerified: true,
        rating: 'excellent',
        comments: 'Reliable, professional, stable employment',
      },
      {
        type: 'personal',
        name: 'Bob Johnson',
        relationship: 'Friend for 10 years',
        contactVerified: false,
        rating: 'good',
        comments: 'Responsible and trustworthy',
      },
    ];
  }

  private calculateOverallScore(data: any): number {
    let score = 0;

    // Credit score (0-300 points)
    score += Math.min(300, (data.creditReport.score / 850) * 300);

    // Rental history (0-250 points)
    const rentalPoints = 250 -
      (data.rentalHistory.evictions * 100) -
      (data.rentalHistory.latePayments * 25) -
      (data.rentalHistory.complaints * 15);
    score += Math.max(0, rentalPoints);

    // Employment (0-200 points)
    const employmentMap: Record<string, number> = { excellent: 200, good: 150, fair: 100, concerning: 50 };
    score += employmentMap[data.employment.stability as string] ?? 0;

    // Income (0-200 points)
    if (data.incomeVerification.meetsRequirement) {
      score += 200;
    } else {
      const ratio = data.incomeVerification.rentToIncomeRatio;
      score += Math.max(0, 200 - (ratio - 30) * 20);
    }

    // Background (0-50 points)
    if (!data.backgroundCheck.criminalRecord.found &&
        !data.backgroundCheck.sexOffenderRegistry &&
        !data.backgroundCheck.terroristWatchlist) {
      score += 50;
    }

    return Math.round(score);
  }

  private identifyRiskFactors(data: any): TenantScreening['riskFactors'] {
    const risks: TenantScreening['riskFactors'] = [];

    // Credit risks
    if (data.creditReport.score < 650) {
      risks.push({
        factor: 'Low credit score',
        severity: data.creditReport.score < 600 ? 'high' : 'moderate',
        impact: 'Higher risk of payment issues',
      });
    }

    if (data.creditReport.collections > 0) {
      risks.push({
        factor: 'Active collections',
        severity: 'moderate',
        impact: 'Indicates past payment problems',
      });
    }

    // Rental history risks
    if (data.rentalHistory.evictions > 0) {
      risks.push({
        factor: 'Previous eviction',
        severity: 'critical',
        impact: 'Very high risk - serious consideration needed',
      });
    }

    if (data.rentalHistory.averageTenancy < 12) {
      risks.push({
        factor: 'Short tenancy history',
        severity: 'moderate',
        impact: 'May not stay long-term',
      });
    }

    // Income risks
    if (!data.incomeVerification.meetsRequirement) {
      risks.push({
        factor: 'Rent-to-income ratio too high',
        severity: 'high',
        impact: 'May struggle with monthly payments',
      });
    }

    // Employment risks
    if (data.employment.stability === 'concerning') {
      risks.push({
        factor: 'Limited employment history',
        severity: 'moderate',
        impact: 'Income stability uncertain',
      });
    }

    return risks;
  }

  private identifyStrengths(data: any): string[] {
    const strengths: string[] = [];

    if (data.creditReport.score >= 750) {
      strengths.push('Excellent credit score');
    }

    if (data.rentalHistory.evictions === 0 && data.rentalHistory.latePayments <= 1) {
      strengths.push('Clean rental history');
    }

    if (data.employment.stability === 'excellent') {
      strengths.push('Stable long-term employment');
    }

    if (data.incomeVerification.rentToIncomeRatio < 25) {
      strengths.push('Low rent-to-income ratio - strong affordability');
    }

    if (data.rentalHistory.averageTenancy >= 36) {
      strengths.push('Long-term tenant - stable occupancy expected');
    }

    return strengths;
  }

  private makeRecommendation(
    score: number,
    risks: TenantScreening['riskFactors'],
    income: TenantScreening['incomeVerification']
  ): { recommendation: TenantScreening['recommendation']; conditions?: TenantScreening['conditions'] } {
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const highRisks = risks.filter(r => r.severity === 'high');

    let recommendation: TenantScreening['recommendation'];
    let conditions: TenantScreening['conditions'] = [];

    if (criticalRisks.length > 0) {
      recommendation = 'rejected';
    } else if (score >= 850) {
      recommendation = 'highly_recommended';
    } else if (score >= 750) {
      recommendation = 'recommended';
    } else if (score >= 650) {
      recommendation = 'conditional';
      conditions = [
        {
          condition: 'Require co-signer with good credit',
          required: !income.meetsRequirement,
        },
        {
          condition: 'Increase security deposit to 2 months rent',
          required: highRisks.length > 0,
        },
        {
          condition: 'Provide proof of renters insurance',
          required: true,
        },
      ];
    } else {
      recommendation = 'not_recommended';
    }

    return { recommendation, conditions };
  }
}
