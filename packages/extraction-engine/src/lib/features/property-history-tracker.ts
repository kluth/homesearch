/**
 * Property History & Disclosure Tracker
 */

import { z } from 'zod';

export const PropertyHistorySchema = z.object({
  propertyId: z.string(),
  ownershipHistory: z.array(z.object({
    owner: z.string(),
    purchaseDate: z.string().datetime(),
    saleDate: z.string().datetime().optional(),
    purchasePrice: z.number(),
    salePrice: z.number().optional(),
  })),
  renovations: z.array(z.object({
    date: z.string().datetime(),
    type: z.string(),
    cost: z.number(),
    permitted: z.boolean(),
  })),
  insuranceClaims: z.array(z.object({
    date: z.string().datetime(),
    type: z.string(),
    amount: z.number(),
  })),
  disclosures: z.array(z.object({
    category: z.string(),
    issue: z.string(),
    severity: z.enum(['minor', 'moderate', 'major']),
  })),
  redFlags: z.array(z.string()),
});

export type PropertyHistory = z.infer<typeof PropertyHistorySchema>;

export class PropertyHistoryTracker {
  public getHistory(propertyId: string): PropertyHistory {
    return {
      propertyId,
      ownershipHistory: [],
      renovations: [],
      insuranceClaims: [],
      disclosures: [],
      redFlags: [],
    };
  }
}
