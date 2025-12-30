/**
 * 1031 Exchange Advisor
 * Identify like-kind replacement properties and track deadlines for tax-deferred exchanges.
 */

import { z } from 'zod';

export const Exchange1031Schema = z.object({
  propertyId: z.string(),
  relinquishedProperty: z.object({
    address: z.string(),
    purchasePrice: z.number(),
    currentValue: z.number(),
    capitalGains: z.number(),
    taxLiability: z.number(),
    taxSavingsFrom1031: z.number(),
  }),
  deadlines: z.object({
    saleDate: z.string().optional(),
    identificationDeadline: z.string().optional(),
    exchangeDeadline: z.string().optional(),
    daysRemaining: z.object({
      toIdentify: z.number(),
      toClose: z.number(),
    }).optional(),
  }),
  replacementProperties: z.array(z.object({
    propertyId: z.string(),
    address: z.string(),
    price: z.number(),
    qualifies: z.boolean(),
    reason: z.string(),
    potentialCashFlow: z.number(),
    appreciation: z.number(),
    score: z.number(),
  })),
  exchangeRules: z.object({
    minimumValue: z.number(),
    minimumEquity: z.number(),
    identificationLimit: z.object({
      threePropertyRule: z.string(),
      twoHundredPercentRule: z.string(),
      ninetyFivePercentRule: z.string(),
    }),
  }),
  deferredTaxes: z.number(),
  bootTax: z.number().optional().describe('Tax on cash or debt relief received'),
  recommendation: z.enum(['proceed', 'caution', 'not_recommended']),
  warnings: z.array(z.string()),
});

export type Exchange1031 = z.infer<typeof Exchange1031Schema>;

