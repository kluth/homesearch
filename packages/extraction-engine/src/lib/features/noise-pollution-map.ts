/**
 * Noise Pollution Map
 * Real-time noise level mapping with traffic, airport, and industrial sources.
 */

import { z } from 'zod';

export const NoisePollutionSchema = z.object({
  propertyId: z.string(),
  overallNoiseLevel: z.number().min(0).max(100).describe('Decibel level 0-100'),
  noiseRating: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
  sources: z.array(z.object({
    type: z.enum(['traffic', 'airport', 'railway', 'industrial', 'commercial', 'construction', 'nightlife']),
    distance: z.number().describe('Distance in meters'),
    impact: z.enum(['none', 'minimal', 'low', 'moderate', 'high', 'severe']),
    peakHours: z.array(z.string()),
    averageDecibels: z.number(),
  })),
  byTimeOfDay: z.object({
    morning: z.object({
      level: z.number(),
      rating: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
      primarySources: z.array(z.string()),
    }),
    afternoon: z.object({
      level: z.number(),
      rating: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
      primarySources: z.array(z.string()),
    }),
    evening: z.object({
      level: z.number(),
      rating: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
      primarySources: z.array(z.string()),
    }),
    night: z.object({
      level: z.number(),
      rating: z.enum(['very_quiet', 'quiet', 'moderate', 'noisy', 'very_noisy']),
      primarySources: z.array(z.string()),
    }),
  }),
  heatMap: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    decibels: z.number(),
    radius: z.number(),
  })),
  predictions: z.object({
    weekday: z.number(),
    weekend: z.number(),
    peakTrafficHours: z.array(z.string()),
  }),
  healthImpact: z.object({
    sleepDisruption: z.enum(['none', 'low', 'moderate', 'high']),
    stressLevel: z.enum(['none', 'low', 'moderate', 'high']),
    hearingRisk: z.enum(['none', 'low', 'moderate', 'high']),
    recommendations: z.array(z.string()),
  }),
  mitigationOptions: z.array(z.object({
    solution: z.string(),
    cost: z.number(),
    decibelReduction: z.number(),
    effectiveness: z.number(),
  })),
});

export type NoisePollution = z.infer<typeof NoisePollutionSchema>;

export class NoisePollutionMapper {
  public analyzeNoisePollution(
    propertyId: string,
    location: {
      lat: number;
      lng: number;
      address: string;
    }
  ): NoisePollution {
    // Analyze nearby noise sources
    const sources = this.identifyNoiseSources(location);

    // Calculate overall noise level
    const overallNoiseLevel = this.calculateOverallNoise(sources);
    const noiseRating = this.getRating(overallNoiseLevel);

    // Noise by time of day
    const byTimeOfDay = this.analyzeTimeOfDay(sources, overallNoiseLevel);

    // Generate heat map
    const heatMap = this.generateNoiseHeatMap(location, sources);

    // Predictions
    const predictions = {
      weekday: Math.round(overallNoiseLevel * 1.1),
      weekend: Math.round(overallNoiseLevel * 0.85),
      peakTrafficHours: ['7:00-9:00 AM', '5:00-7:00 PM'],
    };

    // Health impact
    const healthImpact = this.assessHealthImpact(overallNoiseLevel, byTimeOfDay.night.level);

    // Mitigation options
    const mitigationOptions = this.suggestMitigation(overallNoiseLevel, sources);

    return {
      propertyId,
      overallNoiseLevel,
      noiseRating,
      sources,
      byTimeOfDay,
      heatMap,
      predictions,
      healthImpact,
      mitigationOptions,
    };
  }

  private identifyNoiseSources(location: any): NoisePollution['sources'] {
    // Mock noise sources - would integrate with real APIs
    const sources: NoisePollution['sources'] = [];

    // Traffic
    const trafficDistance = Math.floor(Math.random() * 500) + 100;
    if (trafficDistance < 300) {
      sources.push({
        type: 'traffic',
        distance: trafficDistance,
        impact: trafficDistance < 100 ? 'high' : trafficDistance < 200 ? 'moderate' : 'low',
        peakHours: ['7:00-9:00 AM', '5:00-7:00 PM'],
        averageDecibels: Math.max(40, 75 - trafficDistance / 10),
      });
    }

    // Airport
    const airportDistance = Math.floor(Math.random() * 5000) + 2000;
    if (airportDistance < 8000) {
      sources.push({
        type: 'airport',
        distance: airportDistance,
        impact: airportDistance < 3000 ? 'severe' : airportDistance < 5000 ? 'high' : 'moderate',
        peakHours: ['6:00-10:00 AM', '4:00-9:00 PM'],
        averageDecibels: airportDistance < 3000 ? 80 : airportDistance < 5000 ? 65 : 55,
      });
    }

    // Railway
    const railDistance = Math.floor(Math.random() * 2000) + 500;
    if (railDistance < 1500) {
      sources.push({
        type: 'railway',
        distance: railDistance,
        impact: railDistance < 500 ? 'high' : railDistance < 1000 ? 'moderate' : 'low',
        peakHours: ['Throughout day'],
        averageDecibels: railDistance < 500 ? 75 : railDistance < 1000 ? 60 : 50,
      });
    }

    // Commercial/Nightlife
    const nightlifeDistance = Math.floor(Math.random() * 1000);
    if (nightlifeDistance < 500) {
      sources.push({
        type: 'nightlife',
        distance: nightlifeDistance,
        impact: nightlifeDistance < 200 ? 'high' : 'moderate',
        peakHours: ['9:00 PM-2:00 AM'],
        averageDecibels: nightlifeDistance < 200 ? 70 : 55,
      });
    }

    return sources.map(s => ({
      ...s,
      averageDecibels: Math.round(s.averageDecibels),
    }));
  }

