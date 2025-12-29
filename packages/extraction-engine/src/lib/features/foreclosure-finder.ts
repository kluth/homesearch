/**
 * Foreclosure Finder
 * Track pre-foreclosure, auction, and bank-owned properties with deal analysis.
 */

import { z } from 'zod';

export const ForeclosureSchema = z.object({
  propertyId: z.string(),
  status: z.enum(['pre_foreclosure', 'auction', 'reo', 'short_sale']),
  timeline: z.object({
    defaultDate: z.string().optional(),
    noticeFiledDate: z.string().optional(),
    auctionDate: z.string().optional(),
    daysUntilAuction: z.number().optional(),
  }),
  financials: z.object({
    originalLoanAmount: z.number(),
    currentBalance: z.number(),
    estimatedValue: z.number(),
    openingBid: z.number().optional(),
    minimumBid: z.number().optional(),
    backTaxes: z.number(),
    liens: z.array(z.object({
      type: z.string(),
      amount: z.number(),
      priority: z.number(),
    })),
    totalDebt: z.number(),
  }),
  opportunity: z.object({
    estimatedEquity: z.number(),
    potentialDiscount: z.number(),
    discountPercent: z.number(),
    competitionLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
    dealQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  }),
  propertyInfo: z.object({
    condition: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']),
    occupied: z.boolean(),
    estimatedRepairs: z.number(),
    asIsValue: z.number(),
    afterRepairValue: z.number(),
  }),
  auction: z.object({
    location: z.string().optional(),
    type: z.enum(['courthouse', 'online', 'trustee_sale', 'not_applicable']),
    deposit: z.number().optional(),
    buyersPremium: z.number().optional(),
    termsAndConditions: z.array(z.string()),
  }),
  risks: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'moderate', 'high', 'critical']),
    description: z.string(),
    mitigation: z.string(),
  })),
  dueDiligence: z.object({
    titleSearch: z.boolean(),
    propertyInspection: z.boolean(),
    occupancyCheck: z.boolean(),
    lienSearch: z.boolean(),
    checklist: z.array(z.object({
      item: z.string(),
      completed: z.boolean(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
    })),
  }),
  financing: z.object({
    cashRequired: z.boolean(),
    hardMoneyOptions: z.array(z.object({
      lender: z.string(),
      maxLTV: z.number(),
      rate: z.number(),
      term: z.number(),
    })),
    traditionalFinancing: z.boolean(),
  }),
  exitStrategies: z.array(z.object({
    strategy: z.string(),
    timeline: z.string(),
    projectedProfit: z.number(),
    roi: z.number(),
  })),
});

export type Foreclosure = z.infer<typeof ForeclosureSchema>;

export class ForeclosureFinder {
  public analyzeForeclosure(
    propertyId: string,
    status: Foreclosure['status'],
    loanAmount: number,
    estimatedValue: number,
    auctionDate?: string
  ): Foreclosure {
    // Timeline
    const timeline = this.buildTimeline(status, auctionDate);

    // Financial analysis
    const financials = this.analyzeFinancials(loanAmount, estimatedValue);

    // Opportunity assessment
    const opportunity = this.assessOpportunity(financials, estimatedValue);

    // Property condition
    const propertyInfo = this.assessProperty(estimatedValue, opportunity.potentialDiscount);

    // Auction details
    const auction = this.getAuctionDetails(status, financials.openingBid);

    // Risk assessment
    const risks = this.identifyRisks(status, propertyInfo, financials);

    // Due diligence checklist
    const dueDiligence = this.createDueDiligenceChecklist(status);

    // Financing options
    const financing = this.analyzeFinancing(status, estimatedValue);

    // Exit strategies
    const exitStrategies = this.calculateExitStrategies(
      financials.openingBid || estimatedValue * 0.7,
      propertyInfo.afterRepairValue,
      propertyInfo.estimatedRepairs
    );

    return {
      propertyId,
      status,
      timeline,
      financials,
      opportunity,
      propertyInfo,
      auction,
      risks,
      dueDiligence,
      financing,
      exitStrategies,
    };
  }

