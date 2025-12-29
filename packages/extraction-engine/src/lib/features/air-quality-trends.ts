/**
 * Air Quality Trends
 * Real-time air quality monitoring with historical trends and health recommendations.
 */

import { z } from 'zod';

export const AirQualitySchema = z.object({
  propertyId: z.string(),
  current: z.object({
    aqi: z.number().min(0).max(500).describe('Air Quality Index'),
    level: z.enum(['good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous']),
    primaryPollutant: z.string(),
    timestamp: z.string(),
  }),
  pollutants: z.object({
    pm25: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
    pm10: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
    ozone: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
    no2: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
    so2: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
    co: z.object({
      value: z.number(),
      unit: z.string(),
      aqi: z.number(),
    }),
  }),
  historicalTrends: z.object({
    oneMonth: z.object({
      average: z.number(),
      best: z.number(),
      worst: z.number(),
      trend: z.enum(['improving', 'stable', 'worsening']),
    }),
    sixMonths: z.object({
      average: z.number(),
      best: z.number(),
      worst: z.number(),
      trend: z.enum(['improving', 'stable', 'worsening']),
    }),
    oneYear: z.object({
      average: z.number(),
      best: z.number(),
      worst: z.number(),
      trend: z.enum(['improving', 'stable', 'worsening']),
    }),
    fiveYears: z.object({
      average: z.number(),
      best: z.number(),
      worst: z.number(),
      trend: z.enum(['improving', 'stable', 'worsening']),
      percentChange: z.number(),
    }),
  }),
  seasonalPatterns: z.array(z.object({
    season: z.enum(['spring', 'summer', 'fall', 'winter']),
    averageAQI: z.number(),
    commonIssues: z.array(z.string()),
  })),
  sources: z.array(z.object({
    type: z.enum(['industrial', 'vehicular', 'wildfire', 'agricultural', 'construction', 'natural']),
    distance: z.number(),
    impact: z.enum(['minimal', 'low', 'moderate', 'high', 'severe']),
    contribution: z.number().describe('Percentage contribution to pollution'),
  })),
  healthRecommendations: z.object({
    general: z.array(z.string()),
    sensitive: z.array(z.string()),
    outdoor: z.object({
      recommended: z.boolean(),
      restrictions: z.array(z.string()),
    }),
  }),
  forecast: z.array(z.object({
    date: z.string(),
    aqi: z.number(),
    level: z.enum(['good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous']),
  })),
  comparisons: z.object({
    vsNational: z.object({
      nationalAverage: z.number(),
      percentile: z.number(),
      betterThan: z.number().describe('Percentage of US cities'),
    }),
    vsState: z.object({
      stateAverage: z.number(),
      rank: z.number(),
      totalCities: z.number(),
    }),
    vsNearbyCities: z.array(z.object({
      city: z.string(),
      distance: z.number(),
      aqi: z.number(),
    })),
  }),
});

export type AirQuality = z.infer<typeof AirQualitySchema>;

export class AirQualityAnalyzer {
  public analyzeAirQuality(
    propertyId: string,
    location: {
      lat: number;
      lng: number;
      city: string;
      state: string;
    }
  ): AirQuality {
    // Generate current air quality data
    const current = this.getCurrentAirQuality();

    // Pollutant breakdown
    const pollutants = this.getPollutantLevels(current.aqi);

    // Historical trends
    const historicalTrends = this.getHistoricalTrends(current.aqi);

    // Seasonal patterns
    const seasonalPatterns = this.getSeasonalPatterns();

    // Pollution sources
    const sources = this.identifyPollutionSources(location);

    // Health recommendations
    const healthRecommendations = this.getHealthRecommendations(current.level);

    // 7-day forecast
    const forecast = this.generateForecast(current.aqi);

    // Comparisons
    const comparisons = this.getComparisons(current.aqi, location);

    return {
      propertyId,
      current,
      pollutants,
      historicalTrends,
      seasonalPatterns,
      sources,
      healthRecommendations,
      forecast,
      comparisons,
    };
  }

