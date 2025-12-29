/**
 * Light Pollution Analyzer
 * Measure night sky quality and visibility for astronomy and natural darkness.
 */

import { z } from 'zod';

export const LightPollutionSchema = z.object({
  propertyId: z.string(),
  bortle: z.object({
    scale: z.number().min(1).max(9).describe('Bortle Dark Sky Scale'),
    class: z.string(),
    description: z.string(),
    visibility: z.object({
      milkyWay: z.boolean(),
      zodiacalLight: z.boolean(),
      airglow: z.boolean(),
      messierObjects: z.number().describe('Number of visible Messier objects'),
      limitingMagnitude: z.number().describe('Faintest visible star magnitude'),
    }),
  }),
  measurements: z.object({
    skyBrightness: z.number().describe('mag/arcsec²'),
    artificialSkyGlow: z.number().describe('Percentage of natural darkness'),
    zenithLuminance: z.number().describe('cd/m²'),
    rating: z.enum(['excellent', 'good', 'moderate', 'poor', 'very_poor']),
  }),
  sources: z.array(z.object({
    type: z.enum(['street_lights', 'commercial', 'residential', 'industrial', 'sports_facilities', 'billboards']),
    distance: z.number(),
    intensity: z.enum(['low', 'moderate', 'high', 'severe']),
    direction: z.string(),
  })),
  nearbyDarkSkyAreas: z.array(z.object({
    name: z.string(),
    distance: z.number(),
    bortleScale: z.number(),
    designation: z.string().optional(),
  })),
  timeAnalysis: z.object({
    bestViewingHours: z.array(z.string()),
    moonImpact: z.object({
      newMoon: z.number().describe('Bortle scale during new moon'),
      fullMoon: z.number().describe('Bortle scale during full moon'),
    }),
    seasonalVariation: z.array(z.object({
      season: z.string(),
      averageBortle: z.number(),
      quality: z.string(),
    })),
  }),
  healthAndWellness: z.object({
    sleepQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    circadianImpact: z.enum(['minimal', 'moderate', 'significant']),
    recommendations: z.array(z.string()),
  }),
  mitigation: z.array(z.object({
    solution: z.string(),
    cost: z.number(),
    effectiveness: z.number(),
    description: z.string(),
  })),
  propertyValue: z.object({
    darkSkyPremium: z.number().describe('Estimated value premium for low light pollution'),
    comparison: z.string(),
  }),
});

export type LightPollution = z.infer<typeof LightPollutionSchema>;

export class LightPollutionAnalyzer {
  public analyzeLightPollution(
    propertyId: string,
    location: {
      lat: number;
      lng: number;
      city: string;
      state: string;
    }
  ): LightPollution {
    // Calculate Bortle scale
    const bortle = this.calculateBortleScale(location);

    // Sky brightness measurements
    const measurements = this.measureSkyBrightness(bortle.scale);

    // Identify light sources
    const sources = this.identifyLightSources(location);

    // Find nearby dark sky areas
    const nearbyDarkSkyAreas = this.findDarkSkyAreas(location);

    // Time-based analysis
    const timeAnalysis = this.analyzeTimeFactors(bortle.scale);

    // Health and wellness impact
    const healthAndWellness = this.assessHealthImpact(measurements.rating);

    // Mitigation options
    const mitigation = this.suggestMitigation(sources, measurements.rating);

    // Property value impact
    const propertyValue = this.assessPropertyValue(bortle.scale);

    return {
      propertyId,
      bortle,
      measurements,
      sources,
      nearbyDarkSkyAreas,
      timeAnalysis,
      healthAndWellness,
      mitigation,
      propertyValue,
    };
  }

