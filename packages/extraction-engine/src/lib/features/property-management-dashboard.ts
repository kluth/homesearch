/**
 * Property Management Dashboard
 * Comprehensive landlord tools for managing rental properties.
 */

import { z } from 'zod';

export const PropertyManagementSchema = z.object({
  propertyId: z.string(),
  financials: z.object({
    monthlyIncome: z.number(),
    expenses: z.object({
      mortgage: z.number(),
      taxes: z.number(),
      insurance: z.number(),
      hoa: z.number(),
      maintenance: z.number(),
      utilities: z.number(),
      propertyManagement: z.number(),
      total: z.number(),
    }),
    netCashFlow: z.number(),
    annualROI: z.number(),
    capRate: z.number(),
  }),
  occupancy: z.object({
    currentTenant: z.object({
      name: z.string(),
      moveInDate: z.string(),
      leaseEndDate: z.string(),
      monthlyRent: z.number(),
      securityDeposit: z.number(),
      paymentHistory: z.enum(['excellent', 'good', 'fair', 'poor']),
    }).optional(),
    vacancy: z.object({
      isVacant: z.boolean(),
      daysSinceVacant: z.number().optional(),
      estimatedLossPerMonth: z.number().optional(),
    }),
  }),
  maintenance: z.object({
    scheduled: z.array(z.object({
      task: z.string(),
      dueDate: z.string(),
      cost: z.number(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    })),
    recentWork: z.array(z.object({
      date: z.string(),
      description: z.string(),
      cost: z.number(),
      vendor: z.string(),
    })),
    annualBudget: z.number(),
    spentYTD: z.number(),
  }),
  metrics: z.object({
    daysVacantLast12Months: z.number(),
    turnoverCost: z.number(),
    averageRepairCost: z.number(),
    tenantSatisfaction: z.number().min(0).max(100),
  }),
});

export type PropertyManagement = z.infer<typeof PropertyManagementSchema>;

export class PropertyManagementDashboard {
  public getManagementDashboard(propertyId: string, monthlyRent: number): PropertyManagement {
    const expenses = {
      mortgage: 1200,
      taxes: 350,
      insurance: 125,
      hoa: 250,
      maintenance: 150,
      utilities: 0,
      propertyManagement: monthlyRent * 0.10,
      total: 0,
    };
    expenses.total = Object.values(expenses).slice(0, -1).reduce((a, b) => a + b, 0);

    return {
      propertyId,
      financials: {
        monthlyIncome: monthlyRent,
        expenses,
        netCashFlow: monthlyRent - expenses.total,
        annualROI: 8.5,
        capRate: 6.2,
      },
      occupancy: {
        currentTenant: {
          name: 'John Smith',
          moveInDate: '2023-06-01',
          leaseEndDate: '2025-05-31',
          monthlyRent,
          securityDeposit: monthlyRent * 1.5,
          paymentHistory: 'excellent',
        },
        vacancy: {
          isVacant: false,
          daysSinceVacant: 0,
        },
      },
      maintenance: {
        scheduled: [
          { task: 'HVAC Filter replacement', dueDate: '2025-02-01', cost: 45, priority: 'medium' },
          { task: 'Annual HVAC service', dueDate: '2025-03-15', cost: 150, priority: 'high' },
        ],
        recentWork: [
          { date: '2024-12-10', description: 'Plumbing repair - bathroom faucet', cost: 185, vendor: 'ABC Plumbing' },
        ],
        annualBudget: 2400,
        spentYTD: 620,
      },
      metrics: {
        daysVacantLast12Months: 0,
        turnoverCost: 1200,
        averageRepairCost: 220,
        tenantSatisfaction: 92,
      },
    };
  }
}
