/**
 * Price Intelligence & Market Analysis Service
 * Analyzes property prices, detects trends, and provides insights
 */

import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Price analysis result
 */
export interface PriceAnalysis {
  property: UnifiedHouseModel;
  fairnessScore: number; // 0-100 (50 = fair, <50 = overpriced, >50 = underpriced)
  estimatedFairPrice: number;
  pricePerSqm?: number;
  marketComparison: {
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
    percentile: number; // Where this property falls (0-100)
  };
  verdict: PriceVerdict;
  insights: string[];
  confidence: number; // 0-1
}

export enum PriceVerdict {
  GREAT_DEAL = 'great_deal', // >15% below market
  GOOD_DEAL = 'good_deal', // 5-15% below market
  FAIR_PRICE = 'fair_price', // Within 5% of market
  SLIGHTLY_HIGH = 'slightly_high', // 5-15% above market
  OVERPRICED = 'overpriced', // >15% above market
  INSUFFICIENT_DATA = 'insufficient_data',
}

/**
 * Market trend
 */
export interface MarketTrend {
  location: string;
  propertyType: string;
  period: string; // e.g., "last_30_days", "last_90_days"
  averagePrice: number;
  priceChange: number; // percentage change
  direction: 'rising' | 'falling' | 'stable';
  velocity: 'fast' | 'moderate' | 'slow';
  sampleSize: number;
}

/**
 * Property price statistics
 */
interface PriceStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Price Intelligence Service
 */
export class PriceIntelligence {
  /**
   * Analyze property price fairness
   */
  public analyzePrice(
    property: UnifiedHouseModel,
    marketData: UnifiedHouseModel[]
  ): PriceAnalysis {
    // Filter comparable properties
    const comparables = this.findComparableProperties(property, marketData);

    if (comparables.length < 3) {
      return this.createInsufficientDataAnalysis(property);
    }

    // Calculate statistics
    const stats = this.calculatePriceStats(comparables);

    // Calculate price per sqm if area available
    let pricePerSqm: number | undefined;
    if (property.area != null && property.area > 0) {
      pricePerSqm = property.price / property.area;
    }

    // Determine fairness score
    const fairnessScore = this.calculateFairnessScore(property.price, stats);

    // Estimate fair price using regression (simple version)
    const estimatedFairPrice = this.estimateFairPrice(property, comparables);

    // Calculate percentile
    const percentile = this.calculatePercentile(property.price, comparables);

    // Determine verdict
    const verdict = this.determineVerdict(fairnessScore);

    // Generate insights
    const insights = this.generatePriceInsights(
      property,
      stats,
      fairnessScore,
      estimatedFairPrice,
      pricePerSqm,
      comparables
    );

    // Calculate confidence (more comparables = higher confidence)
    const confidence = Math.min(1, comparables.length / 20);

    return {
      property,
      fairnessScore,
      estimatedFairPrice,
      pricePerSqm,
      marketComparison: {
        averagePrice: stats.mean,
        medianPrice: stats.median,
        priceRange: { min: stats.min, max: stats.max },
        percentile,
      },
      verdict,
      insights,
      confidence,
    };
  }

  /**
   * Find comparable properties for analysis
   */
  private findComparableProperties(
    property: UnifiedHouseModel,
    marketData: UnifiedHouseModel[]
  ): UnifiedHouseModel[] {
    const comparables = marketData.filter((comp) => {
      // Same city
      if (
        comp.location.city?.toLowerCase() !== property.location.city?.toLowerCase()
      ) {
        return false;
      }

      // Similar property type
      if (
        property.type != null &&
        comp.type != null &&
        comp.type.toLowerCase() !== property.type.toLowerCase()
      ) {
        return false;
      }

      // Similar room count (±1 room)
      if (property.rooms != null && comp.rooms != null) {
        if (Math.abs(comp.rooms - property.rooms) > 1) {
          return false;
        }
      }

      // Similar area (±30%)
      if (property.area != null && comp.area != null) {
        const areaDiff = Math.abs(comp.area - property.area) / property.area;
        if (areaDiff > 0.3) {
          return false;
        }
      }

      // Price within reasonable range (±50% to avoid outliers)
      const priceDiff = Math.abs(comp.price - property.price) / property.price;
      if (priceDiff > 0.5) {
        return false;
      }

      return true;
    });

    return comparables;
  }