export class Exchange1031Advisor {
  public analyze1031Exchange(
    propertyId: string,
    relinquishedProperty: {
      address: string;
      purchasePrice: number;
      currentValue: number;
      mortgage: number;
      holdingPeriod: number;
    },
    saleDate?: string
  ): Exchange1031 {
    // Calculate capital gains and tax liability
    const capitalGains = relinquishedProperty.currentValue - relinquishedProperty.purchasePrice;
    const federalTaxRate = capitalGains > 500000 ? 0.20 : 0.15;
    const stateTaxRate = 0.05;
    const netInvestmentTax = capitalGains > 250000 ? 0.038 : 0;
    const totalTaxRate = federalTaxRate + stateTaxRate + netInvestmentTax;
    const taxLiability = capitalGains * totalTaxRate;
    const deprecationRecapture = (relinquishedProperty.currentValue * 0.3) * 0.25;
    const totalTax = taxLiability + deprecationRecapture;

    // Calculate deadlines if sale date provided
    let deadlines: Exchange1031['deadlines'] = {
      saleDate,
      identificationDeadline: undefined,
      exchangeDeadline: undefined,
      daysRemaining: undefined,
    };

    if (saleDate) {
      const sale = new Date(saleDate);
      const identify = new Date(sale);
      identify.setDate(identify.getDate() + 45);
      const exchange = new Date(sale);
      exchange.setDate(exchange.getDate() + 180);

      const now = new Date();
      const daysToIdentify = Math.floor((identify.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysToClose = Math.floor((exchange.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      deadlines = {
        saleDate,
        identificationDeadline: identify.toISOString().slice(0, 10),
        exchangeDeadline: exchange.toISOString().slice(0, 10),
        daysRemaining: {
          toIdentify: Math.max(0, daysToIdentify),
          toClose: Math.max(0, daysToClose),
        },
      };
    }

    // Replacement property requirements
    const equity = relinquishedProperty.currentValue - relinquishedProperty.mortgage;
    const minimumValue = relinquishedProperty.currentValue;
    const minimumEquity = equity;

    const exchangeRules = {
      minimumValue,
      minimumEquity,
      identificationLimit: {
        threePropertyRule: 'Identify up to 3 properties of any value',
        twoHundredPercentRule: `Identify any number of properties totaling up to $${Math.round(minimumValue * 2).toLocaleString()}`,
        ninetyFivePercentRule: 'Identify unlimited properties if you acquire 95% of identified value',
      },
    };

    // Find qualifying replacement properties
    const replacementProperties = this.findReplacementProperties(
      minimumValue,
      relinquishedProperty.address
    );

    // Warnings
    const warnings: string[] = [];
    if (deadlines.daysRemaining && deadlines.daysRemaining.toIdentify < 30) {
      warnings.push('Identification deadline approaching - act quickly!');
    }
    if (relinquishedProperty.holdingPeriod < 1) {
      warnings.push('Property held less than 1 year - may not qualify as investment property');
    }
    if (capitalGains < 50000) {
      warnings.push('Low capital gains - 1031 exchange may not be cost-effective');
    }

    // Recommendation
    let recommendation: Exchange1031['recommendation'];
    if (capitalGains > 100000 && relinquishedProperty.holdingPeriod >= 1) {
      recommendation = 'proceed';
    } else if (capitalGains > 50000) {
      recommendation = 'caution';
    } else {
      recommendation = 'not_recommended';
    }

    return {
      propertyId,
      relinquishedProperty: {
        address: relinquishedProperty.address,
        purchasePrice: relinquishedProperty.purchasePrice,
        currentValue: relinquishedProperty.currentValue,
        capitalGains: Math.round(capitalGains),
        taxLiability: Math.round(totalTax),
        taxSavingsFrom1031: Math.round(totalTax),
      },
      deadlines,
      replacementProperties,
      exchangeRules,
      deferredTaxes: Math.round(totalTax),
      recommendation,
      warnings,
    };
  }

  private findReplacementProperties(
    minimumValue: number,
    currentAddress: string
  ): Exchange1031['replacementProperties'] {
    // Mock replacement properties - would integrate with property search
    const mockProperties = [
      {
        propertyId: 'prop-1',
        address: '123 Investment Ave',
        price: minimumValue * 1.1,
        qualifies: true,
        reason: 'Equal or greater value, like-kind property',
        potentialCashFlow: 2400,
        appreciation: 5.5,
        score: 92,
      },
      {
        propertyId: 'prop-2',
        address: '456 Rental Blvd',
        price: minimumValue * 0.95,
        qualifies: false,
        reason: 'Value below relinquished property - would trigger boot',
        potentialCashFlow: 2100,
        appreciation: 4.8,
        score: 78,
      },
      {
        propertyId: 'prop-3',
        address: '789 Commercial St',
        price: minimumValue * 1.25,
        qualifies: true,
        reason: 'Commercial property qualifies as like-kind',
        potentialCashFlow: 3200,
        appreciation: 6.2,
        score: 95,
      },
    ];

    return mockProperties.map(p => ({
      ...p,
      price: Math.round(p.price),
      potentialCashFlow: Math.round(p.potentialCashFlow),
      appreciation: Math.round(p.appreciation * 10) / 10,
    }));
  }

  public validateReplacement(
    relinquishedValue: number,
    relinquishedMortgage: number,
    replacementValue: number,
    replacementMortgage: number
  ): {
    qualifies: boolean;
    bootCash: number;
    bootDebt: number;
    bootTax: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let bootCash = 0;
    let bootDebt = 0;

    // Value requirement
    if (replacementValue < relinquishedValue) {
      bootCash = relinquishedValue - replacementValue;
      warnings.push(`Replacement property value is $${bootCash.toLocaleString()} less - will trigger boot`);
    }

    // Debt requirement
    if (replacementMortgage < relinquishedMortgage) {
      bootDebt = relinquishedMortgage - replacementMortgage;
      warnings.push(`Mortgage reduction of $${bootDebt.toLocaleString()} will trigger debt boot`);
    }

    const totalBoot = bootCash + bootDebt;
    const bootTax = totalBoot * 0.288; // Federal + state + NIIT

    const qualifies = replacementValue >= relinquishedValue &&
                     replacementMortgage >= relinquishedMortgage;

    if (qualifies) {
      warnings.push('Property qualifies for full tax deferral!');
    }

    return {
      qualifies,
      bootCash: Math.round(bootCash),
      bootDebt: Math.round(bootDebt),
      bootTax: Math.round(bootTax),
      warnings,
    };
  }
}
