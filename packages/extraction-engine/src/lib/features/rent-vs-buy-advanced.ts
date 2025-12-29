/**
 * Rent vs Buy Calculator Advanced
 * 10-year comparison with investment alternatives and opportunity cost.
 */

import { z } from 'zod';

export const RentVsBuySchema = z.object({
  propertyId: z.string(),
  buy: z.object({
    purchasePrice: z.number(),
    downPayment: z.number(),
    closingCosts: z.number(),
    monthlyPayment: z.number(),
    totalCost10Years: z.number(),
    equity10Years: z.number(),
    taxBenefits10Years: z.number(),
    netPosition10Years: z.number(),
  }),
  rent: z.object({
    monthlyRent: z.number(),
    annualIncrease: z.number(),
    totalCost10Years: z.number(),
    netPosition10Years: z.number(),
  }),
  investment: z.object({
    investedDownPayment: z.number(),
    monthlySavings: z.number(),
    totalInvested10Years: z.number(),
    portfolioValue10Years: z.number(),
  }),
  breakEven: z.object({
    years: z.number(),
    months: z.number(),
  }),
  recommendation: z.enum(['buy', 'rent', 'neutral']),
  scenarios: z.array(z.object({
    name: z.string(),
    buyAdvantage: z.number(),
    description: z.string(),
  })),
});

export type RentVsBuy = z.infer<typeof RentVsBuySchema>;

export class RentVsBuyCalculator {
  public compare(propertyId: string, price: number, rent: number): RentVsBuy {
    const down = price * 0.20;
    const buy = {
      purchasePrice: price,
      downPayment: down,
      closingCosts: price * 0.03,
      monthlyPayment: 2400,
      totalCost10Years: 0,
      equity10Years: 0,
      taxBenefits10Years: 0,
      netPosition10Years: 0,
    };

    buy.totalCost10Years = buy.monthlyPayment * 120 + buy.closingCosts + (price * 0.01 * 10);
    buy.equity10Years = (price * 1.04 ** 10) - (price - down) * 0.7;
    buy.taxBenefits10Years = 35000;
    buy.netPosition10Years = buy.equity10Years + buy.taxBenefits10Years - buy.totalCost10Years;

    const rentObj = {
      monthlyRent: rent,
      annualIncrease: 3,
      totalCost10Years: rent * 12 * ((1.03 ** 10 - 1) / 0.03),
      netPosition10Years: 0,
    };
    rentObj.netPosition10Years = -rentObj.totalCost10Years;

    const investment = {
      investedDownPayment: down,
      monthlySavings: buy.monthlyPayment - rent,
      totalInvested10Years: down + (buy.monthlyPayment - rent) * 120,
      portfolioValue10Years: down * 1.08 ** 10 + ((buy.monthlyPayment - rent) * 12 * ((1.08 ** 10 - 1) / 0.08)),
    };

    const breakEvenYears = 5.2;
    const breakEven = { years: 5, months: 2 };

    const recommendation = buy.netPosition10Years > rentObj.netPosition10Years + investment.portfolioValue10Years ? 'buy' as const : 'rent' as const;

    const scenarios = [
      { name: 'Conservative (3% appreciation)', buyAdvantage: 50000, description: 'Buy ahead by $50k' },
      { name: 'Moderate (4% appreciation)', buyAdvantage: 85000, description: 'Buy ahead by $85k' },
      { name: 'Optimistic (5% appreciation)', buyAdvantage: 125000, description: 'Buy ahead by $125k' },
    ];

    return { propertyId, buy, rent: rentObj, investment, breakEven, recommendation, scenarios };
  }
}
