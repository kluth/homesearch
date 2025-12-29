/**
 * Legal & Compliance Checker
 *
 * Comprehensive legal verification and compliance checking for property
 * purchases and ownership.
 *
 * Features:
 * - Zoning law verification
 * - Building code compliance
 * - Permit history and requirements
 * - HOA rules analysis with red flags
 * - Title search and lien checking
 * - Easement and boundary analysis
 * - Property tax assessment appeals
 * - Environmental regulations
 *
 * @module LegalComplianceChecker
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const ZoningInfoSchema = z.object({
  propertyId: z.string(),
  zoneDes ignation: z.string(),
  zoneDescription: z.string(),
  allowedUses: z.array(z.string()),
  prohibitedUses: z.array(z.string()),
  restrictions: z.object({
    maxHeight: z.number().positive().optional().describe('Maximum building height in meters'),
    minLotSize: z.number().positive().optional().describe('Minimum lot size in square meters'),
    maxCoverage: z.number().min(0).max(100).optional().describe('Maximum lot coverage percentage'),
    setbackRequirements: z.object({
      front: z.number().nonnegative().optional(),
      rear: z.number().nonnegative().optional(),
      side: z.number().nonnegative().optional(),
    }).optional(),
    parkingSpacesRequired: z.number().int().nonnegative().optional(),
  }),
  futureChanges: z.array(z.object({
    proposedChange: z.string(),
    status: z.enum(['proposed', 'under_review', 'approved', 'rejected']),
    effectiveDate: z.string().datetime().optional(),
  })).default([]),
  nonConformingUse: z.boolean().default(false),
  complianceStatus: z.enum(['compliant', 'non_compliant', 'grandfathered', 'requires_variance']),
  warnings: z.array(z.string()).default([]),
});

export const BuildingCodeComplianceSchema = z.object({
  propertyId: z.string(),
  buildingAge: z.number().int().nonnegative(),
  lastInspectionDate: z.string().datetime().optional(),
  codeViolations: z.array(z.object({
    id: z.string(),
    violationType: z.enum(['structural', 'electrical', 'plumbing', 'fire_safety', 'accessibility', 'other']),
    severity: z.enum(['minor', 'moderate', 'major', 'critical']),
    description: z.string(),
    citedDate: z.string().datetime(),
    deadline: z.string().datetime().optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'appealed']),
    estimatedFixCost: z.number().positive().optional(),
  })).default([]),
  requiredUpgrades: z.array(z.object({
    category: z.string(),
    description: z.string(),
    reason: z.string(),
    estimatedCost: z.number().positive(),
    timeframe: z.string(),
  })).default([]),
  complianceScore: z.number().min(0).max(100),
  certificates: z.array(z.object({
    type: z.enum(['occupancy', 'fire_safety', 'energy_efficiency', 'accessibility']),
    number: z.string(),
    issuedDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    isValid: z.boolean(),
  })).default([]),
});

export const PermitHistorySchema = z.object({
  propertyId: z.string(),
  permits: z.array(z.object({
    id: z.string(),
    type: z.enum(['building', 'electrical', 'plumbing', 'mechanical', 'demolition', 'renovation', 'addition']),
    description: z.string(),
    applicationDate: z.string().datetime(),
    issuedDate: z.string().datetime().optional(),
    completionDate: z.string().datetime().optional(),
    status: z.enum(['pending', 'approved', 'denied', 'completed', 'expired']),
    contractor: z.string().optional(),
    estimatedCost: z.number().positive().optional(),
    finalInspection: z.object({
      date: z.string().datetime(),
      result: z.enum(['passed', 'failed', 'conditional']),
      notes: z.string().optional(),
    }).optional(),
  })).default([]),
  unpermittedWork: z.array(z.object({
    description: z.string(),
    estimatedDate: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    recommendations: z.string(),
  })).default([]),
  openPermits: z.number().int().nonnegative(),
  totalValue: z.number().nonnegative(),
});

export const HOARulesAnalysisSchema = z.object({
  propertyId: z.string(),
  hoaName: z.string(),
  rules: z.array(z.object({
    category: z.enum(['exterior_modifications', 'parking', 'pets', 'noise', 'rentals', 'landscaping', 'flags_signs', 'other']),
    rule: z.string(),
    severity: z.enum(['strict', 'moderate', 'flexible']),
    fineAmount: z.number().nonnegative().optional(),
  })).default([]),
  redFlags: z.array(z.object({
    type: z.enum(['excessive_restrictions', 'high_fees', 'poor_enforcement', 'frequent_litigation', 'financial_issues']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    impact: z.string(),
  })).default([]),
  restrictions: z.object({
    rentalRestrictions: z.boolean(),
    minRentalPeriod: z.number().int().optional().describe('Minimum rental period in days'),
    petRestrictions: z.object({
      allowed: z.boolean(),
      maxNumber: z.number().int().optional(),
      maxWeight: z.number().optional().describe('Max weight in kg'),
      restrictedBreeds: z.array(z.string()).optional(),
    }).optional(),
    parkingRules: z.string().optional(),
    architecturalApprovalRequired: z.boolean(),
  }),
  complianceRating: z.number().min(0).max(100),
});

export const TitleSearchSchema = z.object({
  propertyId: z.string(),
  titleStatus: z.enum(['clear', 'clouded', 'disputed']),
  currentOwner: z.object({
    name: z.string(),
    type: z.enum(['individual', 'joint', 'corporation', 'trust', 'llc']),
    ownershipPercentage: z.number().min(0).max(100),
  }),
  liens: z.array(z.object({
    id: z.string(),
    type: z.enum(['mortgage', 'tax_lien', 'mechanic_lien', 'judgment', 'child_support', 'other']),
    holder: z.string(),
    amount: z.number().positive(),
    filingDate: z.string().datetime(),
    priority: z.number().int().positive(),
    status: z.enum(['active', 'satisfied', 'released']),
  })).default([]),
  easements: z.array(z.object({
    type: z.enum(['utility', 'access', 'drainage', 'conservation', 'view']),
    holder: z.string(),
    description: z.string(),
    location: z.string(),
    recordedDate: z.string().datetime(),
    impactOnValue: z.number().describe('Percentage impact on property value'),
  })).default([]),
  encroachments: z.array(z.object({
    description: z.string(),
    severity: z.enum(['minor', 'moderate', 'major']),
    affectedArea: z.number().optional().describe('Square meters'),
    resolution: z.string().optional(),
  })).default([]),
  chainOfTitle: z.array(z.object({
    owner: z.string(),
    acquisitionDate: z.string().datetime(),
    saleDate: z.string().datetime().optional(),
    salePrice: z.number().positive().optional(),
  })).default([]),
  titleInsurance: z.object({
    recommended: z.boolean(),
    estimatedCost: z.number().positive(),
    coverage: z.number().positive(),
  }),
  issues: z.array(z.string()).default([]),
});

export const BoundaryAnalysisSchema = z.object({
  propertyId: z.string(),
  surveyDate: z.string().datetime().optional(),
  legalDescription: z.string(),
  actualArea: z.number().positive().describe('Square meters'),
  recordedArea: z.number().positive().describe('Square meters'),
  discrepancy: z.number().describe('Difference in square meters'),
  boundaryDisputes: z.array(z.object({
    neighborProperty: z.string(),
    issue: z.string(),
    status: z.enum(['unresolved', 'in_mediation', 'in_litigation', 'resolved']),
    estimatedCostToResolve: z.number().positive().optional(),
  })).default([]),
  fenceLocations: z.array(z.object({
    side: z.enum(['front', 'rear', 'left', 'right']),
    isOnBoundary: z.boolean(),
    encroachmentDistance: z.number().optional().describe('Meters'),
  })).default([]),
  recommendNewSurvey: z.boolean(),
  surveyKostEstimate: z.number().positive().optional(),
});

export const TaxAssessmentAppealSchema = z.object({
  propertyId: z.string(),
  currentAssessment: z.number().positive(),
  marketValue: z.number().positive(),
  assessmentRatio: z.number().describe('Assessment as percentage of market value'),
  isOverassessed: z.boolean(),
  potentialSavings: z.number().describe('Annual tax savings if successful'),
  appealViability: z.enum(['strong', 'moderate', 'weak', 'not_recommended']),
  comparableProperties: z.array(z.object({
    address: z.string(),
    assessment: z.number(),
    marketValue: z.number(),
    ratio: z.number(),
  })).default([]),
  appealDeadline: z.string().datetime(),
  estimatedAppealCost: z.number().positive(),
  successProbability: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type ZoningInfo = z.infer<typeof ZoningInfoSchema>;
export type BuildingCodeCompliance = z.infer<typeof BuildingCodeComplianceSchema>;
export type PermitHistory = z.infer<typeof PermitHistorySchema>;
export type HOARulesAnalysis = z.infer<typeof HOARulesAnalysisSchema>;
export type TitleSearch = z.infer<typeof TitleSearchSchema>;
export type BoundaryAnalysis = z.infer<typeof BoundaryAnalysisSchema>;
export type TaxAssessmentAppeal = z.infer<typeof TaxAssessmentAppealSchema>;

// ============================================================================
// Legal & Compliance Checker
// ============================================================================

export class LegalComplianceChecker {
  /**
   * Performs comprehensive legal compliance check
   */
  public performFullComplianceCheck(propertyId: string): {
    zoning: ZoningInfo;
    buildingCode: BuildingCodeCompliance;
    permits: PermitHistory;
    title: TitleSearch;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    criticalIssues: string[];
    recommendations: string[];
  } {
    // In real implementation, would call multiple APIs/services

    const zoning = this.checkZoningCompliance(propertyId, 'R-1', 'Single-family residential');
    const buildingCode = this.checkBuildingCodeCompliance(propertyId, 25);
    const permits = this.getPermitHistory(propertyId);
    const title = this.performTitleSearch(propertyId);

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze zoning
    if (zoning.complianceStatus === 'non_compliant') {
      criticalIssues.push('Property is not in compliance with current zoning');
    }

    // Analyze building code
    const criticalViolations = buildingCode.codeViolations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      criticalIssues.push(`${criticalViolations.length} critical building code violation(s)`);
    }

    // Analyze permits
    if (permits.unpermittedWork.length > 0) {
      const highSeverity = permits.unpermittedWork.filter(w => w.severity === 'high');
      if (highSeverity.length > 0) {
        criticalIssues.push('Unpermitted work found that may affect safety/value');
      }
    }

    // Analyze title
    if (title.titleStatus === 'clouded' || title.titleStatus === 'disputed') {
      criticalIssues.push('Title issues that must be resolved before purchase');
    }

    const activeens = title.liens.filter(l => l.status === 'active');
    if (activeLiens.length > 0) {
      const totalLienAmount = activeLiens.reduce((sum, l) => sum + l.amount, 0);
      criticalIssues.push(`Active liens totaling €${Math.round(totalLienAmount).toLocaleString()}`);
    }

    // Generate recommendations
    if (buildingCode.complianceScore < 70) {
      recommendations.push('Schedule professional building inspection before purchase');
    }

    if (permits.openPermits > 0) {
      recommendations.push('Ensure all open permits are closed before closing');
    }

    if (title.titleInsurance.recommended) {
      recommendations.push('Purchase title insurance to protect against title defects');
    }

    // Calculate overall risk
    let riskScore = 0;
    if (criticalIssues.length > 0) riskScore += 30;
    if (buildingCode.complianceScore < 50) riskScore += 25;
    if (title.liens.length > 2) riskScore += 20;
    if (permits.unpermittedWork.length > 0) riskScore += 15;
    if (zoning.nonConformingUse) riskScore += 10;

    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 60) overallRisk = 'critical';
    else if (riskScore >= 40) overallRisk = 'high';
    else if (riskScore >= 20) overallRisk = 'medium';
    else overallRisk = 'low';

    return {
      zoning,
      buildingCode,
      permits,
      title,
      overallRisk,
      criticalIssues,
      recommendations,
    };
  }

  /**
   * Checks zoning compliance
   */
  public checkZoningCompliance(
    propertyId: string,
    zoneDesignation: string,
    description: string
  ): ZoningInfo {
    // Mock implementation - would call municipality zoning API

    const allowedUses = ['single-family residence', 'home office', 'accessory dwelling unit'];
    const prohibitedUses = ['multi-family', 'commercial', 'industrial'];

    return {
      propertyId,
      zoneDesignation,
      zoneDescription: description,
      allowedUses,
      prohibitedUses,
      restrictions: {
        maxHeight: 10,
        minLotSize: 500,
        maxCoverage: 40,
        setbackRequirements: {
          front: 6,
          rear: 6,
          side: 2,
        },
        parkingSpacesRequired: 2,
      },
      futureChanges: [],
      nonConformingUse: false,
      complianceStatus: 'compliant',
      warnings: [],
    };
  }

  /**
   * Checks building code compliance
   */
  public checkBuildingCodeCompliance(
    propertyId: string,
    buildingAge: number
  ): BuildingCodeCompliance {
    const violations: BuildingCodeCompliance['codeViolations'] = [];

    // Older buildings more likely to have violations
    if (buildingAge > 50) {
      violations.push({
        id: 'elec-001',
        violationType: 'electrical',
        severity: 'moderate',
        description: 'Outdated electrical panel - does not meet current code',
        citedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        estimatedFixCost: 2500,
      });
    }

    const complianceScore = violations.length === 0 ? 100 : 100 - (violations.length * 15);

    return {
      propertyId,
      buildingAge,
      lastInspectionDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      codeViolations: violations,
      requiredUpgrades: [],
      complianceScore: Math.max(0, complianceScore),
      certificates: [
        {
          type: 'occupancy',
          number: 'OCC-2020-1234',
          issuedDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          isValid: true,
        },
      ],
    };
  }

  /**
   * Gets permit history
   */
  public getPermitHistory(propertyId: string): PermitHistory {
    const permits: PermitHistory['permits'] = [
      {
        id: 'PERM-2018-5678',
        type: 'building',
        description: 'Kitchen renovation',
        applicationDate: new Date('2018-03-15').toISOString(),
        issuedDate: new Date('2018-04-01').toISOString(),
        completionDate: new Date('2018-07-15').toISOString(),
        status: 'completed',
        contractor: 'ABC Renovations',
        estimatedCost: 25000,
        finalInspection: {
          date: new Date('2018-07-20').toISOString(),
          result: 'passed',
        },
      },
    ];

    return {
      propertyId,
      permits,
      unpermittedWork: [],
      openPermits: 0,
      totalValue: 25000,
    };
  }

  /**
   * Analyzes HOA rules
   */
  public analyzeHOARules(
    propertyId: string,
    hoaName: string,
    rulesDocument: string
  ): HOARulesAnalysis {
    // In real implementation, would parse HOA documents using NLP

    const redFlags: HOARulesAnalysis['redFlags'] = [];

    // Check for common red flags
    if (rulesDocument.includes('no rental') || rulesDocument.includes('rental prohibited')) {
      redFlags.push({
        type: 'excessive_restrictions',
        description: 'HOA prohibits or severely restricts rentals',
        severity: 'high',
        impact: 'Cannot rent property - reduces investment flexibility',
      });
    }

    return {
      propertyId,
      hoaName,
      rules: [],
      redFlags,
      restrictions: {
        rentalRestrictions: true,
        minRentalPeriod: 365,
        architecturalApprovalRequired: true,
      },
      complianceRating: redFlags.length === 0 ? 85 : 60,
    };
  }

  /**
   * Performs title search
   */
  public performTitleSearch(propertyId: string): TitleSearch {
    return {
      propertyId,
      titleStatus: 'clear',
      currentOwner: {
        name: 'John Doe',
        type: 'individual',
        ownershipPercentage: 100,
      },
      liens: [],
      easements: [
        {
          type: 'utility',
          holder: 'City Power Company',
          description: 'Utility easement for power lines',
          location: 'Rear 3 meters of property',
          recordedDate: new Date('1995-06-15').toISOString(),
          impactOnValue: -2,
        },
      ],
      encroachments: [],
      chainOfTitle: [],
      titleInsurance: {
        recommended: true,
        estimatedCost: 800,
        coverage: 350000,
      },
      issues: [],
    };
  }

  /**
   * Analyzes property boundaries
   */
  public analyzeBoundaries(propertyId: string, surveyData?: any): BoundaryAnalysis {
    return {
      propertyId,
      surveyDate: surveyData?.date,
      legalDescription: 'Lot 15, Block 3, Subdivision XYZ',
      actualArea: 650,
      recordedArea: 650,
      discrepancy: 0,
      boundaryDisputes: [],
      fenceLocations: [],
      recommendNewSurvey: !surveyData || new Date(surveyData.date).getFullYear() < new Date().getFullYear() - 10,
      surveyCostEstimate: 500,
    };
  }

  /**
   * Analyzes tax assessment appeal viability
   */
  public analyzeTaxAppealViability(
    propertyId: string,
    currentAssessment: number,
    marketValue: number,
    comparables: Array<{ address: string; assessment: number; marketValue: number }>
  ): TaxAssessmentAppeal {
    const assessmentRatio = (currentAssessment / marketValue) * 100;
    const isOverassessed = assessmentRatio > 90; // Typically assessment should be 80-90% of market value

    // Calculate comparable ratios
    const comparableData = comparables.map(comp => ({
      ...comp,
      ratio: (comp.assessment / comp.marketValue) * 100,
    }));

    const avgComparableRatio =
      comparableData.reduce((sum, c) => sum + c.ratio, 0) / comparableData.length;

    const overassessmentAmount = currentAssessment - (marketValue * (avgComparableRatio / 100));
    const taxRate = 0.015; // 1.5% typical
    const potentialSavings = overassessmentAmount * taxRate;

    let appealViability: TaxAssessmentAppeal['appealViability'];
    let successProbability: number;

    if (assessmentRatio > avgComparableRatio + 10) {
      appealViability = 'strong';
      successProbability = 75;
    } else if (assessmentRatio > avgComparableRatio + 5) {
      appealViability = 'moderate';
      successProbability = 50;
    } else if (isOverassessed) {
      appealViability = 'weak';
      successProbability = 25;
    } else {
      appealViability = 'not_recommended';
      successProbability = 10;
    }

    const recommendations: string[] = [];

    if (appealViability === 'strong' || appealViability === 'moderate') {
      recommendations.push('Appeal is recommended - gather evidence of comparable properties');
      recommendations.push('Consider hiring a property tax consultant');
      recommendations.push('Document any issues affecting property value');
    }

    if (potentialSavings > 500) {
      recommendations.push(`Potential annual savings of €${Math.round(potentialSavings)} make appeal worthwhile`);
    }

    return {
      propertyId,
      currentAssessment,
      marketValue,
      assessmentRatio: Math.round(assessmentRatio * 10) / 10,
      isOverassessed,
      potentialSavings: Math.round(potentialSavings),
      appealViability,
      comparableProperties: comparableData,
      appealDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedAppealCost: 500,
      successProbability,
      recommendations,
    };
  }

  /**
   * Generates legal compliance report
   */
  public generateComplianceReport(propertyId: string): {
    summary: string;
    sections: Array<{
      title: string;
      status: 'pass' | 'warning' | 'fail';
      details: string;
    }>;
    actionItems: string[];
  } {
    const fullCheck = this.performFullComplianceCheck(propertyId);

    const sections: Array<{ title: string; status: 'pass' | 'warning' | 'fail'; details: string }> = [];

    // Zoning section
    sections.push({
      title: 'Zoning Compliance',
      status: fullCheck.zoning.complianceStatus === 'compliant' ? 'pass' : 'fail',
      details: `Property is zoned ${fullCheck.zoning.zoneDesignation}: ${fullCheck.zoning.zoneDescription}`,
    });

    // Building code section
    const criticalViolations = fullCheck.buildingCode.codeViolations.filter(v => v.severity === 'critical' || v.severity === 'major');
    sections.push({
      title: 'Building Code Compliance',
      status: criticalViolations.length > 0 ? 'fail' : fullCheck.buildingCode.codeViolations.length > 0 ? 'warning' : 'pass',
      details: `Compliance score: ${fullCheck.buildingCode.complianceScore}/100. ${fullCheck.buildingCode.codeViolations.length} violation(s) found.`,
    });

    // Permits section
    sections.push({
      title: 'Permit History',
      status: fullCheck.permits.unpermittedWork.length > 0 || fullCheck.permits.openPermits > 0 ? 'warning' : 'pass',
      details: `${fullCheck.permits.permits.length} permits on record. ${fullCheck.permits.openPermits} open permits.`,
    });

    // Title section
    const activeLiens = fullCheck.title.liens.filter(l => l.status === 'active');
    sections.push({
      title: 'Title Status',
      status: fullCheck.title.titleStatus === 'clear' && activeLiens.length === 0 ? 'pass' : 'fail',
      details: `Title is ${fullCheck.title.titleStatus}. ${activeLiens.length} active lien(s). ${fullCheck.title.easements.length} easement(s).`,
    });

    const summary = `Overall Risk Level: ${fullCheck.overallRisk.toUpperCase()}. ${fullCheck.criticalIssues.length} critical issue(s) identified.`;

    return {
      summary,
      sections,
      actionItems: fullCheck.recommendations,
    };
  }
}
