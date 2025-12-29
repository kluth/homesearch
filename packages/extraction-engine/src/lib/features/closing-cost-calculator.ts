/**
 * Closing Cost Calculator
 * Comprehensive breakdown of all closing costs and fees.
 */

import { z } from 'zod';

export const ClosingCostSchema = z.object({
  propertyId: z.string(),
  purchasePrice: z.number().positive(),
  downPaymentPercent: z.number().min(0).max(100),
  buyerCosts: z.object({
    loanOriginationFee: z.number(),
    appraisalFee: z.number(),
    creditReportFee: z.number(),
    titleSearch: z.number(),
    titleInsurance: z.number(),
    surveyFee: z.number(),
    homeInspection: z.number(),
    attorneyFees: z.number(),
    recordingFees: z.number(),
    transferTax: z.number(),
    escrowFees: z.number(),
    homeownersInsurance: z.number(),
    propertyTaxEscrow: z.number(),
    privateMortgageInsurance: z.number().optional(),
    miscellaneous: z.number(),
  }),
  sellerCosts: z.object({
    realEstateCommission: z.number(),
    titleInsurance: z.number(),
    attorneyFees: z.number(),
    transferTax: z.number(),
    recordingFees: z.number(),
    prorations: z.number(),
    repairs: z.number(),
    miscellaneous: z.number(),
  }).optional(),
  totalBuyerCosts: z.number(),
  totalSellerCosts: z.number().optional(),
  cashNeededAtClosing: z.number(),
  breakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    percentage: z.number(),
  })),
});

export type ClosingCost = z.infer<typeof ClosingCostSchema>;

export class ClosingCostCalculator {
  public calculateClosingCosts(
    propertyId: string,
    purchasePrice: number,
    downPaymentPercent: number,
    location: string
  ): ClosingCost {
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = purchasePrice - downPayment;

    // Buyer costs
    const buyerCosts = {
      loanOriginationFee: loanAmount * 0.01, // 1% of loan
      appraisalFee: 500,
      creditReportFee: 50,
      titleSearch: 250,
      titleInsurance: purchasePrice * 0.005, // 0.5%
      surveyFee: 400,
      homeInspection: 500,
      attorneyFees: 1000,
      recordingFees: 200,
      transferTax: this.calculateTransferTax(purchasePrice, location),
      escrowFees: 500,
      homeownersInsurance: 1200,
      propertyTaxEscrow: (purchasePrice * 0.015) / 2, // 6 months escrow
      privateMortgageInsurance: downPaymentPercent < 20 ? loanAmount * 0.01 : 0,
      miscellaneous: 300,
    };

    const totalBuyerCosts = Object.values(buyerCosts).reduce((sum, cost) => sum + cost, 0);

    // Seller costs (optional, for information)
    const sellerCosts = {
      realEstateCommission: purchasePrice * 0.06, // 6%
      titleInsurance: purchasePrice * 0.003,
      attorneyFees: 800,
      transferTax: this.calculateTransferTax(purchasePrice, location),
      recordingFees: 150,
      prorations: (purchasePrice * 0.015) / 12 * 6, // Pro-rated taxes
      repairs: 0,
      miscellaneous: 200,
    };

    const totalSellerCosts = Object.values(sellerCosts).reduce((sum, cost) => sum + cost, 0);

    const cashNeededAtClosing = downPayment + totalBuyerCosts;

    // Breakdown
    const breakdown = [
      { category: 'Down Payment', amount: downPayment, percentage: (downPayment / cashNeededAtClosing) * 100 },
      { category: 'Lender Fees', amount: buyerCosts.loanOriginationFee + buyerCosts.appraisalFee + buyerCosts.creditReportFee, percentage: 0 },
      { category: 'Title & Escrow', amount: buyerCosts.titleSearch + buyerCosts.titleInsurance + buyerCosts.escrowFees, percentage: 0 },
      { category: 'Inspections & Survey', amount: buyerCosts.homeInspection + buyerCosts.surveyFee, percentage: 0 },
      { category: 'Taxes & Insurance', amount: buyerCosts.transferTax + buyerCosts.propertyTaxEscrow + buyerCosts.homeownersInsurance, percentage: 0 },
      { category: 'Legal & Recording', amount: buyerCosts.attorneyFees + buyerCosts.recordingFees, percentage: 0 },
    ];

    breakdown.forEach(item => {
      item.percentage = (item.amount / cashNeededAtClosing) * 100;
    });

    return {
      propertyId,
      purchasePrice,
      downPaymentPercent,
      buyerCosts,
      sellerCosts,
      totalBuyerCosts: Math.round(totalBuyerCosts),
      totalSellerCosts: Math.round(totalSellerCosts),
      cashNeededAtClosing: Math.round(cashNeededAtClosing),
      breakdown: breakdown.map(b => ({
        ...b,
        amount: Math.round(b.amount),
        percentage: Math.round(b.percentage * 10) / 10,
      })),
    };
  }

  private calculateTransferTax(price: number, location: string): number {
    // State/local transfer tax rates vary
    const rates: Record<string, number> = {
      california: 0.0011,
      newyork: 0.004,
      texas: 0,
      florida: 0.007,
      default: 0.001,
    };

    const rate = rates[location.toLowerCase()] ?? rates.default;
    return price * rate;
  }
}
