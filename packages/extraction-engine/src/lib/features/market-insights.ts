/**
 * Market Insights Dashboard
 *
 * Real-time market analysis and trends visualization for data-driven
 * property investment decisions.
 *
 * Features:
 * - Price trend analysis
 * - Market heat maps
 * - Supply and demand metrics
 * - Days on market statistics
 * - Price per square meter trends
 * - Inventory levels
 * - Absorption rates
 * - Market forecasts
 * - Comparative market analysis
 * - Seasonal trends
 *
 * @module MarketInsights
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const PricePointSchema = z.object({
  date: z.string().datetime(),
  averagePrice: z.number().nonnegative(),
  medianPrice: z.number().nonnegative(),
  lowestPrice: z.number().nonnegative(),
  highestPrice: z.number().nonnegative(),
  pricePerSqm: z.number().nonnegative(),
  sampleSize: z.number().int().nonnegative(),
});

export const MarketTrendSchema = z.object({
  location: z.string(),
  propertyType: z.enum(['all', 'house', 'apartment', 'condo', 'land']),
  timeframe: z.enum(['1_month', '3_months', '6_months', '1_year', '3_years', '5_years']),
  dataPoints: z.array(PricePointSchema),
  trendDirection: z.enum(['strongly_up', 'up', 'stable', 'down', 'strongly_down']),
  changePercentage: z.number(),
  changeAmount: z.number(),
  volatility: z.enum(['low', 'moderate', 'high']),
});

export const MarketHeatMapSchema = z.object({
  region: z.string(),
  areas: z.array(
    z.object({
      name: z.string(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      averagePrice: z.number().nonnegative(),
      priceChange30Days: z.number(),
      priceChange90Days: z.number(),
      priceChange1Year: z.number(),
      heatScore: z.number().min(0).max(100).describe('0=cold market, 100=hot market'),
      inventoryLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
      averageDaysOnMarket: z.number().int().nonnegative(),
    })
  ),
  generatedAt: z.string().datetime(),
});

export const SupplyDemandMetricsSchema = z.object({
  location: z.string(),
  totalActiveListings: z.number().int().nonnegative(),
  newListingsLastMonth: z.number().int().nonnegative(),
  soldListingsLastMonth: z.number().int().nonnegative(),
  pendingListings: z.number().int().nonnegative(),
  monthsOfSupply: z.number().nonnegative().describe('How many months to sell current inventory'),
  absorptionRate: z.number().nonnegative().describe('Percentage of inventory sold per month'),
  listToSaleRatio: z.number().nonnegative().describe('Ratio of list price to sale price'),
  marketCondition: z.enum(['strong_sellers', 'sellers', 'balanced', 'buyers', 'strong_buyers']),
  demandScore: z.number().min(0).max(100),
  competitionLevel: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']),
});

export const InventoryAnalysisSchema = z.object({
  location: z.string(),
  propertyType: z.enum(['all', 'house', 'apartment', 'condo', 'land']),
  priceRanges: z.array(
    z.object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
      count: z.number().int().nonnegative(),
      percentageOfTotal: z.number().min(0).max(100),
      averageDaysOnMarket: z.number().int().nonnegative(),
      medianPrice: z.number().nonnegative(),
    })
  ),
  totalInventory: z.number().int().nonnegative(),
  averageListPrice: z.number().nonnegative(),
  medianListPrice: z.number().nonnegative(),
  mostActivePrice RangeMin: z.number().nonnegative(),
  mostActivePriceRangeMax: z.number().nonnegative(),
});

export const DaysOnMarketAnalysisSchema = z.object({
  location: z.string(),
  averageDaysOnMarket: z.number().int().nonnegative(),
  medianDaysOnMarket: z.number().int().nonnegative(),
  byPriceRange: z.array(
    z.object({
      priceMin: z.number().nonnegative(),
      priceMax: z.number().nonnegative(),
      averageDays: z.number().int().nonnegative(),
      sampleSize: z.number().int().nonnegative(),
    })
  ),
  byPropertyType: z.record(z.number().int().nonnegative()),
  trend: z.enum(['decreasing', 'stable', 'increasing']),
});

export const MarketForecastSchema = z.object({
  location: z.string(),
  propertyType: z.enum(['all', 'house', 'apartment', 'condo', 'land']),
  forecastPeriod: z.enum(['3_months', '6_months', '1_year', '2_years', '5_years']),
  currentAveragePrice: z.number().nonnegative(),
  projections: z.array(
    z.object({
      date: z.string().datetime(),
      predictedPrice: z.number().nonnegative(),
      lowerBound: z.number().nonnegative(),
      upperBound: z.number().nonnegative(),
      confidenceLevel: z.number().min(0).max(100),
    })
  ),
  expectedChange: z.number().describe('Percentage change'),
  factors: z.array(
    z.object({
      name: z.string(),
      impact: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
      description: z.string(),
    })
  ),
  confidence: z.enum(['very_high', 'high', 'moderate', 'low']),
});

export const SeasonalTrendsSchema = z.object({
  location: z.string(),
  yearlyData: z.array(
    z.object({
      month: z.number().int().min(1).max(12),
      monthName: z.string(),
      averageListings: z.number().int().nonnegative(),
      averageSales: z.number().int().nonnegative(),
      averagePrice: z.number().nonnegative(),
      relativeTrend: z.enum(['peak', 'high', 'average', 'low', 'trough']),
    })
  ),
  bestMonthsToBuy: z.array(z.string()),
  bestMonthsToSell: z.array(z.string()),
  insights: z.array(z.string()),
});

export const ComparativeMarketAnalysisSchema = z.object({
  locations: z.array(z.string()).min(2),
  metrics: z.array(
    z.object({
      location: z.string(),
      averagePrice: z.number().nonnegative(),
      priceChange1Year: z.number(),
      daysOnMarket: z.number().int().nonnegative(),
      inventoryLevel: z.number().int().nonnegative(),
      demandScore: z.number().min(0).max(100),
      affordabilityIndex: z.number().min(0).max(100),
      investmentScore: z.number().min(0).max(100),
    })
  ),
  winner: z.string(),
  insights: z.array(z.string()),
});

export const MarketAlertSchema = z.object({
  id: z.string(),
  type: z.enum([
    'price_drop',
    'price_spike',
    'inventory_change',
    'hot_market',
    'buyers_market',
    'new_opportunity',
  ]),
  severity: z.enum(['info', 'warning', 'critical']),
  location: z.string(),
  message: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type PricePoint = z.infer<typeof PricePointSchema>;
export type MarketTrend = z.infer<typeof MarketTrendSchema>;
export type MarketHeatMap = z.infer<typeof MarketHeatMapSchema>;
export type SupplyDemandMetrics = z.infer<typeof SupplyDemandMetricsSchema>;
export type InventoryAnalysis = z.infer<typeof InventoryAnalysisSchema>;
export type DaysOnMarketAnalysis = z.infer<typeof DaysOnMarketAnalysisSchema>;
export type MarketForecast = z.infer<typeof MarketForecastSchema>;
export type SeasonalTrends = z.infer<typeof SeasonalTrendsSchema>;
export type ComparativeMarketAnalysis = z.infer<typeof ComparativeMarketAnalysisSchema>;
export type MarketAlert = z.infer<typeof MarketAlertSchema>;

// ============================================================================
// Market Insights Dashboard
// ============================================================================

export class MarketInsightsDashboard {
  /**
   * Analyzes price trends over time
   */
  public analyzePriceTrends(
    location: string,
    propertyType: MarketTrend['propertyType'],
    timeframe: MarketTrend['timeframe'],
    historicalData: PricePoint[]
  ): MarketTrend {
    if (historicalData.length === 0) {
      throw new Error('No historical data provided');
    }

    // Sort by date
    const sortedData = [...historicalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate price change
    const firstPrice = sortedData[0].averagePrice;
    const lastPrice = sortedData[sortedData.length - 1].averagePrice;
    const changeAmount = lastPrice - firstPrice;
    const changePercentage = (changeAmount / firstPrice) * 100;

    // Determine trend direction
    let trendDirection: MarketTrend['trendDirection'];
    if (changePercentage > 10) {
      trendDirection = 'strongly_up';
    } else if (changePercentage > 3) {
      trendDirection = 'up';
    } else if (changePercentage > -3) {
      trendDirection = 'stable';
    } else if (changePercentage > -10) {
      trendDirection = 'down';
    } else {
      trendDirection = 'strongly_down';
    }

    // Calculate volatility
    const prices = sortedData.map((p) => p.averagePrice);
    const volatility = this.calculateVolatility(prices);

    return {
      location,
      propertyType,
      timeframe,
      dataPoints: sortedData,
      trendDirection,
      changePercentage: Math.round(changePercentage * 100) / 100,
      changeAmount: Math.round(changeAmount),
      volatility,
    };
  }

  /**
   * Generates market heat map
   */
  public generateHeatMap(
    region: string,
    areasData: Array<{
      name: string;
      location: { latitude: number; longitude: number };
      currentPrice: number;
      priceHistory30Days: number[];
      priceHistory90Days: number[];
      priceHistory1Year: number[];
      inventoryCount: number;
      soldLastMonth: number;
      averageDaysOnMarket: number;
    }>
  ): MarketHeatMap {
    const areas = areasData.map((area) => {
      // Calculate price changes
      const priceChange30Days = this.calculatePriceChange(area.priceHistory30Days);
      const priceChange90Days = this.calculatePriceChange(area.priceHistory90Days);
      const priceChange1Year = this.calculatePriceChange(area.priceHistory1Year);

      // Calculate heat score (0-100)
      let heatScore = 50; // Base score

      // Price appreciation factor
      if (priceChange30Days > 5) heatScore += 20;
      else if (priceChange30Days > 2) heatScore += 10;
      else if (priceChange30Days < -2) heatScore -= 10;

      // Days on market factor (lower = hotter)
      if (area.averageDaysOnMarket < 15) heatScore += 15;
      else if (area.averageDaysOnMarket < 30) heatScore += 5;
      else if (area.averageDaysOnMarket > 60) heatScore -= 15;

      // Inventory vs sales factor
      const absorptionRate = area.inventoryCount > 0 ? (area.soldLastMonth / area.inventoryCount) * 100 : 0;
      if (absorptionRate > 20) heatScore += 15;
      else if (absorptionRate > 10) heatScore += 5;
      else if (absorptionRate < 5) heatScore -= 10;

      heatScore = Math.max(0, Math.min(100, heatScore));

      // Determine inventory level
      let inventoryLevel: MarketHeatMap['areas'][number]['inventoryLevel'];
      if (area.inventoryCount < 10) inventoryLevel = 'very_low';
      else if (area.inventoryCount < 30) inventoryLevel = 'low';
      else if (area.inventoryCount < 60) inventoryLevel = 'moderate';
      else if (area.inventoryCount < 100) inventoryLevel = 'high';
      else inventoryLevel = 'very_high';

      return {
        name: area.name,
        location: area.location,
        averagePrice: area.currentPrice,
        priceChange30Days,
        priceChange90Days,
        priceChange1Year,
        heatScore: Math.round(heatScore),
        inventoryLevel,
        averageDaysOnMarket: area.averageDaysOnMarket,
      };
    });

    return {
      region,
      areas,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates supply and demand metrics
   */
  public calculateSupplyDemand(
    location: string,
    data: {
      activeListings: number;
      newListings30Days: number;
      soldListings30Days: number;
      pendingListings: number;
      averageListPrice: number;
      averageSoldPrice: number;
    }
  ): SupplyDemandMetrics {
    // Months of supply: how many months to sell all inventory at current pace
    const monthsOfSupply =
      data.soldListings30Days > 0 ? data.activeListings / data.soldListings30Days : 999;

    // Absorption rate: percentage of inventory sold per month
    const absorptionRate =
      data.activeListings > 0 ? (data.soldListings30Days / data.activeListings) * 100 : 0;

    // List-to-sale ratio
    const listToSaleRatio =
      data.averageSoldPrice > 0 ? data.averageListPrice / data.averageSoldPrice : 1;

    // Determine market condition
    let marketCondition: SupplyDemandMetrics['marketCondition'];
    if (monthsOfSupply < 3) {
      marketCondition = 'strong_sellers';
    } else if (monthsOfSupply < 5) {
      marketCondition = 'sellers';
    } else if (monthsOfSupply < 7) {
      marketCondition = 'balanced';
    } else if (monthsOfSupply < 9) {
      marketCondition = 'buyers';
    } else {
      marketCondition = 'strong_buyers';
    }

    // Demand score (0-100)
    let demandScore = 50;
    if (monthsOfSupply < 3) demandScore += 30;
    else if (monthsOfSupply < 5) demandScore += 15;
    else if (monthsOfSupply > 9) demandScore -= 30;
    else if (monthsOfSupply > 7) demandScore -= 15;

    if (absorptionRate > 20) demandScore += 20;
    else if (absorptionRate > 10) demandScore += 10;
    else if (absorptionRate < 5) demandScore -= 20;

    demandScore = Math.max(0, Math.min(100, demandScore));

    // Competition level
    let competitionLevel: SupplyDemandMetrics['competitionLevel'];
    if (monthsOfSupply < 2) competitionLevel = 'very_high';
    else if (monthsOfSupply < 4) competitionLevel = 'high';
    else if (monthsOfSupply < 6) competitionLevel = 'moderate';
    else if (monthsOfSupply < 8) competitionLevel = 'low';
    else competitionLevel = 'very_low';

    return {
      location,
      totalActiveListings: data.activeListings,
      newListingsLastMonth: data.newListings30Days,
      soldListingsLastMonth: data.soldListings30Days,
      pendingListings: data.pendingListings,
      monthsOfSupply: Math.round(monthsOfSupply * 10) / 10,
      absorptionRate: Math.round(absorptionRate * 10) / 10,
      listToSaleRatio: Math.round(listToSaleRatio * 100) / 100,
      marketCondition,
      demandScore: Math.round(demandScore),
      competitionLevel,
    };
  }

  /**
   * Generates market forecast
   */
  public generateForecast(
    location: string,
    propertyType: MarketForecast['propertyType'],
    forecastPeriod: MarketForecast['forecastPeriod'],
    historicalPrices: number[],
    factors: MarketForecast['factors']
  ): MarketForecast {
    const currentPrice = historicalPrices[historicalPrices.length - 1];

    // Simple linear regression for prediction
    const trend = this.calculateTrendRate(historicalPrices);

    // Number of months to forecast
    const monthsMap = {
      '3_months': 3,
      '6_months': 6,
      '1_year': 12,
      '2_years': 24,
      '5_years': 60,
    };
    const months = monthsMap[forecastPeriod];

    // Generate projections
    const projections: MarketForecast['projections'] = [];
    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + i);

      // Apply trend with some randomness
      const predictedPrice = currentPrice * Math.pow(1 + trend / 100, i);

      // Confidence interval (±10% for near term, ±30% for long term)
      const confidenceRange = i <= 6 ? 0.1 : i <= 12 ? 0.15 : 0.3;
      const lowerBound = predictedPrice * (1 - confidenceRange);
      const upperBound = predictedPrice * (1 + confidenceRange);

      // Confidence decreases over time
      const confidenceLevel = Math.max(50, 95 - i * 2);

      projections.push({
        date: futureDate.toISOString(),
        predictedPrice: Math.round(predictedPrice),
        lowerBound: Math.round(lowerBound),
        upperBound: Math.round(upperBound),
        confidenceLevel: Math.round(confidenceLevel),
      });
    }

    const finalPrice = projections[projections.length - 1].predictedPrice;
    const expectedChange = ((finalPrice - currentPrice) / currentPrice) * 100;

    // Determine overall confidence
    let confidence: MarketForecast['confidence'];
    if (months <= 6) confidence = 'very_high';
    else if (months <= 12) confidence = 'high';
    else if (months <= 24) confidence = 'moderate';
    else confidence = 'low';

    return {
      location,
      propertyType,
      forecastPeriod,
      currentAveragePrice: Math.round(currentPrice),
      projections,
      expectedChange: Math.round(expectedChange * 10) / 10,
      factors,
      confidence,
    };
  }

  /**
   * Analyzes seasonal trends
   */
  public analyzeSeasonalTrends(
    location: string,
    monthlyData: Array<{
      month: number;
      listings: number;
      sales: number;
      averagePrice: number;
    }>
  ): SeasonalTrends {
    // Calculate average values
    const avgListings =
      monthlyData.reduce((sum, m) => sum + m.listings, 0) / monthlyData.length;
    const avgSales = monthlyData.reduce((sum, m) => sum + m.sales, 0) / monthlyData.length;
    const avgPrice =
      monthlyData.reduce((sum, m) => sum + m.averagePrice, 0) / monthlyData.length;

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const yearlyData = monthlyData.map((data) => {
      let relativeTrend: SeasonalTrends['yearlyData'][number]['relativeTrend'];

      // Determine if this month is peak, high, average, low, or trough
      const activityScore =
        (data.listings / avgListings) * 0.5 + (data.sales / avgSales) * 0.5;

      if (activityScore > 1.3) relativeTrend = 'peak';
      else if (activityScore > 1.1) relativeTrend = 'high';
      else if (activityScore > 0.9) relativeTrend = 'average';
      else if (activityScore > 0.7) relativeTrend = 'low';
      else relativeTrend = 'trough';

      return {
        month: data.month,
        monthName: monthNames[data.month - 1],
        averageListings: Math.round(data.listings),
        averageSales: Math.round(data.sales),
        averagePrice: Math.round(data.averagePrice),
        relativeTrend,
      };
    });

    // Identify best months to buy (lower prices, more inventory)
    const bestMonthsToBuy = yearlyData
      .filter((m) => m.averagePrice < avgPrice * 0.95 || m.averageListings > avgListings * 1.1)
      .map((m) => m.monthName);

    // Identify best months to sell (higher prices, more sales)
    const bestMonthsToSell = yearlyData
      .filter((m) => m.averagePrice > avgPrice * 1.05 || m.averageSales > avgSales * 1.1)
      .map((m) => m.monthName);

    const insights: string[] = [];

    const peakMonths = yearlyData.filter((m) => m.relativeTrend === 'peak');
    if (peakMonths.length > 0) {
      insights.push(
        `Peak activity months: ${peakMonths.map((m) => m.monthName).join(', ')}`
      );
    }

    const troughMonths = yearlyData.filter((m) => m.relativeTrend === 'trough');
    if (troughMonths.length > 0) {
      insights.push(
        `Slowest months: ${troughMonths.map((m) => m.monthName).join(', ')}`
      );
    }

    if (bestMonthsToBuy.length > 0) {
      insights.push(
        `Best buying opportunities typically in: ${bestMonthsToBuy.slice(0, 3).join(', ')}`
      );
    }

    return {
      location,
      yearlyData,
      bestMonthsToBuy,
      bestMonthsToSell,
      insights,
    };
  }

  /**
   * Performs comparative market analysis
   */
  public compareMarkets(
    locations: string[],
    marketData: Array<{
      location: string;
      averagePrice: number;
      priceChange1Year: number;
      daysOnMarket: number;
      inventoryLevel: number;
      demandScore: number;
      medianHouseholdIncome: number;
    }>
  ): ComparativeMarketAnalysis {
    const metrics = marketData.map((data) => {
      // Affordability index (lower price vs higher income = more affordable)
      const affordabilityIndex = Math.min(
        100,
        (data.medianHouseholdIncome / (data.averagePrice * 0.3)) * 100
      );

      // Investment score (price appreciation + demand + low DOM)
      const investmentScore =
        (data.priceChange1Year > 0 ? 30 : 0) +
        (data.demandScore / 100) * 40 +
        (data.daysOnMarket < 30 ? 30 : data.daysOnMarket < 60 ? 15 : 0);

      return {
        location: data.location,
        averagePrice: Math.round(data.averagePrice),
        priceChange1Year: Math.round(data.priceChange1Year * 10) / 10,
        daysOnMarket: data.daysOnMarket,
        inventoryLevel: data.inventoryLevel,
        demandScore: data.demandScore,
        affordabilityIndex: Math.round(affordabilityIndex),
        investmentScore: Math.round(investmentScore),
      };
    });

    // Find winner (best investment score)
    const winner = metrics.reduce((best, current) =>
      current.investmentScore > best.investmentScore ? current : best
    ).location;

    const insights: string[] = [];

    const cheapest = metrics.reduce((min, current) =>
      current.averagePrice < min.averagePrice ? current : min
    );
    insights.push(
      `${cheapest.location} has the lowest average price at €${cheapest.averagePrice.toLocaleString()}`
    );

    const fastestGrowth = metrics.reduce((max, current) =>
      current.priceChange1Year > max.priceChange1Year ? current : max
    );
    insights.push(
      `${fastestGrowth.location} has the highest price growth at ${fastestGrowth.priceChange1Year}% annually`
    );

    const mostAffordable = metrics.reduce((max, current) =>
      current.affordabilityIndex > max.affordabilityIndex ? current : max
    );
    insights.push(
      `${mostAffordable.location} is the most affordable with an index of ${mostAffordable.affordabilityIndex}/100`
    );

    insights.push(
      `${winner} ranks highest overall for investment potential`
    );

    return {
      locations,
      metrics,
      winner,
      insights,
    };
  }

  /**
   * Generates market alerts based on conditions
   */
  public generateAlerts(
    location: string,
    currentMetrics: {
      priceChange30Days: number;
      inventoryChange30Days: number;
      demandScore: number;
      daysOnMarket: number;
    },
    thresholds: {
      priceDropAlert: number;
      priceSpikeAlert: number;
      inventoryChangeAlert: number;
      hotMarketThreshold: number;
    }
  ): MarketAlert[] {
    const alerts: MarketAlert[] = [];

    // Price drop alert
    if (currentMetrics.priceChange30Days <= -thresholds.priceDropAlert) {
      alerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'price_drop',
        severity: currentMetrics.priceChange30Days <= -10 ? 'critical' : 'warning',
        location,
        message: `Prices dropped ${Math.abs(currentMetrics.priceChange30Days)}% in the last 30 days`,
        data: { change: currentMetrics.priceChange30Days },
        timestamp: new Date().toISOString(),
      });
    }

    // Price spike alert
    if (currentMetrics.priceChange30Days >= thresholds.priceSpikeAlert) {
      alerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'price_spike',
        severity: 'warning',
        location,
        message: `Prices increased ${currentMetrics.priceChange30Days}% in the last 30 days`,
        data: { change: currentMetrics.priceChange30Days },
        timestamp: new Date().toISOString(),
      });
    }

    // Hot market alert
    if (
      currentMetrics.demandScore >= thresholds.hotMarketThreshold &&
      currentMetrics.daysOnMarket < 20
    ) {
      alerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'hot_market',
        severity: 'critical',
        location,
        message: `Hot market detected: High demand (${currentMetrics.demandScore}/100) with properties selling in ${currentMetrics.daysOnMarket} days`,
        data: {
          demandScore: currentMetrics.demandScore,
          daysOnMarket: currentMetrics.daysOnMarket,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Buyers market alert
    if (currentMetrics.demandScore < 40 && currentMetrics.daysOnMarket > 60) {
      alerts.push({
        id: `alert-${Date.now()}-4`,
        type: 'buyers_market',
        severity: 'info',
        location,
        message: `Buyer's market opportunity: Low demand and properties staying on market for ${currentMetrics.daysOnMarket} days`,
        data: {
          demandScore: currentMetrics.demandScore,
          daysOnMarket: currentMetrics.daysOnMarket,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateVolatility(prices: number[]): MarketTrend['volatility'] {
    if (prices.length < 2) return 'low';

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;

    if (coefficientOfVariation > 10) return 'high';
    if (coefficientOfVariation > 5) return 'moderate';
    return 'low';
  }

  private calculatePriceChange(prices: number[]): number {
    if (prices.length < 2) return 0;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10;
  }

  private calculateTrendRate(prices: number[]): number {
    if (prices.length < 2) return 0;

    // Simple linear regression
    const n = prices.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = prices;

    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;

    // Convert slope to monthly percentage change
    return (slope / yMean) * 100;
  }
}