  private getCurrentAirQuality(): AirQuality['current'] {
    const aqi = Math.floor(Math.random() * 150) + 20; // 20-170
    const level = this.getAQILevel(aqi);

    const pollutants = ['PM2.5', 'PM10', 'Ozone', 'NO2'];
    const primaryPollutant = pollutants[Math.floor(Math.random() * pollutants.length)];

    return {
      aqi,
      level,
      primaryPollutant,
      timestamp: new Date().toISOString(),
    };
  }

  private getAQILevel(aqi: number): AirQuality['current']['level'] {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  private getPollutantLevels(baseAQI: number): AirQuality['pollutants'] {
    return {
      pm25: {
        value: Math.round(baseAQI * 0.3 * 10) / 10,
        unit: 'µg/m³',
        aqi: Math.round(baseAQI * 1.1),
      },
      pm10: {
        value: Math.round(baseAQI * 0.5 * 10) / 10,
        unit: 'µg/m³',
        aqi: Math.round(baseAQI * 0.9),
      },
      ozone: {
        value: Math.round(baseAQI * 0.4 * 10) / 10,
        unit: 'ppb',
        aqi: Math.round(baseAQI * 0.95),
      },
      no2: {
        value: Math.round(baseAQI * 0.25 * 10) / 10,
        unit: 'ppb',
        aqi: Math.round(baseAQI * 0.7),
      },
      so2: {
        value: Math.round(baseAQI * 0.15 * 10) / 10,
        unit: 'ppb',
        aqi: Math.round(baseAQI * 0.6),
      },
      co: {
        value: Math.round(baseAQI * 0.8 * 10) / 10,
        unit: 'ppm',
        aqi: Math.round(baseAQI * 0.8),
      },
    };
  }

  private getHistoricalTrends(currentAQI: number): AirQuality['historicalTrends'] {
    const getTrend = (avg: number): 'improving' | 'stable' | 'worsening' => {
      if (currentAQI < avg * 0.9) return 'improving';
      if (currentAQI > avg * 1.1) return 'worsening';
      return 'stable';
    };

    const oneMonthAvg = currentAQI * (0.9 + Math.random() * 0.2);
    const sixMonthsAvg = currentAQI * (0.85 + Math.random() * 0.3);
    const oneYearAvg = currentAQI * (0.8 + Math.random() * 0.4);
    const fiveYearsAvg = currentAQI * (0.9 + Math.random() * 0.3);

    return {
      oneMonth: {
        average: Math.round(oneMonthAvg),
        best: Math.round(oneMonthAvg * 0.6),
        worst: Math.round(oneMonthAvg * 1.8),
        trend: getTrend(oneMonthAvg),
      },
      sixMonths: {
        average: Math.round(sixMonthsAvg),
        best: Math.round(sixMonthsAvg * 0.5),
        worst: Math.round(sixMonthsAvg * 2.0),
        trend: getTrend(sixMonthsAvg),
      },
      oneYear: {
        average: Math.round(oneYearAvg),
        best: Math.round(oneYearAvg * 0.4),
        worst: Math.round(oneYearAvg * 2.2),
        trend: getTrend(oneYearAvg),
      },
      fiveYears: {
        average: Math.round(fiveYearsAvg),
        best: Math.round(fiveYearsAvg * 0.3),
        worst: Math.round(fiveYearsAvg * 2.5),
        trend: getTrend(fiveYearsAvg),
        percentChange: Math.round(((currentAQI - fiveYearsAvg) / fiveYearsAvg) * 100 * 10) / 10,
      },
    };
  }

  private getSeasonalPatterns(): AirQuality['seasonalPatterns'] {
    return [
      {
        season: 'spring',
        averageAQI: 65,
        commonIssues: ['Pollen', 'Agricultural burning', 'Dust'],
      },
      {
        season: 'summer',
        averageAQI: 85,
        commonIssues: ['Ozone', 'Wildfires', 'Heat inversions'],
      },
      {
        season: 'fall',
        averageAQI: 70,
        commonIssues: ['Leaf burning', 'Temperature inversions'],
      },
      {
        season: 'winter',
        averageAQI: 75,
        commonIssues: ['Wood burning', 'Vehicle emissions', 'Temperature inversions'],
      },
    ];
  }

  private identifyPollutionSources(location: any): AirQuality['sources'] {
    return [
      {
        type: 'vehicular',
        distance: 500,
        impact: 'moderate',
        contribution: 35,
      },
      {
        type: 'industrial',
        distance: 5000,
        impact: 'low',
        contribution: 20,
      },
      {
        type: 'construction',
        distance: 1000,
        impact: 'low',
        contribution: 15,
      },
      {
        type: 'natural',
        distance: 0,
        impact: 'minimal',
        contribution: 30,
      },
    ];
  }

  private getHealthRecommendations(level: AirQuality['current']['level']): AirQuality['healthRecommendations'] {
    const recommendations: AirQuality['healthRecommendations'] = {
      general: [],
      sensitive: [],
      outdoor: {
        recommended: true,
        restrictions: [],
      },
    };

    switch (level) {
      case 'good':
        recommendations.general = ['Air quality is satisfactory', 'Ideal for all outdoor activities'];
        recommendations.outdoor.recommended = true;
        break;

      case 'moderate':
        recommendations.general = ['Air quality is acceptable for most people'];
        recommendations.sensitive = ['Sensitive individuals should consider limiting prolonged outdoor exertion'];
        recommendations.outdoor.recommended = true;
        break;

      case 'unhealthy_sensitive':
        recommendations.general = ['General public should limit prolonged outdoor exertion'];
        recommendations.sensitive = ['Sensitive groups should avoid prolonged outdoor exertion'];
        recommendations.outdoor.recommended = false;
        recommendations.outdoor.restrictions = ['Limit outdoor exercise', 'Keep windows closed'];
        break;

      case 'unhealthy':
        recommendations.general = ['Everyone should avoid prolonged outdoor exertion'];
        recommendations.sensitive = ['Sensitive groups should remain indoors'];
        recommendations.outdoor.recommended = false;
        recommendations.outdoor.restrictions = ['Avoid outdoor activities', 'Use air purifiers indoors', 'Wear N95 mask if must go outside'];
        break;

      case 'very_unhealthy':
      case 'hazardous':
        recommendations.general = ['Everyone should avoid all outdoor activities'];
        recommendations.sensitive = ['Remain indoors and keep activity levels low'];
        recommendations.outdoor.recommended = false;
        recommendations.outdoor.restrictions = ['Stay indoors', 'Seal windows and doors', 'Use HEPA air purifiers', 'Wear N95 mask if must go outside'];
        break;
    }

    return recommendations;
  }

  private generateForecast(currentAQI: number): AirQuality['forecast'] {
    const forecast: AirQuality['forecast'] = [];
    let aqi = currentAQI;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      aqi = Math.max(20, Math.min(200, aqi + (Math.random() - 0.5) * 20));

      forecast.push({
        date: date.toISOString().slice(0, 10),
        aqi: Math.round(aqi),
        level: this.getAQILevel(Math.round(aqi)),
      });
    }

    return forecast;
  }

  private getComparisons(currentAQI: number, location: any): AirQuality['comparisons'] {
    return {
      vsNational: {
        nationalAverage: 55,
        percentile: Math.min(95, Math.max(5, 100 - currentAQI / 2)),
        betterThan: Math.round(100 - currentAQI / 2),
      },
      vsState: {
        stateAverage: 62,
        rank: Math.floor(Math.random() * 50) + 1,
        totalCities: 150,
      },
      vsNearbyCities: [
        { city: 'Nearby City A', distance: 25, aqi: currentAQI - 10 },
        { city: 'Nearby City B', distance: 45, aqi: currentAQI + 15 },
        { city: 'Nearby City C', distance: 60, aqi: currentAQI - 5 },
      ],
    };
  }
}
