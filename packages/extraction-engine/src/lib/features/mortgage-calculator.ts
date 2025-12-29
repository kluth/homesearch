/**
 * Mortgage Calculator & Affordability Analysis
 * Financial planning and budgeting tools for property purchase
 */

/**
 * Mortgage calculation parameters
 */
export interface MortgageParameters {
  propertyPrice: number;
  downPaymentPercent: number; // 0-100
  loanTerm: number; // years
  interestRate: number; // annual percentage
  monthlyIncome: number;
  monthlyDebts: number;
  propertyTaxRate?: number; // annual percentage of property value
  homeInsuranceAnnual?: number;
  hoaFees?: number; // monthly
}

/**
 * Mortgage calculation result
 */
export interface MortgageCalculation {
  loanAmount: number;
  downPayment: number;
  monthlyPayment: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  affordabilityScore: number; // 0-100
  debtToIncomeRatio: number; // percentage
  recommendations: string[];
  amortizationSchedule?: AmortizationEntry[];
}

/**
 * Amortization schedule entry
 */
export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestPaid: number;
}

/**
 * Affordability analysis
 */
export interface AffordabilityAnalysis {
  maxPurchasePrice: number;
  maxMonthlyPayment: number;
  recommendedBudget: {
    conservative: number; // 28% DTI
    moderate: number; // 36% DTI
    aggressive: number; // 43% DTI
  };
  requiredIncome: {
    forThisProperty: number;
    recommended: number;
  };
  savingsNeeded: {
    downPayment: number;
    closingCosts: number; // 2-5% of purchase price
    emergencyFund: number; // 6 months of payments
    total: number;
  };
  monthsToSave: number;
  affordability: 'easily_affordable' | 'affordable' | 'stretch' | 'out_of_reach';
  warnings: string[];
  suggestions: string[];
}

/**
 * Rent vs Buy analysis
 */
export interface RentVsBuyAnalysis {
  buyingCosts: {
    monthlyMortgage: number;
    propertyTax: number;
    insurance: number;
    maintenance: number; // 1% of property value annually
    hoa: number;
    totalMonthly: number;
  };
  rentingCosts: {
    monthlyRent: number;
    insurance: number;
    totalMonthly: number;
  };
  breakEvenMonths: number;
  breakEvenYears: number;
  fiveYearComparison: {
    totalBuyingCost: number;
    totalRentingCost: number;
    difference: number;
    homeEquity: number;
  };
  recommendation: 'buy' | 'rent' | 'neutral';
  analysis: string[];
}

/**
 * Mortgage Calculator
 */