  /**
   * Calculate price statistics
   */
  private calculatePriceStats(properties: UnifiedHouseModel[]): PriceStats {
    const prices = properties.map((p) => p.price).sort((a, b) => a - b);

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

    const median =
      prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];

    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      prices.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: prices[0],
      max: prices[prices.length - 1],
      count: prices.length,
    };
  }

  /**
   * Calculate fairness score (0-100)
   * 50 = fair market price
   * >50 = below market (good deal)
   * <50 = above market (overpriced)
   */
  private calculateFairnessScore(price: number, stats: PriceStats): number {
    const deviation = (stats.median - price) / stats.median;

    // Convert deviation to 0-100 scale
    // -30% deviation = 100 (great deal)
    // 0% deviation = 50 (fair)
    // +30% deviation = 0 (overpriced)
    const score = 50 + deviation * 100 * 1.67; // 1.67 = 100/60 to map ±30% to 0-100

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Estimate fair price using simple regression
   */
  private estimateFairPrice(
    property: UnifiedHouseModel,
    comparables: UnifiedHouseModel[]
  ): number {
    // Simple weighted average based on similarity
    let totalWeight = 0;
    let weightedSum = 0;

    for (const comp of comparables) {
      let weight = 1;

      // Increase weight for exact room match
      if (property.rooms === comp.rooms) {
        weight *= 1.5;
      }

      // Increase weight for similar area
      if (property.area != null && comp.area != null) {
        const areaDiff = Math.abs(comp.area - property.area) / property.area;
        weight *= 1 - areaDiff; // Closer area = higher weight
      }

      // Increase weight for recent listings
      const age =
        (Date.now() - new Date(comp.metadata.extractedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (age < 7) {
        weight *= 1.3; // Recent listings weighted higher
      }

      weightedSum += comp.price * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Calculate percentile rank
   */
  private calculatePercentile(
    price: number,
    comparables: UnifiedHouseModel[]
  ): number {
    const prices = comparables.map((p) => p.price).sort((a, b) => a - b);
    const below = prices.filter((p) => p < price).length;
    return Math.round((below / prices.length) * 100);
  }

  /**
   * Determine price verdict
   */
  private determineVerdict(fairnessScore: number): PriceVerdict {
    if (fairnessScore >= 65) return PriceVerdict.GREAT_DEAL;
    if (fairnessScore >= 55) return PriceVerdict.GOOD_DEAL;
    if (fairnessScore >= 45) return PriceVerdict.FAIR_PRICE;
    if (fairnessScore >= 35) return PriceVerdict.SLIGHTLY_HIGH;
    return PriceVerdict.OVERPRICED;
  }

  /**
   * Generate price insights
   */
  private generatePriceInsights(
    property: UnifiedHouseModel,
    stats: PriceStats,
    fairnessScore: number,
    estimatedFairPrice: number,
    pricePerSqm: number | undefined,
    comparables: UnifiedHouseModel[]
  ): string[] {
    const insights: string[] = [];

    // Price comparison
    const priceDiff = property.price - estimatedFairPrice;
    const priceDiffPercent = ((priceDiff / estimatedFairPrice) * 100).toFixed(1);

    if (fairnessScore >= 65) {
      insights.push(
        `🔥 Excellent deal! ${Math.abs(parseFloat(priceDiffPercent))}% below market average`
      );
    } else if (fairnessScore >= 55) {
      insights.push(
        `✅ Good value - ${Math.abs(parseFloat(priceDiffPercent))}% below typical price`
      );
    } else if (fairnessScore >= 45) {
      insights.push('💰 Fairly priced based on market data');
    } else if (fairnessScore >= 35) {
      insights.push(
        `⚠️  Slightly above market - ${priceDiffPercent}% higher than average`
      );
    } else {
      insights.push(
        `❌ Overpriced - ${priceDiffPercent}% above market value`
      );
    }

    // Price per sqm comparison
    if (pricePerSqm != null) {
      const avgPricePerSqm =
        comparables
          .filter((c) => c.area != null && c.area > 0)
          .reduce((sum, c) => sum + c.price / c.area!, 0) /
        comparables.filter((c) => c.area != null).length;

      const pricePerSqmDiff =
        ((pricePerSqm - avgPricePerSqm) / avgPricePerSqm) * 100;

      insights.push(
        `€${pricePerSqm.toFixed(2)}/m² (market avg: €${avgPricePerSqm.toFixed(2)}/m²)`
      );

      if (Math.abs(pricePerSqmDiff) > 10) {
        if (pricePerSqmDiff < 0) {
          insights.push(
            `Great price per square meter - ${Math.abs(pricePerSqmDiff).toFixed(1)}% below average`
          );
        } else {
          insights.push(
            `Price per sqm is ${pricePerSqmDiff.toFixed(1)}% above average`
          );
        }
      }
    }

    // Market position
    const percentile = this.calculatePercentile(property.price, comparables);
    if (percentile <= 25) {
      insights.push('In the lowest 25% of prices - exceptional value');
    } else if (percentile >= 75) {
      insights.push('In the top 25% of prices for this area');
    }

    // Comparison count
    insights.push(`Based on ${comparables.length} comparable properties`);

    // Recommendation
    if (fairnessScore >= 55) {
      insights.push('💡 Recommendation: Act quickly - this is a good opportunity');
    } else if (fairnessScore < 45) {
      insights.push('💡 Recommendation: Consider negotiating the price');
    }

    return insights;
  }

  /**
   * Create insufficient data analysis
   */
  private createInsufficientDataAnalysis(property: UnifiedHouseModel): PriceAnalysis {
    return {
      property,
      fairnessScore: 50,
      estimatedFairPrice: property.price,
      marketComparison: {
        averagePrice: property.price,
        medianPrice: property.price,
        priceRange: { min: property.price, max: property.price },
        percentile: 50,
      },
      verdict: PriceVerdict.INSUFFICIENT_DATA,
      insights: [
        'Not enough comparable properties found for accurate analysis',
        'Price assessment requires more market data',
      ],
      confidence: 0.1,
    };
  }

  /**
   * Analyze market trends
   */
  public analyzeMarketTrend(
    location: string,
    propertyType: string,
    historicalData: UnifiedHouseModel[]
  ): MarketTrend {
    // Filter data for location and type
    const filtered = historicalData.filter(
      (p) =>
        p.location.city?.toLowerCase() === location.toLowerCase() &&
        p.type?.toLowerCase() === propertyType.toLowerCase()
    );

    if (filtered.length < 10) {
      return this.createInsufficientTrendData(location, propertyType);
    }

    // Sort by extraction date
    const sorted = filtered.sort(
      (a, b) =>
        new Date(a.metadata.extractedAt).getTime() -
        new Date(b.metadata.extractedAt).getTime()
    );

    // Split into two periods (first half vs second half)
    const midpoint = Math.floor(sorted.length / 2);
    const older = sorted.slice(0, midpoint);
    const newer = sorted.slice(midpoint);

    // Calculate average prices
    const olderAvg =
      older.reduce((sum, p) => sum + p.price, 0) / older.length;
    const newerAvg =
      newer.reduce((sum, p) => sum + p.price, 0) / newer.length;

    // Calculate price change
    const priceChange = ((newerAvg - olderAvg) / olderAvg) * 100;

    // Determine direction
    let direction: 'rising' | 'falling' | 'stable';
    if (priceChange > 2) direction = 'rising';
    else if (priceChange < -2) direction = 'falling';
    else direction = 'stable';

    // Determine velocity
    let velocity: 'fast' | 'moderate' | 'slow';
    const absChange = Math.abs(priceChange);
    if (absChange > 10) velocity = 'fast';
    else if (absChange > 5) velocity = 'moderate';
    else velocity = 'slow';

    return {
      location,
      propertyType,
      period: 'last_90_days',
      averagePrice: newerAvg,
      priceChange: Math.round(priceChange * 10) / 10,
      direction,
      velocity,
      sampleSize: filtered.length,
    };
  }

  /**
   * Create insufficient trend data
   */
  private createInsufficientTrendData(
    location: string,
    propertyType: string
  ): MarketTrend {
    return {
      location,
      propertyType,
      period: 'last_90_days',
      averagePrice: 0,
      priceChange: 0,
      direction: 'stable',
      velocity: 'slow',
      sampleSize: 0,
    };
  }

  /**
   * Predict future price (simple linear regression)
   */
  public predictFuturePrice(
    property: UnifiedHouseModel,
    marketTrend: MarketTrend,
    monthsAhead: number
  ): { predictedPrice: number; confidence: number } {
    if (marketTrend.sampleSize < 10) {
      return {
        predictedPrice: property.price,
        confidence: 0.1,
      };
    }

    // Simple linear projection based on trend
    const monthlyChange = marketTrend.priceChange / 3; // Assuming trend is over 3 months
    const predictedChange = monthlyChange * monthsAhead;

    const predictedPrice = Math.round(
      property.price * (1 + predictedChange / 100)
    );

    // Confidence decreases with time
    const confidence = Math.max(0.1, 0.8 - monthsAhead * 0.1);

    return {
      predictedPrice,
      confidence,
    };
  }

  /**
   * Get negotiation suggestion
   */
  public getNegotiationSuggestion(analysis: PriceAnalysis): {
    shouldNegotiate: boolean;
    suggestedOffer: number;
    strategy: string;
  } {
    const { fairnessScore, property, estimatedFairPrice } = analysis;

    if (fairnessScore >= 55) {
      // Good deal - don't negotiate
      return {
        shouldNegotiate: false,
        suggestedOffer: property.price,
        strategy:
          'This is already a good deal. Offer asking price to secure it quickly.',
      };
    }

    if (fairnessScore >= 45) {
      // Fair price - minor negotiation
      const offer = Math.round(property.price * 0.97); // 3% below asking
      return {
        shouldNegotiate: true,
        suggestedOffer: offer,
        strategy:
          'Price is fair. You could try a modest 3% discount, but be prepared to pay full price.',
      };
    }

    if (fairnessScore >= 35) {
      // Slightly high - moderate negotiation
      const offer = Math.round((property.price + estimatedFairPrice) / 2);
      return {
        shouldNegotiate: true,
        suggestedOffer: offer,
        strategy:
          'Property is slightly overpriced. Start with this offer (midpoint between asking and fair value).',
      };
    }

    // Overpriced - aggressive negotiation
    const offer = Math.round(estimatedFairPrice);
    return {
      shouldNegotiate: true,
      suggestedOffer: offer,
      strategy:
        'Property is significantly overpriced. Offer the estimated fair market value. Be prepared to walk away if they won\'t negotiate.',
    };
  }
}
