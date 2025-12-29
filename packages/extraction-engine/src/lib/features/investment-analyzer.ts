/**
 * Investment Analyzer
 *
 * Comprehensive analysis tool for evaluating rental and investment properties
 * with ROI calculations, cash flow projections, and risk assessment.
 *
 * Features:
 * - ROI and cash-on-cash return calculations
 * - Cash flow projections (monthly and annual)
 * - Cap rate analysis
 * - Break-even analysis
 * - Appreciation and equity buildup forecasts
 * - Rental yield calculations
 * - Comparative market analysis
 * - Tax implications estimation
 * - Risk scoring and sensitivity analysis
 *
 * @module InvestmentAnalyzer
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const InvestmentPropertySchema = z.object({
  propertyId: z.string(),
  purchasePrice: z.number().positive(),
  estimatedRenovationCost: z.number().nonnegative().default(0),
  closingCosts: z.number().nonnegative().default(0),
  estimatedMonthlyRent: z.number().positive(),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'commercial']),
  bedrooms: z.number().int().positive(),
  bathrooms: z.number().positive(),
  squareMeters: z.number().positive(),
  yearBuilt: z.number().int().positive().optional(),
  location: z.object({
    city: z.string(),
    neighborhood: z.string(),
    country: z.string(),
  }),
});

export const FinancingSchema = z.object({
  downPaymentPercent: z.number().min(0).max(100),
  interestRate: z.number().positive(),
  loanTermYears: z.number().int().positive().default(30),
  isInterestOnly: z.boolean().default(false),
  interestOnlyYears: z.number().int().positive().optional(),
});

export const OperatingExpensesSchema = z.object({
  monthlyPropertyTax: z.number().nonnegative(),
  monthlyInsurance: z.number().nonnegative(),
  monthlyHOAFees: z.number().nonnegative().default(0),
  monthlyUtilities: z.number().nonnegative().default(0),
  monthlyMaintenance: z.number().nonnegative(),
  monthlyPropertyManagement: z.number().nonnegative().default(0),
  annualRepairsBudget: z.number().nonnegative().default(0),
  vacancyRate: z.number().min(0).max(100).default(5).describe('Expected vacancy percentage'),
  otherMonthlyExpenses: z.number().nonnegative().default(0),
});

export const AssumptionsSchema = z.object({
  annualAppreciationRate: z.number().default(3).describe('Expected annual property appreciation %'),
  annualRentIncreaseRate: z.number().default(2).describe('Expected annual rent increase %'),
  annualExpenseIncreaseRate: z.number().default(2.5).describe('Expected annual expense increase %'),
  sellingCostsPercent: z.number().min(0).max(20).default(6).describe('Agent fees and closing costs when selling'),
  incomeTaxRate: z.number().min(0).max(100).default(25).describe('Your marginal income tax rate'),
  capitalGainsTaxRate: z.number().min(0).max(100).default(15).describe('Long-term capital gains tax rate'),
  holdingPeriodYears: z.number().int().positive().default(10),
});

export const CashFlowProjectionSchema = z.object({
  year: z.number().int().positive(),
  rentalIncome: z.number(),
  operatingExpenses: z.number(),
  mortgagePayment: z.number(),
  netOperatingIncome: z.number(),
  cashFlow: z.number(),
  cumulativeCashFlow: z.number(),
  principalPaid: z.number(),
  remainingLoanBalance: z.number(),
  propertyValue: z.number(),
  equity: z.number(),
});

export const ROIMetricsSchema = z.object({
  totalInvestment: z.number().describe('Down payment + closing costs + renovation'),
  annualCashFlow: z.number(),
  cashOnCashReturn: z.number().describe('Annual cash flow / total investment %'),
  capRate: z.number().describe('Net operating income / purchase price %'),
  grossRentMultiplier: z.number(),
  totalROI: z.number().describe('Total return on investment %'),
  annualizedROI: z.number().describe('Annualized return %'),
  equityBuildup: z.number(),
  totalProfit: z.number(),
  breakEvenMonths: z.number().int(),
});

export const InvestmentAnalysisSchema = z.object({
  property: InvestmentPropertySchema,
  financing: FinancingSchema,
  expenses: OperatingExpensesSchema,
  assumptions: AssumptionsSchema,
  roiMetrics: ROIMetricsSchema,
  cashFlowProjections: z.array(CashFlowProjectionSchema),
  monthlyBreakdown: z.object({
    income: z.number(),
    expenses: z.number(),
    mortgagePayment: z.number(),
    netCashFlow: z.number(),
  }),
  exitAnalysis: z.object({
    projectedSalePrice: z.number(),
    sellingCosts: z.number(),
    remainingMortgage: z.number(),
    capitalGainsTax: z.number(),
    netProceeds: z.number(),
    totalReturn: z.number(),
    annualizedReturn: z.number(),
  }),
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(z.string()),
  recommendation: z.enum(['strong_buy', 'buy', 'hold', 'pass', 'avoid']),
  summary: z.string(),
});

export const ComparativeAnalysisSchema = z.object({
  properties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    cashOnCashReturn: z.number(),
    capRate: z.number(),
    annualCashFlow: z.number(),
    totalROI: z.number(),
    riskScore: z.number(),
    rank: z.number().int().positive(),
  })),
  bestForCashFlow: z.string(),
  bestForAppreciation: z.string(),
  lowestRisk: z.string(),
  bestOverall: z.string(),
  insights: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type InvestmentProperty = z.infer<typeof InvestmentPropertySchema>;
export type Financing = z.infer<typeof FinancingSchema>;
export type OperatingExpenses = z.infer<typeof OperatingExpensesSchema>;
export type Assumptions = z.infer<typeof AssumptionsSchema>;
export type CashFlowProjection = z.infer<typeof CashFlowProjectionSchema>;
export type ROIMetrics = z.infer<typeof ROIMetricsSchema>;
export type InvestmentAnalysis = z.infer<typeof InvestmentAnalysisSchema>;
export type ComparativeAnalysis = z.infer<typeof ComparativeAnalysisSchema>;

// ============================================================================
// Investment Analyzer
// ============================================================================

export class InvestmentAnalyzer {
  /**
   * Performs comprehensive investment analysis
   */
  public analyze(
    property: InvestmentProperty,
    financing: Financing,
    expenses: OperatingExpenses,
    assumptions: Assumptions
  ): InvestmentAnalysis {
    // Calculate total investment
    const downPayment = property.purchasePrice * (financing.downPaymentPercent / 100);
    const totalInvestment = downPayment + property.closingCosts + property.estimatedRenovationCost;

    // Calculate loan amount
    const loanAmount = property.purchasePrice - downPayment;

    // Calculate monthly mortgage payment
    const monthlyMortgagePayment = this.calculateMonthlyMortgagePayment(
      loanAmount,
      financing.interestRate,
      financing.loanTermYears
    );

    // Calculate monthly income and expenses
    const monthlyRent = property.estimatedMonthlyRent;
    const vacancyLoss = monthlyRent * (expenses.vacancyRate / 100);
    const effectiveMonthlyIncome = monthlyRent - vacancyLoss;

    const monthlyOperatingExpenses =
      expenses.monthlyPropertyTax +
      expenses.monthlyInsurance +
      expenses.monthlyHOAFees +
      expenses.monthlyUtilities +
      expenses.monthlyMaintenance +
      expenses.monthlyPropertyManagement +
      expenses.annualRepairsBudget / 12 +
      expenses.otherMonthlyExpenses;

    const monthlyNOI = effectiveMonthlyIncome - monthlyOperatingExpenses;
    const monthlyCashFlow = monthlyNOI - monthlyMortgagePayment;

    // Annual figures
    const annualIncome = effectiveMonthlyIncome * 12;
    const annualOperatingExpenses = monthlyOperatingExpenses * 12;
    const annualNOI = monthlyNOI * 12;
    const annualCashFlow = monthlyCashFlow * 12;

    // Calculate ROI metrics
    const cashOnCashReturn = (annualCashFlow / totalInvestment) * 100;
    const capRate = (annualNOI / property.purchasePrice) * 100;
    const grossRentMultiplier = property.purchasePrice / annualIncome;

    // Calculate break-even (months until cumulative cash flow becomes positive)
    const breakEvenMonths = totalInvestment / Math.max(monthlyCashFlow, 1);

    // Generate cash flow projections
    const cashFlowProjections = this.generateCashFlowProjections(
      property,
      financing,
      loanAmount,
      monthlyMortgagePayment,
      effectiveMonthlyIncome,
      monthlyOperatingExpenses,
      assumptions
    );

    // Calculate exit analysis
    const exitAnalysis = this.calculateExitAnalysis(
      property,
      financing,
      loanAmount,
      monthlyMortgagePayment,
      totalInvestment,
      assumptions
    );

    // Calculate total ROI
    const totalProfit = exitAnalysis.netProceeds - totalInvestment;
    const totalROI = (totalProfit / totalInvestment) * 100;
    const annualizedROI = ((Math.pow(1 + totalROI / 100, 1 / assumptions.holdingPeriodYears) - 1) * 100);

    // Calculate equity buildup
    const finalProjection = cashFlowProjections[cashFlowProjections.length - 1];
    const equityBuildup = finalProjection.equity - downPayment;

    const roiMetrics: ROIMetrics = {
      totalInvestment,
      annualCashFlow,
      cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
      totalROI: Math.round(totalROI * 100) / 100,
      annualizedROI: Math.round(annualizedROI * 100) / 100,
      equityBuildup,
      totalProfit,
      breakEvenMonths: Math.ceil(breakEvenMonths),
    };

    // Calculate risk score
    const riskScore = this.calculateRiskScore(
      property,
      roiMetrics,
      expenses,
      financing,
      assumptions
    );

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      property,
      roiMetrics,
      expenses,
      financing,
      assumptions
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(roiMetrics, riskScore);

    // Generate summary
    const summary = this.generateSummary(property, roiMetrics, exitAnalysis, riskScore);

    return {
      property,
      financing,
      expenses,
      assumptions,
      roiMetrics,
      cashFlowProjections,
      monthlyBreakdown: {
        income: effectiveMonthlyIncome,
        expenses: monthlyOperatingExpenses,
        mortgagePayment: monthlyMortgagePayment,
        netCashFlow: monthlyCashFlow,
      },
      exitAnalysis,
      riskScore,
      riskFactors,
      recommendation,
      summary,
    };
  }

  /**
   * Calculates monthly mortgage payment
   */
  private calculateMonthlyMortgagePayment(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number
  ): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    if (monthlyRate === 0) {
      return loanAmount / numberOfPayments;
    }

    const payment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return payment;
  }

  /**
   * Generates year-by-year cash flow projections
   */
  private generateCashFlowProjections(
    property: InvestmentProperty,
    financing: Financing,
    loanAmount: number,
    monthlyMortgagePayment: number,
    initialMonthlyIncome: number,
    initialMonthlyExpenses: number,
    assumptions: Assumptions
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    let cumulativeCashFlow = 0;
    let remainingBalance = loanAmount;
    let monthlyIncome = initialMonthlyIncome;
    let monthlyExpenses = initialMonthlyExpenses;
    let propertyValue = property.purchasePrice;

    const monthlyRate = financing.interestRate / 100 / 12;

    for (let year = 1; year <= assumptions.holdingPeriodYears; year++) {
      // Increase rent
      if (year > 1) {
        monthlyIncome *= 1 + assumptions.annualRentIncreaseRate / 100;
      }

      // Increase expenses
      if (year > 1) {
        monthlyExpenses *= 1 + assumptions.annualExpenseIncreaseRate / 100;
      }

      // Appreciate property value
      if (year > 1) {
        propertyValue *= 1 + assumptions.annualAppreciationRate / 100;
      }

      // Calculate annual figures
      const annualIncome = monthlyIncome * 12;
      const annualExpenses = monthlyExpenses * 12;
      const annualMortgagePayment = monthlyMortgagePayment * 12;
      const annualNOI = annualIncome - annualExpenses;
      const annualCashFlow = annualNOI - annualMortgagePayment;

      // Calculate principal paid this year
      let principalPaidThisYear = 0;

      for (let month = 1; month <= 12; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyMortgagePayment - interestPayment;
        principalPaidThisYear += principalPayment;
        remainingBalance -= principalPayment;
      }

      cumulativeCashFlow += annualCashFlow;

      const equity = propertyValue - remainingBalance;

      projections.push({
        year,
        rentalIncome: Math.round(annualIncome),
        operatingExpenses: Math.round(annualExpenses),
        mortgagePayment: Math.round(annualMortgagePayment),
        netOperatingIncome: Math.round(annualNOI),
        cashFlow: Math.round(annualCashFlow),
        cumulativeCashFlow: Math.round(cumulativeCashFlow),
        principalPaid: Math.round(principalPaidThisYear),
        remainingLoanBalance: Math.round(Math.max(0, remainingBalance)),
        propertyValue: Math.round(propertyValue),
        equity: Math.round(equity),
      });
    }

    return projections;
  }

  /**
   * Calculates exit/sale analysis
   */
  private calculateExitAnalysis(
    property: InvestmentProperty,
    financing: Financing,
    loanAmount: number,
    monthlyMortgagePayment: number,
    totalInvestment: number,
    assumptions: Assumptions
  ): InvestmentAnalysis['exitAnalysis'] {
    // Calculate property value at exit
    const projectedSalePrice =
      property.purchasePrice *
      Math.pow(1 + assumptions.annualAppreciationRate / 100, assumptions.holdingPeriodYears);

    // Calculate selling costs
    const sellingCosts = projectedSalePrice * (assumptions.sellingCostsPercent / 100);

    // Calculate remaining mortgage balance
    const monthlyRate = financing.interestRate / 100 / 12;
    const numberOfPayments = financing.loanTermYears * 12;
    const paymentsMade = assumptions.holdingPeriodYears * 12;

    let remainingBalance = loanAmount;

    for (let i = 0; i < paymentsMade; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyMortgagePayment - interestPayment;
      remainingBalance -= principalPayment;
    }

    remainingBalance = Math.max(0, remainingBalance);

    // Calculate capital gains
    const costBasis = property.purchasePrice + property.closingCosts + property.estimatedRenovationCost;
    const capitalGains = Math.max(0, projectedSalePrice - sellingCosts - costBasis);
    const capitalGainsTax = capitalGains * (assumptions.capitalGainsTaxRate / 100);

    // Calculate net proceeds
    const netProceeds = projectedSalePrice - sellingCosts - remainingBalance - capitalGainsTax;

    // Calculate returns
    const totalReturn = netProceeds - totalInvestment;
    const annualizedReturn =
      ((Math.pow(netProceeds / totalInvestment, 1 / assumptions.holdingPeriodYears) - 1) * 100);

    return {
      projectedSalePrice: Math.round(projectedSalePrice),
      sellingCosts: Math.round(sellingCosts),
      remainingMortgage: Math.round(remainingBalance),
      capitalGainsTax: Math.round(capitalGainsTax),
      netProceeds: Math.round(netProceeds),
      totalReturn: Math.round(totalReturn),
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    };
  }

  /**
   * Calculates risk score (0-100, lower is better)
   */
  private calculateRiskScore(
    property: InvestmentProperty,
    metrics: ROIMetrics,
    expenses: OperatingExpenses,
    financing: Financing,
    assumptions: Assumptions
  ): number {
    let riskScore = 50; // Start at neutral

    // Negative cash flow = high risk
    if (metrics.annualCashFlow < 0) {
      riskScore += 30;
    } else if (metrics.cashOnCashReturn < 5) {
      riskScore += 15;
    } else if (metrics.cashOnCashReturn < 8) {
      riskScore += 5;
    } else {
      riskScore -= 10; // Good cash flow reduces risk
    }

    // High leverage = higher risk
    if (financing.downPaymentPercent < 20) {
      riskScore += 15;
    } else if (financing.downPaymentPercent >= 30) {
      riskScore -= 5;
    }

    // High vacancy rate = higher risk
    if (expenses.vacancyRate > 10) {
      riskScore += 10;
    }

    // Property age risk
    const currentYear = new Date().getFullYear();
    if (property.yearBuilt && currentYear - property.yearBuilt > 50) {
      riskScore += 10;
    }

    // Cap rate considerations
    if (metrics.capRate < 4) {
      riskScore += 10; // Low cap rate = potential overvaluation
    } else if (metrics.capRate > 10) {
      riskScore += 5; // Very high cap rate might indicate market issues
    }

    // Aggressive appreciation assumptions
    if (assumptions.annualAppreciationRate > 6) {
      riskScore += 10;
    }

    return Math.max(0, Math.min(100, Math.round(riskScore)));
  }

  /**
   * Identifies specific risk factors
   */
  private identifyRiskFactors(
    property: InvestmentProperty,
    metrics: ROIMetrics,
    expenses: OperatingExpenses,
    financing: Financing,
    assumptions: Assumptions
  ): string[] {
    const risks: string[] = [];

    if (metrics.annualCashFlow < 0) {
      risks.push('Negative cash flow - property operates at a loss');
    }

    if (metrics.cashOnCashReturn < 5) {
      risks.push('Low cash-on-cash return below 5%');
    }

    if (financing.downPaymentPercent < 20) {
      risks.push('High leverage with less than 20% down payment');
    }

    if (expenses.vacancyRate > 10) {
      risks.push('High vacancy rate exceeding 10%');
    }

    if (metrics.capRate < 4) {
      risks.push('Low cap rate suggests potential overvaluation');
    }

    if (assumptions.annualAppreciationRate > 6) {
      risks.push('Aggressive appreciation assumptions above 6% annually');
    }

    const currentYear = new Date().getFullYear();
    if (property.yearBuilt && currentYear - property.yearBuilt > 50) {
      risks.push('Older property may require significant maintenance');
    }

    if (metrics.breakEvenMonths > 60) {
      risks.push('Long break-even period exceeds 5 years');
    }

    if (risks.length === 0) {
      risks.push('No major risk factors identified');
    }

    return risks;
  }

  /**
   * Generates investment recommendation
   */
  private generateRecommendation(
    metrics: ROIMetrics,
    riskScore: number
  ): InvestmentAnalysis['recommendation'] {
    // Strong Buy: Great returns with low risk
    if (
      metrics.cashOnCashReturn >= 10 &&
      metrics.capRate >= 7 &&
      metrics.annualCashFlow > 0 &&
      riskScore < 40
    ) {
      return 'strong_buy';
    }

    // Buy: Good returns with acceptable risk
    if (
      metrics.cashOnCashReturn >= 6 &&
      metrics.capRate >= 5 &&
      metrics.annualCashFlow > 0 &&
      riskScore < 60
    ) {
      return 'buy';
    }

    // Hold: Marginal returns or moderate risk
    if (
      metrics.cashOnCashReturn >= 4 &&
      metrics.annualCashFlow >= 0 &&
      riskScore < 70
    ) {
      return 'hold';
    }

    // Pass: Below-average returns
    if (metrics.cashOnCashReturn < 4 || riskScore >= 70) {
      return 'pass';
    }

    // Avoid: Negative cash flow or very high risk
    return 'avoid';
  }

  /**
   * Generates summary text
   */
  private generateSummary(
    property: InvestmentProperty,
    metrics: ROIMetrics,
    exitAnalysis: InvestmentAnalysis['exitAnalysis'],
    riskScore: number
  ): string {
    const lines: string[] = [];

    lines.push(
      `This ${property.propertyType.replace('_', ' ')} investment requires €${Math.round(metrics.totalInvestment).toLocaleString()} upfront.`
    );

    if (metrics.annualCashFlow > 0) {
      lines.push(
        `Expected annual cash flow: €${Math.round(metrics.annualCashFlow).toLocaleString()} (${metrics.cashOnCashReturn}% cash-on-cash return).`
      );
    } else {
      lines.push(
        `Warning: Expected negative annual cash flow of €${Math.round(Math.abs(metrics.annualCashFlow)).toLocaleString()}.`
      );
    }

    lines.push(
      `Cap rate: ${metrics.capRate}%. Break-even in ${metrics.breakEvenMonths} months.`
    );

    lines.push(
      `Projected sale after 10 years: €${Math.round(exitAnalysis.projectedSalePrice).toLocaleString()} with net proceeds of €${Math.round(exitAnalysis.netProceeds).toLocaleString()} (${exitAnalysis.annualizedReturn}% annualized return).`
    );

    const riskLevel =
      riskScore < 40 ? 'low' : riskScore < 60 ? 'moderate' : riskScore < 75 ? 'high' : 'very high';

    lines.push(`Risk assessment: ${riskLevel} (score: ${riskScore}/100).`);

    return lines.join(' ');
  }

  /**
   * Compares multiple investment properties
   */
  public compareInvestments(analyses: InvestmentAnalysis[]): ComparativeAnalysis {
    const properties = analyses.map((analysis, index) => ({
      propertyId: analysis.property.propertyId,
      address: `${analysis.property.location.city}, ${analysis.property.location.neighborhood}`,
      cashOnCashReturn: analysis.roiMetrics.cashOnCashReturn,
      capRate: analysis.roiMetrics.capRate,
      annualCashFlow: analysis.roiMetrics.annualCashFlow,
      totalROI: analysis.roiMetrics.totalROI,
      riskScore: analysis.riskScore,
      rank: 0, // Will be calculated
    }));

    // Calculate ranks (composite score)
    properties.forEach(prop => {
      const score =
        prop.cashOnCashReturn * 0.3 +
        prop.capRate * 0.2 +
        (prop.annualCashFlow / 10000) * 0.2 +
        prop.totalROI * 0.2 +
        (100 - prop.riskScore) * 0.1;

      prop.rank = score;
    });

    // Sort by rank
    properties.sort((a, b) => b.rank - a.rank);

    // Assign rank numbers
    properties.forEach((prop, index) => {
      prop.rank = index + 1;
    });

    // Find best in categories
    const bestForCashFlow = [...properties].sort((a, b) => b.annualCashFlow - a.annualCashFlow)[0];
    const bestForAppreciation = [...properties].sort((a, b) => b.totalROI - a.totalROI)[0];
    const lowestRisk = [...properties].sort((a, b) => a.riskScore - b.riskScore)[0];
    const bestOverall = properties[0];

    // Generate insights
    const insights: string[] = [];

    insights.push(
      `${bestOverall.address} ranks highest overall with ${bestOverall.cashOnCashReturn}% cash-on-cash return.`
    );

    insights.push(
      `${bestForCashFlow.address} generates the most cash flow at €${Math.round(bestForCashFlow.annualCashFlow).toLocaleString()}/year.`
    );

    insights.push(
      `${bestForAppreciation.address} has the highest total ROI potential at ${bestForAppreciation.totalROI}%.`
    );

    insights.push(
      `${lowestRisk.address} presents the lowest risk with a score of ${lowestRisk.riskScore}/100.`
    );

    return {
      properties,
      bestForCashFlow: bestForCashFlow.propertyId,
      bestForAppreciation: bestForAppreciation.propertyId,
      lowestRisk: lowestRisk.propertyId,
      bestOverall: bestOverall.propertyId,
      insights,
    };
  }

  /**
   * Performs sensitivity analysis
   */
  public sensitivityAnalysis(
    baseAnalysis: InvestmentAnalysis,
    variable: 'rent' | 'expenses' | 'appreciation' | 'interest_rate' | 'vacancy',
    changePercentages: number[]
  ): Array<{
    change: number;
    cashOnCashReturn: number;
    totalROI: number;
    annualCashFlow: number;
  }> {
    const results: Array<{
      change: number;
      cashOnCashReturn: number;
      totalROI: number;
      annualCashFlow: number;
    }> = [];

    for (const changePercent of changePercentages) {
      // Create modified inputs
      const modifiedProperty = { ...baseAnalysis.property };
      const modifiedFinancing = { ...baseAnalysis.financing };
      const modifiedExpenses = { ...baseAnalysis.expenses };
      const modifiedAssumptions = { ...baseAnalysis.assumptions };

      // Apply change based on variable
      switch (variable) {
        case 'rent':
          modifiedProperty.estimatedMonthlyRent *= 1 + changePercent / 100;
          break;
        case 'expenses':
          modifiedExpenses.monthlyMaintenance *= 1 + changePercent / 100;
          modifiedExpenses.monthlyPropertyTax *= 1 + changePercent / 100;
          modifiedExpenses.monthlyInsurance *= 1 + changePercent / 100;
          break;
        case 'appreciation':
          modifiedAssumptions.annualAppreciationRate += changePercent;
          break;
        case 'interest_rate':
          modifiedFinancing.interestRate += changePercent;
          break;
        case 'vacancy':
          modifiedExpenses.vacancyRate += changePercent;
          break;
      }

      // Re-analyze with modified inputs
      const newAnalysis = this.analyze(
        modifiedProperty,
        modifiedFinancing,
        modifiedExpenses,
        modifiedAssumptions
      );

      results.push({
        change: changePercent,
        cashOnCashReturn: newAnalysis.roiMetrics.cashOnCashReturn,
        totalROI: newAnalysis.roiMetrics.totalROI,
        annualCashFlow: newAnalysis.roiMetrics.annualCashFlow,
      });
    }

    return results;
  }
}