export class MortgageCalculator {
  /**
   * Calculate mortgage details
   */
  public calculate(params: MortgageParameters): MortgageCalculation {
    // Validate parameters
    this.validateParameters(params);

    // Calculate down payment and loan amount
    const downPayment = (params.propertyPrice * params.downPaymentPercent) / 100;
    const loanAmount = params.propertyPrice - downPayment;

    // Calculate monthly interest rate
    const monthlyInterestRate = params.interestRate / 100 / 12;

    // Calculate number of payments
    const numberOfPayments = params.loanTerm * 12;

    // Calculate monthly principal and interest using standard mortgage formula
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPrincipalAndInterest =
      monthlyInterestRate === 0
        ? loanAmount / numberOfPayments
        : (loanAmount *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
          (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Calculate other monthly costs
    const monthlyPropertyTax =
      params.propertyTaxRate != null
        ? (params.propertyPrice * (params.propertyTaxRate / 100)) / 12
        : 0;

    const monthlyInsurance =
      params.homeInsuranceAnnual != null ? params.homeInsuranceAnnual / 12 : 0;

    const monthlyHOA = params.hoaFees ?? 0;

    // Total monthly payment
    const totalMonthlyPayment =
      monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyInsurance + monthlyHOA;

    // Calculate total interest paid
    const totalAmountPaid = monthlyPrincipalAndInterest * numberOfPayments;
    const totalInterestPaid = totalAmountPaid - loanAmount;

    // Calculate debt-to-income ratio
    const totalMonthlyDebt = totalMonthlyPayment + params.monthlyDebts;
    const debtToIncomeRatio = (totalMonthlyDebt / params.monthlyIncome) * 100;

    // Calculate affordability score (0-100)
    const affordabilityScore = this.calculateAffordabilityScore(
      params.monthlyIncome,
      totalMonthlyPayment,
      params.monthlyDebts
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      params,
      debtToIncomeRatio,
      affordabilityScore
    );

    // Generate amortization schedule
    const amortizationSchedule = this.generateAmortizationSchedule(
      loanAmount,
      monthlyInterestRate,
      numberOfPayments,
      monthlyPrincipalAndInterest
    );

    return {
      loanAmount,
      downPayment,
      monthlyPayment: monthlyPrincipalAndInterest,
      monthlyPrincipalAndInterest,
      monthlyPropertyTax,
      monthlyInsurance,
      monthlyHOA,
      totalMonthlyPayment,
      totalInterestPaid,
      totalAmountPaid: totalAmountPaid + downPayment,
      affordabilityScore,
      debtToIncomeRatio,
      recommendations,
      amortizationSchedule,
    };
  }

  /**
   * Analyze affordability
   */
  public analyzeAffordability(
    propertyPrice: number,
    monthlyIncome: number,
    monthlyDebts: number,
    monthlySavings: number,
    downPaymentPercent: number = 20,
    interestRate: number = 4.5
  ): AffordabilityAnalysis {
    // Calculate DTI ratios (standard mortgage lending guidelines)
    const conservativeDTI = 0.28; // 28% of gross income
    const moderateDTI = 0.36; // 36% of gross income
    const aggressiveDTI = 0.43; // 43% of gross income (FHA limit)

    // Calculate max monthly payments for each DTI ratio
    const conservativePayment = monthlyIncome * conservativeDTI - monthlyDebts;
    const moderatePayment = monthlyIncome * moderateDTI - monthlyDebts;
    const aggressivePayment = monthlyIncome * aggressiveDTI - monthlyDebts;

    // Calculate max purchase prices (reverse mortgage calculation)
    const conservativeBudget = this.calculateMaxPrice(
      conservativePayment,
      downPaymentPercent,
      30,
      interestRate
    );
    const moderateBudget = this.calculateMaxPrice(
      moderatePayment,
      downPaymentPercent,
      30,
      interestRate
    );
    const aggressiveBudget = this.calculateMaxPrice(
      aggressivePayment,
      downPaymentPercent,
      30,
      interestRate
    );

    // Calculate mortgage for this property
    const calculation = this.calculate({
      propertyPrice,
      downPaymentPercent,
      loanTerm: 30,
      interestRate,
      monthlyIncome,
      monthlyDebts,
    });

    // Required income
    const requiredIncome =
      (calculation.totalMonthlyPayment + monthlyDebts) / moderateDTI;

    const recommendedIncome =
      (calculation.totalMonthlyPayment + monthlyDebts) / conservativeDTI;

    // Savings needed
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const closingCosts = propertyPrice * 0.03; // Typical 2-5%, use 3%
    const emergencyFund = calculation.totalMonthlyPayment * 6; // 6 months reserve
    const totalSavingsNeeded = downPayment + closingCosts + emergencyFund;

    // Months to save
    const monthsToSave =
      monthlySavings > 0 ? Math.ceil(totalSavingsNeeded / monthlySavings) : Infinity;

    // Determine affordability level
    let affordability: AffordabilityAnalysis['affordability'];
    if (calculation.debtToIncomeRatio <= 28) {
      affordability = 'easily_affordable';
    } else if (calculation.debtToIncomeRatio <= 36) {
      affordability = 'affordable';
    } else if (calculation.debtToIncomeRatio <= 43) {
      affordability = 'stretch';
    } else {
      affordability = 'out_of_reach';
    }

    // Generate warnings
    const warnings: string[] = [];
    if (calculation.debtToIncomeRatio > 43) {
      warnings.push(
        '⚠️  DTI ratio exceeds 43% - Most lenders will not approve this loan'
      );
    } else if (calculation.debtToIncomeRatio > 36) {
      warnings.push(
        '⚠️  DTI ratio above 36% - You may face difficulty qualifying for a loan'
      );
    }

    if (downPaymentPercent < 20) {
      warnings.push(
        '⚠️  Down payment below 20% - You will likely need to pay PMI (Private Mortgage Insurance)'
      );
    }

    if (monthlyIncome < requiredIncome) {
      warnings.push(
        `⚠️  Income below recommended level - Need €${Math.round(requiredIncome - monthlyIncome)}/month more`
      );
    }

    // Generate suggestions
    const suggestions: string[] = [];

    if (propertyPrice > moderateBudget) {
      suggestions.push(
        `Consider properties around €${Math.round(moderateBudget)} for better affordability`
      );
    }

    if (downPaymentPercent < 20) {
      const additionalDownPayment = propertyPrice * 0.2 - downPayment;
      suggestions.push(
        `Save €${Math.round(additionalDownPayment)} more for 20% down payment to avoid PMI`
      );
    }

    if (monthsToSave < Infinity && monthsToSave > 12) {
      const increasedSavings = totalSavingsNeeded / 12;
      suggestions.push(
        `Increase monthly savings to €${Math.round(increasedSavings)} to be ready in 1 year`
      );
    }

    return {
      maxPurchasePrice: aggressiveBudget,
      maxMonthlyPayment: aggressivePayment,
      recommendedBudget: {
        conservative: conservativeBudget,
        moderate: moderateBudget,
        aggressive: aggressiveBudget,
      },
      requiredIncome: {
        forThisProperty: requiredIncome,
        recommended: recommendedIncome,
      },
      savingsNeeded: {
        downPayment,
        closingCosts,
        emergencyFund,
        total: totalSavingsNeeded,
      },
      monthsToSave,
      affordability,
      warnings,
      suggestions,
    };
  }

  /**
   * Rent vs Buy comparison
   */
  public compareRentVsBuy(
    propertyPrice: number,
    monthlyRent: number,
    downPaymentPercent: number,
    interestRate: number,
    appreciationRate: number = 3, // Annual property appreciation
    yearsToCompare: number = 5
  ): RentVsBuyAnalysis {
    // Calculate buying costs
    const mortgageCalc = this.calculate({
      propertyPrice,
      downPaymentPercent,
      loanTerm: 30,
      interestRate,
      monthlyIncome: 10000, // Placeholder
      monthlyDebts: 0,
      propertyTaxRate: 1.0,
      homeInsuranceAnnual: 1200,
      hoaFees: 0,
    });

    const monthlyMaintenance = (propertyPrice * 0.01) / 12; // 1% annually

    const buyingCosts = {
      monthlyMortgage: mortgageCalc.monthlyPrincipalAndInterest,
      propertyTax: mortgageCalc.monthlyPropertyTax,
      insurance: mortgageCalc.monthlyInsurance,
      maintenance: monthlyMaintenance,
      hoa: mortgageCalc.monthlyHOA,
      totalMonthly:
        mortgageCalc.monthlyPrincipalAndInterest +
        mortgageCalc.monthlyPropertyTax +
        mortgageCalc.monthlyInsurance +
        monthlyMaintenance,
    };

    // Calculate renting costs
    const rentingCosts = {
      monthlyRent,
      insurance: 25, // Renter's insurance
      totalMonthly: monthlyRent + 25,
    };

    // Calculate break-even point
    const monthlyCostDifference = buyingCosts.totalMonthly - rentingCosts.totalMonthly;
    const upfrontCosts = mortgageCalc.downPayment + propertyPrice * 0.03; // Down payment + closing costs

    const breakEvenMonths =
      monthlyCostDifference > 0
        ? Infinity
        : Math.abs(upfrontCosts / monthlyCostDifference);

    const breakEvenYears = breakEvenMonths / 12;

    // Five-year comparison
    const monthsToCompare = yearsToCompare * 12;

    // Total buying cost
    const totalMortgagePayments = buyingCosts.monthlyMortgage * monthsToCompare;
    const totalPropertyTax = buyingCosts.propertyTax * monthsToCompare;
    const totalInsurance = buyingCosts.insurance * monthsToCompare;
    const totalMaintenance = buyingCosts.maintenance * monthsToCompare;
    const totalBuyingCost =
      upfrontCosts + totalMortgagePayments + totalPropertyTax + totalInsurance + totalMaintenance;

    // Total renting cost
    const totalRentingCost = rentingCosts.totalMonthly * monthsToCompare;

    // Calculate home equity (appreciation + principal paid)
    const futureHomeValue =
      propertyPrice * Math.pow(1 + appreciationRate / 100, yearsToCompare);
    const principalPaid =
      mortgageCalc.loanAmount -
      (mortgageCalc.amortizationSchedule?.[monthsToCompare - 1]?.remainingBalance ??
        mortgageCalc.loanAmount);
    const homeEquity = futureHomeValue - (mortgageCalc.loanAmount - principalPaid);

    // Net comparison (accounting for equity)
    const netBuyingCost = totalBuyingCost - homeEquity;
    const difference = totalRentingCost - netBuyingCost;

    // Recommendation
    let recommendation: RentVsBuyAnalysis['recommendation'];
    if (difference > propertyPrice * 0.1) {
      recommendation = 'buy'; // Buying saves >10% of property price
    } else if (difference < -propertyPrice * 0.1) {
      recommendation = 'rent'; // Renting saves >10%
    } else {
      recommendation = 'neutral';
    }

    // Analysis points
    const analysis: string[] = [];

    if (breakEvenYears < Infinity && breakEvenYears < yearsToCompare) {
      analysis.push(
        `✅ Break-even point at ${breakEvenYears.toFixed(1)} years - Earlier than ${yearsToCompare} year timeline`
      );
    } else if (breakEvenYears > yearsToCompare) {
      analysis.push(
        `⚠️  Break-even point at ${breakEvenYears.toFixed(1)} years - Beyond ${yearsToCompare} year timeline`
      );
    }

    analysis.push(
      `After ${yearsToCompare} years, buying ${difference > 0 ? 'saves' : 'costs'} €${Math.abs(Math.round(difference))} vs renting`
    );

    analysis.push(
      `Home equity after ${yearsToCompare} years: €${Math.round(homeEquity)} (${((homeEquity / propertyPrice) * 100).toFixed(0)}% of purchase price)`
    );

    if (monthlyCostDifference > 0) {
      analysis.push(
        `Monthly cost ${Math.round(monthlyCostDifference)} higher for buying vs renting`
      );
    } else {
      analysis.push(
        `Monthly cost €${Math.round(Math.abs(monthlyCostDifference))} lower for buying vs renting`
      );
    }

    return {
      buyingCosts,
      rentingCosts,
      breakEvenMonths,
      breakEvenYears,
      fiveYearComparison: {
        totalBuyingCost,
        totalRentingCost,
        difference,
        homeEquity,
      },
      recommendation,
      analysis,
    };
  }

  /**
   * Calculate max affordable price
   */
  private calculateMaxPrice(
    maxMonthlyPayment: number,
    downPaymentPercent: number,
    loanTerm: number,
    interestRate: number
  ): number {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Reverse mortgage formula to get principal
    // P = M * [(1+r)^n - 1] / [r(1+r)^n]
    const maxLoanAmount =
      monthlyRate === 0
        ? maxMonthlyPayment * numberOfPayments
        : (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numberOfPayments) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));

    // Add down payment to get max price
    const maxPrice = maxLoanAmount / (1 - downPaymentPercent / 100);

    return Math.max(0, maxPrice);
  }

