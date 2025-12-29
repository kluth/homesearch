/**
 * Pet-Friendly Score 2.0
 * Comprehensive pet amenities, restrictions, and services analysis.
 */

import { z } from 'zod';

export const PetFriendlySchema = z.object({
  propertyId: z.string(),
  overallScore: z.number().min(0).max(100),
  rating: z.enum(['pet_paradise', 'very_pet_friendly', 'pet_friendly', 'limited', 'not_suitable']),
  restrictions: z.object({
    allowed: z.boolean(),
    types: z.array(z.enum(['dogs', 'cats', 'birds', 'small_animals', 'all'])),
    limits: z.object({
      number: z.number(),
      weight: z.number().optional(),
      breedRestrictions: z.array(z.string()),
    }),
    deposits: z.object({
      pet_deposit: z.number(),
      pet_rent: z.number(),
      refundable: z.boolean(),
    }),
  }),
  property: z.object({
    yard: z.object({
      hasYard: z.boolean(),
      fenced: z.boolean(),
      size: z.number().describe('Square meters'),
      type: z.enum(['private', 'shared', 'none']),
    }),
    flooring: z.object({
      petFriendly: z.boolean(),
      type: z.array(z.string()),
      cleanability: z.enum(['excellent', 'good', 'fair', 'difficult']),
    }),
    features: z.array(z.string()),
  }),
  nearby: z.object({
    veterinarians: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      emergency: z.boolean(),
      rating: z.number(),
    })),
    parks: z.array(z.object({
      name: z.string(),
      distance: z.number(),
      dogPark: z.boolean(),
      features: z.array(z.string()),
    })),
    services: z.object({
      groomers: z.number(),
      daycares: z.number(),
      boarding: z.number(),
      petStores: z.number(),
    }),
  }),
  walkability: z.object({
    score: z.number(),
    sidewalks: z.boolean(),
    trails: z.number(),
    traffic: z.enum(['low', 'moderate', 'high']),
  }),
});

export type PetFriendly = z.infer<typeof PetFriendlySchema>;

export class PetFriendlyAnalyzer {
  public analyzePetFriendliness(propertyId: string, hasYard: boolean, hoaRules: boolean): PetFriendly {
    const restrictions = this.analyzeRestrictions(hoaRules);
    const property = this.assessProperty(hasYard);
    const nearby = this.findNearbyAmenities();
    const walkability = { score: 78, sidewalks: true, trails: 3, traffic: 'low' as const };
    const overallScore = this.calculateScore(restrictions, property, nearby, walkability);
    const rating = this.getRating(overallScore);

    return { propertyId, overallScore, rating, restrictions, property, nearby, walkability };
  }

  private analyzeRestrictions(hasHOA: boolean): PetFriendly['restrictions'] {
    return {
      allowed: true,
      types: ['dogs', 'cats', 'small_animals'],
      limits: {
        number: hasHOA ? 2 : 5,
        weight: hasHOA ? 50 : undefined,
        breedRestrictions: hasHOA ? ['Pit Bull', 'Rottweiler', 'Doberman'] : [],
      },
      deposits: { pet_deposit: 300, pet_rent: 25, refundable: true },
    };
  }

  private assessProperty(hasYard: boolean): PetFriendly['property'] {
    return {
      yard: {
        hasYard,
        fenced: hasYard,
        size: hasYard ? 200 : 0,
        type: hasYard ? 'private' : 'none',
      },
      flooring: {
        petFriendly: true,
        type: ['Hardwood', 'Tile'],
        cleanability: 'excellent',
      },
      features: hasYard ? ['Fenced yard', 'Pet door', 'Outdoor water spigot'] : ['Pet-friendly flooring'],
    };
  }

  private findNearbyAmenities(): PetFriendly['nearby'] {
    return {
      veterinarians: [
        { name: 'Sunset Veterinary Clinic', distance: 1.2, emergency: false, rating: 4.7 },
        { name: '24/7 Emergency Animal Hospital', distance: 3.5, emergency: true, rating: 4.5 },
      ],
      parks: [
        { name: 'Dogwood Park', distance: 0.8, dogPark: true, features: ['Off-leash area', 'Water station', 'Agility equipment'] },
        { name: 'Riverside Trail', distance: 1.5, dogPark: false, features: ['3-mile trail', 'Pet-friendly'] },
      ],
      services: { groomers: 5, daycares: 2, boarding: 3, petStores: 4 },
    };
  }

  private calculateScore(restrictions: any, property: any, nearby: any, walk: any): number {
    let score = 50;
    if (restrictions.allowed) score += 20;
    if (property.yard.hasYard && property.yard.fenced) score += 20;
    if (nearby.parks.some((p: any) => p.dogPark)) score += 10;
    return Math.min(100, score);
  }

  private getRating(score: number): PetFriendly['rating'] {
    if (score >= 90) return 'pet_paradise';
    if (score >= 75) return 'very_pet_friendly';
    if (score >= 60) return 'pet_friendly';
    if (score >= 40) return 'limited';
    return 'not_suitable';
  }
}