  private buildTimeline(status: Foreclosure['status'], auctionDate?: string): Foreclosure['timeline'] {
    const timeline: Foreclosure['timeline'] = {
      defaultDate: undefined,
      noticeFiledDate: undefined,
      auctionDate,
      daysUntilAuction: undefined,
    };

    if (auctionDate) {
      const auction = new Date(auctionDate);
      const now = new Date();
      timeline.daysUntilAuction = Math.ceil((auction.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const noticeFiled = new Date(auction);
      noticeFiled.setDate(noticeFiled.getDate() - 90);
      timeline.noticeFiledDate = noticeFiled.toISOString().slice(0, 10);

      const defaultDate = new Date(noticeFiled);
      defaultDate.setDate(defaultDate.getDate() - 120);
      timeline.defaultDate = defaultDate.toISOString().slice(0, 10);
    }

    return timeline;
  }

  private analyzeFinancials(loanAmount: number, estimatedValue: number): Foreclosure['financials'] {
    const currentBalance = loanAmount * 1.08; // Include missed payments
    const backTaxes = estimatedValue * 0.015; // Assume 1.5% property tax

    const liens: Foreclosure['financials']['liens'] = [
      { type: 'First mortgage', amount: currentBalance, priority: 1 },
      { type: 'Property taxes', amount: backTaxes, priority: 0 },
    ];

    // Random chance of additional liens
    if (Math.random() > 0.7) {
      liens.push({ type: 'HOA fees', amount: 8500, priority: 2 });
    }

    if (Math.random() > 0.8) {
      liens.push({ type: 'Mechanic\'s lien', amount: 15000, priority: 3 });
    }

    const totalDebt = liens.reduce((sum, lien) => sum + lien.amount, 0);
    const openingBid = Math.round(currentBalance * 0.95);

    return {
      originalLoanAmount: loanAmount,
      currentBalance: Math.round(currentBalance),
      estimatedValue,
      openingBid,
      minimumBid: Math.round(openingBid * 0.95),
      backTaxes: Math.round(backTaxes),
      liens,
      totalDebt: Math.round(totalDebt),
    };
  }

  private assessOpportunity(financials: Foreclosure['financials'], marketValue: number): Foreclosure['opportunity'] {
    const estimatedEquity = marketValue - financials.totalDebt;
    const purchasePrice = financials.openingBid || marketValue * 0.7;
    const potentialDiscount = marketValue - purchasePrice;
    const discountPercent = (potentialDiscount / marketValue) * 100;

    let competitionLevel: Foreclosure['opportunity']['competitionLevel'];
    if (discountPercent > 30) competitionLevel = 'very_high';
    else if (discountPercent > 20) competitionLevel = 'high';
    else if (discountPercent > 10) competitionLevel = 'moderate';
    else competitionLevel = 'low';

    let dealQuality: Foreclosure['opportunity']['dealQuality'];
    if (discountPercent > 25 && estimatedEquity > 0) dealQuality = 'excellent';
    else if (discountPercent > 15) dealQuality = 'good';
    else if (discountPercent > 5) dealQuality = 'fair';
    else dealQuality = 'poor';

    return {
      estimatedEquity: Math.round(estimatedEquity),
      potentialDiscount: Math.round(potentialDiscount),
      discountPercent: Math.round(discountPercent * 10) / 10,
      competitionLevel,
      dealQuality,
    };
  }

  private assessProperty(value: number, discount: number): Foreclosure['propertyInfo'] {
    const condition: Foreclosure['propertyInfo']['condition'] =
      discount > 100000 ? 'poor' : discount > 50000 ? 'fair' : 'good';

    const estimatedRepairs = condition === 'poor' ? value * 0.20 :
                            condition === 'fair' ? value * 0.10 :
                            value * 0.05;

    return {
      condition,
      occupied: Math.random() > 0.4,
      estimatedRepairs: Math.round(estimatedRepairs),
      asIsValue: value,
      afterRepairValue: Math.round(value * 1.15),
    };
  }

  private getAuctionDetails(status: Foreclosure['status'], openingBid?: number): Foreclosure['auction'] {
    if (status === 'reo' || status === 'short_sale') {
      return {
        location: undefined,
        type: 'not_applicable',
        deposit: undefined,
        buyersPremium: undefined,
        termsAndConditions: ['Standard real estate transaction', 'Traditional financing available'],
      };
    }

    return {
      location: 'County Courthouse, 123 Main St',
      type: status === 'auction' ? 'courthouse' : 'trustee_sale',
      deposit: openingBid ? Math.round(openingBid * 0.10) : undefined,
      buyersPremium: 5,
      termsAndConditions: [
        'Cash or cashier\'s check required',
        'As-is, where-is condition',
        'No contingencies',
        'No property access before purchase',
        '10% deposit due immediately',
        'Balance due within 30 days',
      ],
    };
  }

  private identifyRisks(
    status: Foreclosure['status'],
    propertyInfo: Foreclosure['propertyInfo'],
    financials: Foreclosure['financials']
  ): Foreclosure['risks'] {
    const risks: Foreclosure['risks'] = [];

    if (propertyInfo.occupied) {
      risks.push({
        type: 'Occupancy',
        severity: 'high',
        description: 'Property currently occupied - eviction may be required',
        mitigation: 'Budget $5,000-$15,000 for legal eviction process',
      });
    }

    if (financials.liens.length > 2) {
      risks.push({
        type: 'Multiple liens',
        severity: 'moderate',
        description: `${financials.liens.length} liens on property`,
        mitigation: 'Conduct thorough title search to understand lien priority',
      });
    }

    if (propertyInfo.condition === 'poor') {
      risks.push({
        type: 'Property condition',
        severity: 'high',
        description: 'Significant repairs needed',
        mitigation: 'Get professional inspection if possible; budget 20-30% above estimates',
      });
    }

    risks.push({
      type: 'No inspection',
      severity: 'critical',
      description: 'Cannot inspect property before purchase at auction',
      mitigation: 'Drive by multiple times, research permits, talk to neighbors',
    });

    return risks;
  }

  private createDueDiligenceChecklist(status: Foreclosure['status']): Foreclosure['dueDiligence'] {
    return {
      titleSearch: false,
      propertyInspection: status === 'reo',
      occupancyCheck: false,
      lienSearch: false,
      checklist: [
        { item: 'Order title search/preliminary title report', completed: false, priority: 'critical' },
        { item: 'Search public records for all liens', completed: false, priority: 'critical' },
        { item: 'Drive by property multiple times', completed: false, priority: 'critical' },
        { item: 'Check occupancy status', completed: false, priority: 'high' },
        { item: 'Research property tax history', completed: false, priority: 'high' },
        { item: 'Check HOA status and fees', completed: false, priority: 'high' },
        { item: 'Review recent comparable sales', completed: false, priority: 'medium' },
        { item: 'Talk to neighbors about property condition', completed: false, priority: 'medium' },
        { item: 'Verify utilities status', completed: false, priority: 'medium' },
        { item: 'Check for code violations', completed: false, priority: 'low' },
      ],
    };
  }

  private analyzeFinancing(status: Foreclosure['status'], value: number): Foreclosure['financing'] {
    return {
      cashRequired: status === 'auction',
      hardMoneyOptions: [
        {
          lender: 'Fix & Flip Capital',
          maxLTV: 75,
          rate: 10.5,
          term: 12,
        },
        {
          lender: 'Bridge Lending Co',
          maxLTV: 70,
          rate: 9.5,
          term: 18,
        },
      ],
      traditionalFinancing: status === 'reo',
    };
  }

  private calculateExitStrategies(
    purchasePrice: number,
    arv: number,
    repairCosts: number
  ): Foreclosure['exitStrategies'] {
    const flipProfit = arv - purchasePrice - repairCosts - (arv * 0.10); // 10% selling costs
    const flipROI = (flipProfit / (purchasePrice + repairCosts)) * 100;

    const rentalIncome = arv * 0.006; // 0.6% monthly rent
    const annualRental = rentalIncome * 12;
    const rentROI = (annualRental / (purchasePrice + repairCosts * 0.5)) * 100;

    return [
      {
        strategy: 'Fix and Flip',
        timeline: '6-9 months',
        projectedProfit: Math.round(flipProfit),
        roi: Math.round(flipROI * 10) / 10,
      },
      {
        strategy: 'Buy and Hold Rental',
        timeline: 'Long-term',
        projectedProfit: Math.round(annualRental),
        roi: Math.round(rentROI * 10) / 10,
      },
      {
        strategy: 'Wholesale Assignment',
        timeline: '30-60 days',
        projectedProfit: Math.round(purchasePrice * 0.05),
        roi: Math.round(((purchasePrice * 0.05) / (purchasePrice * 0.01)) * 100),
      },
    ];
  }
}