  private calculateOverallNoise(sources: NoisePollution['sources']): number {
    if (sources.length === 0) return 35; // Baseline quiet level

    // Weight by impact
    const weightedSum = sources.reduce((sum, source) => {
      const impactWeights = {
        none: 0,
        minimal: 0.2,
        low: 0.4,
        moderate: 0.6,
        high: 0.8,
        severe: 1.0,
      };
      return sum + (source.averageDecibels * impactWeights[source.impact]);
    }, 0);

    return Math.round(Math.min(100, weightedSum / sources.length));
  }

  private getRating(level: number): NoisePollution['noiseRating'] {
    if (level < 40) return 'very_quiet';
    if (level < 55) return 'quiet';
    if (level < 70) return 'moderate';
    if (level < 85) return 'noisy';
    return 'very_noisy';
  }

  private analyzeTimeOfDay(
    sources: NoisePollution['sources'],
    baseLevel: number
  ): NoisePollution['byTimeOfDay'] {
    const morning = {
      level: Math.round(baseLevel * 1.1),
      rating: this.getRating(baseLevel * 1.1),
      primarySources: sources
        .filter(s => s.peakHours.some(h => h.includes('AM')))
        .map(s => s.type),
    };

    const afternoon = {
      level: Math.round(baseLevel * 1.05),
      rating: this.getRating(baseLevel * 1.05),
      primarySources: sources
        .filter(s => s.peakHours.some(h => h.includes('PM') || h.includes('Throughout')))
        .map(s => s.type),
    };

    const evening = {
      level: Math.round(baseLevel * 0.95),
      rating: this.getRating(baseLevel * 0.95),
      primarySources: sources
        .filter(s => s.peakHours.some(h => h.includes('PM')))
        .map(s => s.type),
    };

    const night = {
      level: Math.round(baseLevel * 0.7),
      rating: this.getRating(baseLevel * 0.7),
      primarySources: sources
        .filter(s => s.type === 'nightlife' || s.type === 'airport')
        .map(s => s.type),
    };

    return { morning, afternoon, evening, night };
  }

  private generateNoiseHeatMap(
    location: any,
    sources: NoisePollution['sources']
  ): NoisePollution['heatMap'] {
    const heatMap: NoisePollution['heatMap'] = [];

    sources.forEach(source => {
      // Generate heat map points around each source
      const angle = Math.random() * 2 * Math.PI;
      const distance = source.distance / 111320; // Convert meters to degrees

      heatMap.push({
        lat: location.lat + Math.cos(angle) * distance,
        lng: location.lng + Math.sin(angle) * distance,
        decibels: Math.round(source.averageDecibels),
        radius: source.distance / 2,
      });
    });

    return heatMap;
  }

  private assessHealthImpact(
    overallLevel: number,
    nightLevel: number
  ): NoisePollution['healthImpact'] {
    const sleepDisruption = nightLevel > 65 ? 'high' : nightLevel > 50 ? 'moderate' : nightLevel > 40 ? 'low' : 'none';
    const stressLevel = overallLevel > 75 ? 'high' : overallLevel > 60 ? 'moderate' : overallLevel > 50 ? 'low' : 'none';
    const hearingRisk = overallLevel > 85 ? 'high' : overallLevel > 75 ? 'moderate' : overallLevel > 65 ? 'low' : 'none';

    const recommendations: string[] = [];
    if (nightLevel > 50) {
      recommendations.push('Install soundproof windows for better sleep quality');
    }
    if (overallLevel > 70) {
      recommendations.push('Consider white noise machines or earplugs');
      recommendations.push('Add sound-absorbing materials to walls');
    }
    if (hearingRisk !== 'none') {
      recommendations.push('Consult with audiologist about hearing protection');
    }

    return {
      sleepDisruption,
      stressLevel,
      hearingRisk,
      recommendations,
    };
  }

  private suggestMitigation(
    noiseLevel: number,
    sources: NoisePollution['sources']
  ): NoisePollution['mitigationOptions'] {
    const options: NoisePollution['mitigationOptions'] = [];

    options.push({
      solution: 'Soundproof windows (double/triple pane)',
      cost: 8000,
      decibelReduction: 15,
      effectiveness: 85,
    });

    options.push({
      solution: 'Acoustic wall panels and insulation',
      cost: 5000,
      decibelReduction: 10,
      effectiveness: 70,
    });

    if (sources.some(s => s.type === 'traffic')) {
      options.push({
        solution: 'Sound barrier fence (6-8ft)',
        cost: 12000,
        decibelReduction: 12,
        effectiveness: 75,
      });
    }

    options.push({
      solution: 'Landscaping with dense evergreens',
      cost: 3000,
      decibelReduction: 5,
      effectiveness: 50,
    });

    options.push({
      solution: 'White noise system',
      cost: 500,
      decibelReduction: 0,
      effectiveness: 60,
    });

    return options;
  }
}
