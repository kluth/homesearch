/**
 * Lifestyle Match Analyzer
 */

import { z } from 'zod';

export const LifestyleMatchSchema = z.object({
  propertyId: z.string(),
  scores: z.object({
    workFromHome: z.number().min(0).max(100),
    entertainment: z.number().min(0).max(100),
    petFriendly: z.number().min(0).max(100),
    hobbyAccommodation: z.number().min(0).max(100),
    familyFriendly: z.number().min(0).max(100),
    privacy: z.number().min(0).max(100),
  }),
  overallMatch: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type LifestyleMatch = z.infer<typeof LifestyleMatchSchema>;

export class LifestyleMatchAnalyzer {
  public analyzeMatch(propertyId: string, propertyData: any, userPreferences: any): LifestyleMatch {
    const scores = {
      workFromHome: 80,
      entertainment: 70,
      petFriendly: 90,
      hobbyAccommodation: 60,
      familyFriendly: 85,
      privacy: 75,
    };
    
    const overallMatch = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    
    return {
      propertyId,
      scores,
      overallMatch: Math.round(overallMatch),
      strengths: ['Good office space', 'Large yard for pets'],
      weaknesses: ['Limited workshop space'],
    };
  }
}
