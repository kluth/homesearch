/**
 * Home Equity Tracker
 * Track equity growth over time with real-time market updates and refinance opportunities.
 */

import { z } from 'zod';

export const HomeEquitySchema = z.object({
  propertyId: z.string(),
  currentValue: z.number().positive(),
  purchasePrice: z.number().positive(),
  purchaseDate: z.string(),
  mortgageBalance: z.number(),
  equity: z.object({
    amount: z.number(),
    percentage: z.number().min(0).max(100),
  }),
  appreciation: z.object({
    amount: z.number(),
    percentage: z.number(),
    annualized: z.number(),
  }),
  equityGrowth: z.array(z.object({
    month: z.string(),
    propertyValue: z.number(),
    mortgageBalance: z.number(),
    equity: z.number(),
    equityPercentage: z.number(),
  })),
  projection: z.object({
    oneYear: z.object({
      estimatedValue: z.number(),
      estimatedEquity: z.number(),
      equityPercentage: z.number(),
    }),
    fiveYear: z.object({
      estimatedValue: z.number(),
      estimatedEquity: z.number(),
      equityPercentage: z.number(),
    }),
    tenYear: z.object({
      estimatedValue: z.number(),
      estimatedEquity: z.number(),
      equityPercentage: z.number(),
    }),
  }),
  refinanceOpportunities: z.array(z.object({
    type: z.enum(['rate_term', 'cash_out', 'heloc']),
    currentRate: z.number(),
    newRate: z.number(),
    monthlySavings: z.number(),
    cashOut: z.number().optional(),
    breakEvenMonths: z.number(),
    recommendation: z.string(),
  })),
  heloc: z.object({
    availableCredit: z.number(),
    estimatedRate: z.number(),
    monthlyPayment: z.number(),
  }),
});

export type HomeEquity = z.infer<typeof HomeEquitySchema>;

export class HomeEquityTracker {
  public trackEquity(
    propertyId: string,
    currentValue: number,
    purchasePrice: number,
    purchaseDate: string,
    mortgageBalance: number,
    interestRate: number,
    monthlyPayment: number
  ): HomeEquity {
    const equity = currentValue - mortgageBalance;
    const equityPercentage = (equity / currentValue) * 100;

    const appreciation = {
      amount: currentValue - purchasePrice,
      percentage: ((currentValue - purchasePrice) / purchasePrice) * 100,
      annualized: this.calculateAnnualized(purchasePrice, currentValue, purchaseDate),
    };

    const equityGrowth = this.generateEquityGrowth(
      purchasePrice,
      purchaseDate,
      currentValue,
      mortgageBalance,
      monthlyPayment
    );

    const projection = this.projectEquity(
      currentValue,
      mortgageBalance,
      appreciation.annualized,
      monthlyPayment
    );

    const refinanceOpportunities = this.findRefinanceOpportunities(
      mortgageBalance,
      interestRate,
      monthlyPayment,
      equity
    );

    const maxHeloc = equity * 0.85; // Max 85% LTV
    const heloc = {
      availableCredit: Math.round(maxHeloc),
      estimatedRate: 7.5,
      monthlyPayment: Math.round((maxHeloc * 0.075) / 12),
    };

    return {
      propertyId,
      currentValue,
      purchasePrice,
      purchaseDate,
      mortgageBalance,
      equity: {
        amount: Math.round(equity),
        percentage: Math.round(equityPercentage * 10) / 10,
      },
      appreciation: {
        amount: Math.round(appreciation.amount),
        percentage: Math.round(appreciation.percentage * 10) / 10,
        annualized: Math.round(appreciation.annualized * 10) / 10,
      },
      equityGrowth,
      projection,
      refinanceOpportunities,
      heloc,
    };
  }

  private calculateAnnualized(purchasePrice: number, currentValue: number, purchaseDate: string): number {
    const years = (new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 0.1) return 0;
    return (Math.pow(currentValue / purchasePrice, 1 / years) - 1) * 100;
  }