  private calculateBortleScale(location: any): LightPollution['bortle'] {
    // Mock calculation - would use light pollution maps and APIs
    const scale = Math.floor(Math.random() * 5) + 3; // 3-7 (most common)

    const bortleClasses: Record<number, { class: string; description: string; visibility: any }> = {
      1: {
        class: 'Excellent dark-sky site',
        description: 'Zodiacal light, gegenschein visible. Milky Way casts shadows.',
        visibility: { milkyWay: true, zodiacalLight: true, airglow: true, messierObjects: 110, limitingMagnitude: 7.6 },
      },
      2: {
        class: 'Typical truly dark site',
        description: 'Airglow weakly visible. Milky Way highly structured.',
        visibility: { milkyWay: true, zodiacalLight: true, airglow: true, messierObjects: 110, limitingMagnitude: 7.1 },
      },
      3: {
        class: 'Rural sky',
        description: 'Some light pollution evident. Milky Way still impressive.',
        visibility: { milkyWay: true, zodiacalLight: false, airglow: false, messierObjects: 100, limitingMagnitude: 6.6 },
      },
      4: {
        class: 'Rural/suburban transition',
        description: 'Light pollution domes visible. Milky Way above horizon.',
        visibility: { milkyWay: true, zodiacalLight: false, airglow: false, messierObjects: 80, limitingMagnitude: 6.1 },
      },
      5: {
        class: 'Suburban sky',
        description: 'Only hints of Milky Way. Light pollution obvious.',
        visibility: { milkyWay: false, zodiacalLight: false, airglow: false, messierObjects: 50, limitingMagnitude: 5.6 },
      },
      6: {
        class: 'Bright suburban sky',
        description: 'Milky Way invisible. Only brightest objects visible.',
        visibility: { milkyWay: false, zodiacalLight: false, airglow: false, messierObjects: 30, limitingMagnitude: 5.1 },
      },
      7: {
        class: 'Suburban/urban transition',
        description: 'Entire sky grayish. Strong light sources in all directions.',
        visibility: { milkyWay: false, zodiacalLight: false, airglow: false, messierObjects: 15, limitingMagnitude: 4.6 },
      },
      8: {
        class: 'City sky',
        description: 'Sky glows orange/white. Only brightest stars visible.',
        visibility: { milkyWay: false, zodiacalLight: false, airglow: false, messierObjects: 5, limitingMagnitude: 4.1 },
      },
      9: {
        class: 'Inner-city sky',
        description: 'Entire sky brightly lit. Only planets and Moon visible.',
        visibility: { milkyWay: false, zodiacalLight: false, airglow: false, messierObjects: 0, limitingMagnitude: 3.0 },
      },
    };

    return {
      scale,
      ...bortleClasses[scale],
    };
  }

  private measureSkyBrightness(bortleScale: number): LightPollution['measurements'] {
    // Typical values for each Bortle class
    const skyBrightnessValues: Record<number, number> = {
      1: 21.9, 2: 21.7, 3: 21.5, 4: 20.8, 5: 19.8, 6: 19.0, 7: 18.5, 8: 18.0, 9: 17.5,
    };

    const skyBrightness = skyBrightnessValues[bortleScale];
    const artificialSkyGlow = ((9 - bortleScale) / 8) * 100;
    const zenithLuminance = Math.pow(10, (21.58 - skyBrightness) / 2.5) * 0.001;

    let rating: LightPollution['measurements']['rating'];
    if (bortleScale <= 2) rating = 'excellent';
    else if (bortleScale <= 4) rating = 'good';
    else if (bortleScale <= 6) rating = 'moderate';
    else if (bortleScale <= 7) rating = 'poor';
    else rating = 'very_poor';

    return {
      skyBrightness: Math.round(skyBrightness * 10) / 10,
      artificialSkyGlow: Math.round(artificialSkyGlow),
      zenithLuminance: Math.round(zenithLuminance * 1000) / 1000,
      rating,
    };
  }

  private identifyLightSources(location: any): LightPollution['sources'] {
    const sources: LightPollution['sources'] = [];

    // Street lights
    sources.push({
      type: 'street_lights',
      distance: 50,
      intensity: 'moderate',
      direction: 'North',
    });

    // Commercial areas
    if (Math.random() > 0.3) {
      sources.push({
        type: 'commercial',
        distance: Math.floor(Math.random() * 2000) + 500,
        intensity: Math.random() > 0.5 ? 'high' : 'moderate',
        direction: 'East',
      });
    }

    // Sports facilities
    if (Math.random() > 0.7) {
      sources.push({
        type: 'sports_facilities',
        distance: Math.floor(Math.random() * 3000) + 1000,
        intensity: 'high',
        direction: 'West',
      });
    }

    return sources;
  }

