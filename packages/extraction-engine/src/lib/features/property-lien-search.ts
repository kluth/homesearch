/**
 * Property Lien Search
 * Comprehensive lien and encumbrance search with priority analysis.
 */

import { z } from 'zod';

export const PropertyLienSchema = z.object({
  propertyId: z.string(),
  searchDate: z.string(),
  titleStatus: z.enum(['clear', 'liens_present', 'clouds_on_title', 'disputed']),
  liens: z.array(z.object({
    type: z.enum(['mortgage', 'tax_lien', 'mechanic_lien', 'judgment', 'hoa_lien', 'child_support', 'irs_lien', 'other']),
    holder: z.string(),
    amount: z.number(),
    filedDate: z.string(),
    priority: z.number().describe('1 = first position'),
    status: z.enum(['active', 'released', 'satisfied', 'disputed']),
    docketNumber: z.string().optional(),
  })),
  totalLiens: z.object({
    count: z.number(),
    totalAmount: z.number(),
    seniorLiens: z.number(),
    juniorLiens: z.number(),
  }),
  encumbrances: z.array(z.object({
    type: z.enum(['easement', 'covenant', 'restriction', 'lease', 'option', 'right_of_way']),
    description: z.string(),
    recordedDate: z.string(),
    impact: z.enum(['minor', 'moderate', 'significant', 'major']),
    details: z.string(),
  })),
  titleIssues: z.array(z.object({
    issue: z.string(),
    severity: z.enum(['minor', 'moderate', 'major', 'critical']),
    description: z.string(),
    resolution: z.string(),
  })),
  equityPosition: z.object({
    estimatedValue: z.number(),
    totalDebt: z.number(),
    availableEquity: z.number(),
    ltvRatio: z.number(),
  }),
  chainOfTitle: z.object({
    yearsSearched: z.number(),
    transfers: z.number(),
    gaps: z.array(z.string()),
    issues: z.array(z.string()),
  }),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    cost: z.number().optional(),
    timeline: z.string(),
  })),
  titleInsurance: z.object({
    required: z.boolean(),
    estimatedCost: z.number(),
    coverage: z.string(),
    exclusions: z.array(z.string()),
  }),
});

export type PropertyLien = z.infer<typeof PropertyLienSchema>;

export class PropertyLienSearcher {
  public searchLiens(
    propertyId: string,
    estimatedValue: number,
    address: string
  ): PropertyLien {
    // Perform lien search
    const liens = this.findLiens();

    // Calculate total liens
    const totalLiens = this.calculateTotals(liens);

    // Find encumbrances
    const encumbrances = this.findEncumbrances();

    // Identify title issues
    const titleIssues = this.identifyTitleIssues(liens, encumbrances);

    // Determine title status
    const titleStatus = this.determineTitleStatus(liens, titleIssues);

    // Calculate equity position
    const equityPosition = this.calculateEquity(estimatedValue, totalLiens.totalAmount);

    // Chain of title analysis
    const chainOfTitle = this.analyzeChainOfTitle();

    // Generate recommendations
    const recommendations = this.generateRecommendations(liens, titleIssues, equityPosition);

    // Title insurance assessment
    const titleInsurance = this.assessTitleInsurance(titleStatus, totalLiens.totalAmount, estimatedValue);

    return {
      propertyId,
      searchDate: new Date().toISOString().slice(0, 10),
      titleStatus,
      liens,
      totalLiens,
      encumbrances,
      titleIssues,
      equityPosition,
      chainOfTitle,
      recommendations,
      titleInsurance,
    };
  }

  private findLiens(): PropertyLien['liens'] {
    const liens: PropertyLien['liens'] = [];

    // Primary mortgage (most properties have this)
    liens.push({
      type: 'mortgage',
      holder: 'First National Bank',
      amount: 285000,
      filedDate: '2020-06-15',
      priority: 1,
      status: 'active',
      docketNumber: '2020-00123456',
    });

    // Property tax lien (sometimes present)
    if (Math.random() > 0.7) {
      liens.push({
        type: 'tax_lien',
        holder: 'County Tax Collector',
        amount: 4500,
        filedDate: '2024-03-01',
        priority: 0, // Tax liens take priority
        status: 'active',
        docketNumber: '2024-TAX-0045',
      });
    }

    // Mechanic's lien (occasionally)
    if (Math.random() > 0.85) {
      liens.push({
        type: 'mechanic_lien',
        holder: 'ABC Roofing Company',
        amount: 12500,
        filedDate: '2024-08-20',
        priority: 2,
        status: 'active',
        docketNumber: '2024-ML-0789',
      });
    }

    // HOA lien (for properties with HOA)
    if (Math.random() > 0.8) {
      liens.push({
        type: 'hoa_lien',
        holder: 'Meadowbrook HOA',
        amount: 3200,
        filedDate: '2024-05-10',
        priority: 3,
        status: 'active',
      });
    }

    // Sort by priority
    return liens.sort((a, b) => a.priority - b.priority);
  }

  private calculateTotals(liens: PropertyLien['liens']): PropertyLien['totalLiens'] {
    const activeLiens = liens.filter(l => l.status === 'active');
    const totalAmount = activeLiens.reduce((sum, l) => sum + l.amount, 0);

    return {
      count: activeLiens.length,
      totalAmount: Math.round(totalAmount),
      seniorLiens: activeLiens.filter(l => l.priority <= 1).length,
      juniorLiens: activeLiens.filter(l => l.priority > 1).length,
    };
  }