  /**
   * Calculate affordability score (0-100)
   */
  private calculateAffordabilityScore(
    monthlyIncome: number,
    totalMonthlyPayment: number,
    monthlyDebts: number
  ): number {
    const dti = ((totalMonthlyPayment + monthlyDebts) / monthlyIncome) * 100;

    // Perfect score at 0% DTI, 0 score at 50% DTI
    const score = Math.max(0, 100 - dti * 2);

    return Math.round(score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    params: MortgageParameters,
    debtToIncomeRatio: number,
    affordabilityScore: number
  ): string[] {
    const recommendations: string[] = [];

    // DTI recommendations
    if (debtToIncomeRatio > 43) {
      recommendations.push(
        '🔴 Critical: DTI ratio too high. Increase income, reduce debts, or choose a less expensive property'
      );
    } else if (debtToIncomeRatio > 36) {
      recommendations.push(
        '🟡 Caution: DTI ratio high. Consider increasing down payment to reduce monthly payments'
      );
    } else if (debtToIncomeRatio <= 28) {
      recommendations.push('🟢 Excellent: DTI ratio is very healthy');
    }

    // Down payment recommendations
    if (params.downPaymentPercent < 20) {
      const pmiEstimate = (params.propertyPrice * 0.01) / 12; // ~1% annually
      recommendations.push(
        `Consider saving for 20% down payment to avoid PMI (~€${Math.round(pmiEstimate)}/month)`
      );
    }

    // Interest rate recommendations
    if (params.interestRate > 5) {
      recommendations.push(
        'Shop around for better interest rates - even 0.5% can save thousands'
      );
    }

    // Loan term recommendations
    if (params.loanTerm === 30) {
      const calc15Year = this.calculate({ ...params, loanTerm: 15 });
      const savings = this.calculate(params).totalInterestPaid - calc15Year.totalInterestPaid;

      if (calc15Year.totalMonthlyPayment < params.monthlyIncome * 0.28) {
        recommendations.push(
          `Consider 15-year term - Save €${Math.round(savings)} in interest (€${Math.round(calc15Year.totalMonthlyPayment)}/month)`
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate amortization schedule
   */
  private generateAmortizationSchedule(
    loanAmount: number,
    monthlyRate: number,
    numberOfPayments: number,
    monthlyPayment: number
  ): AmortizationEntry[] {
    const schedule: AmortizationEntry[] = [];
    let remainingBalance = loanAmount;
    let totalInterestPaid = 0;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;

      remainingBalance -= principalPayment;
      totalInterestPaid += interestPayment;

      // Only store every 12th month to save memory
      if (month % 12 === 0 || month === 1 || month === numberOfPayments) {
        schedule.push({
          month,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          remainingBalance: Math.max(0, remainingBalance),
          totalInterestPaid,
        });
      }
    }

    return schedule;
  }

  /**
   * Validate parameters
   */
  private validateParameters(params: MortgageParameters): void {
    if (params.propertyPrice <= 0) {
      throw new Error('Property price must be positive');
    }

    if (params.downPaymentPercent < 0 || params.downPaymentPercent > 100) {
      throw new Error('Down payment percent must be between 0 and 100');
    }

    if (params.loanTerm <= 0) {
      throw new Error('Loan term must be positive');
    }

    if (params.interestRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }

    if (params.monthlyIncome <= 0) {
      throw new Error('Monthly income must be positive');
    }
  }
}