  private findDarkSkyAreas(location: any): LightPollution['nearbyDarkSkyAreas'] {
    // Mock data - would use real dark sky preserve database
    return [
      {
        name: 'Cherry Springs State Park',
        distance: 85000,
        bortleScale: 2,
        designation: 'International Dark Sky Park - Gold Tier',
      },
      {
        name: 'Rural Observation Site',
        distance: 45000,
        bortleScale: 4,
      },
    ];
  }

  private analyzeTimeFactors(bortleScale: number): LightPollution['timeAnalysis'] {
    return {
      bestViewingHours: ['10:00 PM - 4:00 AM', 'After astronomical twilight'],
      moonImpact: {
        newMoon: bortleScale,
        fullMoon: Math.min(9, bortleScale + 2),
      },
      seasonalVariation: [
        { season: 'Spring', averageBortle: bortleScale, quality: 'Good - Milky Way core rises' },
        { season: 'Summer', averageBortle: bortleScale - 0.5, quality: 'Best - Dark skies, warm weather' },
        { season: 'Fall', averageBortle: bortleScale, quality: 'Good - Clear skies common' },
        { season: 'Winter', averageBortle: bortleScale + 0.5, quality: 'Fair - Snow reflection increases brightness' },
      ],
    };
  }

  private assessHealthImpact(rating: string): LightPollution['healthAndWellness'] {
    let sleepQuality: LightPollution['healthAndWellness']['sleepQuality'];
    let circadianImpact: LightPollution['healthAndWellness']['circadianImpact'];
    const recommendations: string[] = [];

    if (rating === 'excellent' || rating === 'good') {
      sleepQuality = 'excellent';
      circadianImpact = 'minimal';
      recommendations.push('Excellent natural darkness supports healthy sleep cycles');
    } else if (rating === 'moderate') {
      sleepQuality = 'good';
      circadianImpact = 'moderate';
      recommendations.push('Consider blackout curtains for bedrooms');
      recommendations.push('Minimize indoor light exposure before bed');
    } else {
      sleepQuality = 'fair';
      circadianImpact = 'significant';
      recommendations.push('Install blackout curtains in all bedrooms');
      recommendations.push('Use sleep masks if needed');
      recommendations.push('Advocate for community dark sky initiatives');
      recommendations.push('Consider blue light filtering for windows');
    }

    return {
      sleepQuality,
      circadianImpact,
      recommendations,
    };
  }

  private suggestMitigation(
    sources: LightPollution['sources'],
    rating: string
  ): LightPollution['mitigation'] {
    const options: LightPollution['mitigation'] = [];

    options.push({
      solution: 'Blackout curtains/blinds',
      cost: 800,
      effectiveness: 90,
      description: 'Block external light from entering bedrooms and living spaces',
    });

    options.push({
      solution: 'Landscape screening',
      cost: 3000,
      effectiveness: 40,
      description: 'Plant tall trees/shrubs to block direct light sources',
    });

    if (sources.some(s => s.type === 'street_lights' && s.distance < 100)) {
      options.push({
        solution: 'Motion-sensor shielded outdoor lighting',
        cost: 1500,
        effectiveness: 60,
        description: 'Replace always-on lights with downward-facing motion sensors',
      });
    }

    options.push({
      solution: 'Community advocacy',
      cost: 0,
      effectiveness: 70,
      description: 'Work with city to install shielded, warm-color LED street lights',
    });

    return options;
  }

  private assessPropertyValue(bortleScale: number): LightPollution['propertyValue'] {
    let premium = 0;
    let comparison = '';

    if (bortleScale <= 3) {
      premium = 5;
      comparison = 'Properties with excellent dark skies command a 3-7% premium in rural markets';
    } else if (bortleScale <= 5) {
      premium = 2;
      comparison = 'Low light pollution adds 1-3% value in suburban areas';
    } else {
      premium = 0;
      comparison = 'High light pollution typical for urban properties';
    }

    return {
      darkSkyPremium: premium,
      comparison,
    };
  }
}