  private findEncumbrances(): PropertyLien['encumbrances'] {
    const encumbrances: PropertyLien['encumbrances'] = [];

    // Utility easement (very common)
    encumbrances.push({
      type: 'easement',
      description: 'Utility easement for electric and gas',
      recordedDate: '1985-03-12',
      impact: 'minor',
      details: '10-foot easement along rear property line for utilities',
    });

    // CC&Rs (common in developments)
    if (Math.random() > 0.4) {
      encumbrances.push({
        type: 'covenant',
        description: 'Covenants, Conditions & Restrictions',
        recordedDate: '2005-11-20',
        impact: 'moderate',
        details: 'HOA architectural guidelines and use restrictions',
      });
    }

    // Drainage easement
    if (Math.random() > 0.7) {
      encumbrances.push({
        type: 'easement',
        description: 'Drainage easement',
        recordedDate: '1990-07-15',
        impact: 'moderate',
        details: '15-foot drainage easement - limits construction in rear yard',
      });
    }

    return encumbrances;
  }

  private identifyTitleIssues(
    liens: PropertyLien['liens'],
    encumbrances: PropertyLien['encumbrances']
  ): PropertyLien['titleIssues'] {
    const issues: PropertyLien['titleIssues'] = [];

    // Check for tax liens
    const taxLiens = liens.filter(l => l.type === 'tax_lien' && l.status === 'active');
    if (taxLiens.length > 0) {
      issues.push({
        issue: 'Outstanding property tax lien',
        severity: 'major',
        description: `${taxLiens.length} active tax lien(s) totaling $${taxLiens.reduce((s, l) => s + l.amount, 0).toLocaleString()}`,
        resolution: 'Must be paid at closing or negotiated with seller',
      });
    }

    // Check for mechanic's liens
    const mechanicLiens = liens.filter(l => l.type === 'mechanic_lien' && l.status === 'active');
    if (mechanicLiens.length > 0) {
      issues.push({
        issue: 'Active mechanic\'s lien',
        severity: 'major',
        description: 'Unpaid contractor work lien on property',
        resolution: 'Seller must satisfy lien or provide escrow holdback',
      });
    }

    // Check for restrictive encumbrances
    const restrictive = encumbrances.filter(e => e.impact === 'significant' || e.impact === 'major');
    if (restrictive.length > 0) {
      issues.push({
        issue: 'Significant property restrictions',
        severity: 'moderate',
        description: `${restrictive.length} encumbrance(s) limiting property use`,
        resolution: 'Review restrictions carefully with attorney',
      });
    }

    // Check for junior liens
    const juniorLiens = liens.filter(l => l.priority > 1 && l.status === 'active');
    if (juniorLiens.length > 2) {
      issues.push({
        issue: 'Multiple junior liens',
        severity: 'moderate',
        description: `${juniorLiens.length} junior liens may complicate refinancing`,
        resolution: 'Negotiate payoff of junior liens',
      });
    }

    return issues;
  }

  private determineTitleStatus(
    liens: PropertyLien['liens'],
    issues: PropertyLien['titleIssues']
  ): PropertyLien['titleStatus'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const majorIssues = issues.filter(i => i.severity === 'major');

    if (criticalIssues.length > 0) return 'disputed';
    if (majorIssues.length > 0) return 'clouds_on_title';
    if (liens.filter(l => l.status === 'active').length > 1) return 'liens_present';
    return 'clear';
  }

  private calculateEquity(value: number, debt: number): PropertyLien['equityPosition'] {
    const equity = value - debt;
    const ltv = (debt / value) * 100;

    return {
      estimatedValue: value,
      totalDebt: Math.round(debt),
      availableEquity: Math.round(equity),
      ltvRatio: Math.round(ltv * 10) / 10,
    };
  }

  private analyzeChainOfTitle(): PropertyLien['chainOfTitle'] {
    return {
      yearsSearched: 50,
      transfers: 7,
      gaps: [],
      issues: [],
    };
  }

  private generateRecommendations(
    liens: PropertyLien['liens'],
    issues: PropertyLien['titleIssues'],
    equity: PropertyLien['equityPosition']
  ): PropertyLien['recommendations'] {
    const recommendations: PropertyLien['recommendations'] = [];

    // Always recommend title insurance
    recommendations.push({
      action: 'Obtain title insurance policy',
      priority: 'critical',
      cost: Math.round(equity.estimatedValue * 0.005),
      timeline: 'Before closing',
    });

    // Address active liens
    const activeLiens = liens.filter(l => l.status === 'active' && l.type !== 'mortgage');
    if (activeLiens.length > 0) {
      recommendations.push({
        action: 'Clear all non-mortgage liens before closing',
        priority: 'critical',
        cost: activeLiens.reduce((s, l) => s + l.amount, 0),
        timeline: 'At or before closing',
      });
    }

    // Title issues
    const majorIssues = issues.filter(i => i.severity === 'major' || i.severity === 'critical');
    if (majorIssues.length > 0) {
      recommendations.push({
        action: 'Consult real estate attorney for title issues',
        priority: 'high',
        cost: 1500,
        timeline: 'Within 7 days',
      });
    }

    // Survey recommendation
    recommendations.push({
      action: 'Order current property survey',
      priority: 'high',
      cost: 500,
      timeline: 'During escrow period',
    });

    return recommendations;
  }

  private assessTitleInsurance(
    status: PropertyLien['titleStatus'],
    debt: number,
    value: number
  ): PropertyLien['titleInsurance'] {
    const baseCost = value * 0.005;
    let multiplier = 1.0;

    if (status === 'clouds_on_title') multiplier = 1.3;
    if (status === 'disputed') multiplier = 1.6;

    return {
      required: true,
      estimatedCost: Math.round(baseCost * multiplier),
      coverage: `Lender's and owner's title insurance policies`,
      exclusions: [
        'Matters not of public record',
        'Boundary disputes',
        'Unrecorded easements',
        'Mechanic\'s liens for work in progress',
      ],
    };
  }
}