  private generateEquityGrowth(
    purchasePrice: number,
    purchaseDate: string,
    currentValue: number,
    currentMortgage: number,
    monthlyPayment: number
  ): HomeEquity['equityGrowth'] {
    const months: HomeEquity['equityGrowth'] = [];
    const startDate = new Date(purchaseDate);
    const monthsSincePurchase = Math.floor(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const appreciationRate = (currentValue / purchasePrice - 1) / monthsSincePurchase;

    for (let i = 0; i <= Math.min(monthsSincePurchase, 60); i += 6) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      const propertyValue = purchasePrice * (1 + appreciationRate * i);
      const mortgageBalance = currentMortgage + (monthlyPayment * 0.7 * (monthsSincePurchase - i));
      const equity = propertyValue - mortgageBalance;

      months.push({
        month: date.toISOString().slice(0, 7),
        propertyValue: Math.round(propertyValue),
        mortgageBalance: Math.round(Math.max(0, mortgageBalance)),
        equity: Math.round(equity),
        equityPercentage: Math.round((equity / propertyValue) * 100 * 10) / 10,
      });
    }

    return months;
  }

  private projectEquity(
    currentValue: number,
    mortgageBalance: number,
    annualAppreciation: number,
    monthlyPayment: number
  ): HomeEquity['projection'] {
    const project = (years: number) => {
      const estimatedValue = currentValue * Math.pow(1 + annualAppreciation / 100, years);
      const principalPaydown = monthlyPayment * 0.7 * 12 * years; // Assume 70% goes to principal
      const estimatedMortgage = Math.max(0, mortgageBalance - principalPaydown);
      const estimatedEquity = estimatedValue - estimatedMortgage;

      return {
        estimatedValue: Math.round(estimatedValue),
        estimatedEquity: Math.round(estimatedEquity),
        equityPercentage: Math.round((estimatedEquity / estimatedValue) * 100 * 10) / 10,
      };
    };

    return {
      oneYear: project(1),
      fiveYear: project(5),
      tenYear: project(10),
    };
  }

  private findRefinanceOpportunities(
    mortgageBalance: number,
    currentRate: number,
    monthlyPayment: number,
    equity: number
  ): HomeEquity['refinanceOpportunities'] {
    const opportunities: HomeEquity['refinanceOpportunities'] = [];

    // Rate & Term Refinance
    if (currentRate > 6.5) {
      const newRate = 6.0;
      const newMonthlyPayment = this.calculateMonthlyPayment(mortgageBalance, newRate, 30);
      const monthlySavings = monthlyPayment - newMonthlyPayment;
      const closingCosts = mortgageBalance * 0.02;

      opportunities.push({
        type: 'rate_term',
        currentRate,
        newRate,
        monthlySavings: Math.round(monthlySavings),
        breakEvenMonths: Math.ceil(closingCosts / monthlySavings),
        recommendation: `Save $${Math.round(monthlySavings)}/month by refinancing to ${newRate}%`,
      });
    }

    // Cash-Out Refinance
    if (equity > 100000) {
      const maxCashOut = equity * 0.8;
      opportunities.push({
        type: 'cash_out',
        currentRate,
        newRate: currentRate + 0.25,
        monthlySavings: 0,
        cashOut: Math.round(maxCashOut),
        breakEvenMonths: 0,
        recommendation: `Access up to $${Math.round(maxCashOut).toLocaleString()} in cash`,
      });
    }

    // HELOC
    if (equity > 50000) {
      const helocLimit = equity * 0.85;
      opportunities.push({
        type: 'heloc',
        currentRate: currentRate,
        newRate: 7.5,
        monthlySavings: 0,
        breakEvenMonths: 0,
        recommendation: `HELOC line of credit up to $${Math.round(helocLimit).toLocaleString()}`,
      });
    }

    return opportunities;
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
}
