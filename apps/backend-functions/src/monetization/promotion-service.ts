import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import {
  PromotedListing,
  PromotionType,
  PromotionStatus,
  PROMOTION_PRICING,
  AdPlacement,
} from '@house-finder/domain';
import { PaymentProviderFactory } from './payment-providers.js';

/**
 * Promotion and Advertising Service
 */
export class PromotionService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * Create promoted listing
   */
  async createPromotedListing(
    propertyId: string,
    userId: string,
    workspaceId: string,
    type: PromotionType,
    durationDays: number,
    paymentProvider: string,
    paymentMethodId: string
  ): Promise<PromotedListing> {
    try {
      const pricing = PROMOTION_PRICING[type];
      const totalCost = pricing.basePrice * durationDays;

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const promotedListing: PromotedListing = {
        id: this.firestore.collection('promoted_listings').doc().id,
        propertyId,
        userId,
        workspaceId,
        type,
        status: PromotionStatus.SCHEDULED,
        startDate: now,
        endDate,
        durationDays,
        dailyRate: pricing.basePrice,
        totalCost,
        currency: 'USD',
        isPaid: false,
        stats: {
          impressions: 0,
          clicks: 0,
          inquiries: 0,
          favorites: 0,
        },
        autoRenew: false,
        createdAt: now,
        updatedAt: now,
      };

      // Process payment
      const provider = PaymentProviderFactory.getProvider(paymentProvider as any);

      try {
        const paymentIntent = await provider.createPaymentIntent(
          totalCost,
          'USD',
          {
            propertyId,
            userId,
            promotionType: type,
            durationDays,
          }
        );

        promotedListing.paymentId = paymentIntent.id;

        // In a real implementation, we'd wait for webhook confirmation
        // For now, mark as paid
        promotedListing.isPaid = true;
        promotedListing.paidAt = new Date();
        promotedListing.status = PromotionStatus.ACTIVE;

        logger.info('Payment processed for promoted listing', {
          promotedListingId: promotedListing.id,
          paymentIntentId: paymentIntent.id,
        });
      } catch (error) {
        logger.error('Payment failed for promoted listing', { error });
        throw new Error('Payment processing failed');
      }

      // Save to Firestore
      await this.firestore.collection('promoted_listings').doc(promotedListing.id).set({
        ...promotedListing,
        startDate: admin.firestore.Timestamp.fromDate(promotedListing.startDate),
        endDate: admin.firestore.Timestamp.fromDate(promotedListing.endDate),
        paidAt: promotedListing.paidAt ? admin.firestore.Timestamp.fromDate(promotedListing.paidAt) : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update property with promotion badge
      await this.firestore.collection('properties').doc(propertyId).update({
        'metadata.promoted': true,
        'metadata.promotionType': type,
        'metadata.promotionEndDate': admin.firestore.Timestamp.fromDate(endDate),
      });

      logger.info('Promoted listing created', { promotedListingId: promotedListing.id });

      return promotedListing;
    } catch (error) {
      logger.error('Failed to create promoted listing', { propertyId, error });
      throw error;
    }
  }

  /**
   * Track promotion impression
   */
  async trackImpression(promotedListingId: string): Promise<void> {
    try {
      await this.firestore
        .collection('promoted_listings')
        .doc(promotedListingId)
        .update({
          'stats.impressions': admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error('Failed to track impression', { promotedListingId, error });
    }
  }

  /**
   * Track promotion click
   */
  async trackClick(promotedListingId: string): Promise<void> {
    try {
      await this.firestore
        .collection('promoted_listings')
        .doc(promotedListingId)
        .update({
          'stats.clicks': admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error('Failed to track click', { promotedListingId, error });
    }
  }

  /**
   * Track inquiry from promoted listing
   */
  async trackInquiry(promotedListingId: string): Promise<void> {
    try {
      await this.firestore
        .collection('promoted_listings')
        .doc(promotedListingId)
        .update({
          'stats.inquiries': admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error('Failed to track inquiry', { promotedListingId, error });
    }
  }

  /**
   * Get ads to display
   */
  async getAdsForPlacement(
    position: string,
    userPlan: string,
    location?: string,
    propertyType?: string
  ): Promise<AdPlacement[]> {
    try {
      // Only show ads to free and basic users
      if (!['free', 'basic'].includes(userPlan)) {
        return [];
      }

      let query = this.firestore
        .collection('ad_placements')
        .where('position', '==', position)
        .where('isActive', '==', true)
        .where('targetAudience.plans', 'array-contains', userPlan);

      // Filter by location if provided
      if (location) {
        query = query.where('targetAudience.locations', 'array-contains', location);
      }

      const snapshot = await query.limit(3).get();

      const ads: AdPlacement[] = [];

      for (const doc of snapshot.docs) {
        const ad = doc.data() as AdPlacement;

        // Check budget
        if (ad.budget.spent >= ad.budget.total) {
          continue;
        }

        // Check if expired
        if (ad.endDate && ad.endDate.toDate() < new Date()) {
          continue;
        }

        ads.push(ad);
      }

      // Sort by priority
      ads.sort((a, b) => b.priority - a.priority);

      return ads;
    } catch (error) {
      logger.error('Failed to get ads', { position, error });
      return [];
    }
  }

  /**
   * Track ad impression
   */
  async trackAdImpression(adId: string): Promise<void> {
    try {
      const adRef = this.firestore.collection('ad_placements').doc(adId);
      const adDoc = await adRef.get();

      if (!adDoc.exists) {
        return;
      }

      const ad = adDoc.data() as AdPlacement;

      // Calculate cost based on pricing model
      let cost = 0;
      if (ad.pricingModel === 'cpm') {
        cost = ad.costPerAction / 1000; // Cost per thousand impressions
      }

      await adRef.update({
        'stats.impressions': admin.firestore.FieldValue.increment(1),
        'budget.spent': admin.firestore.FieldValue.increment(cost),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to track ad impression', { adId, error });
    }
  }

  /**
   * Track ad click
   */
  async trackAdClick(adId: string): Promise<void> {
    try {
      const adRef = this.firestore.collection('ad_placements').doc(adId);
      const adDoc = await adRef.get();

      if (!adDoc.exists) {
        return;
      }

      const ad = adDoc.data() as AdPlacement;

      let cost = 0;
      if (ad.pricingModel === 'cpc') {
        cost = ad.costPerAction; // Cost per click
      }

      // Calculate CTR
      const newClicks = ad.stats.clicks + 1;
      const ctr = ad.stats.impressions > 0 ? (newClicks / ad.stats.impressions) * 100 : 0;

      await adRef.update({
        'stats.clicks': admin.firestore.FieldValue.increment(1),
        'stats.ctr': ctr,
        'budget.spent': admin.firestore.FieldValue.increment(cost),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to track ad click', { adId, error });
    }
  }

  /**
   * Expire old promotions
   * Should be run via scheduled Cloud Function
   */
  async expireOldPromotions(): Promise<void> {
    try {
      const now = new Date();

      const expiredPromotions = await this.firestore
        .collection('promoted_listings')
        .where('status', '==', PromotionStatus.ACTIVE)
        .where('endDate', '<=', admin.firestore.Timestamp.fromDate(now))
        .get();

      const batch = this.firestore.batch();

      for (const doc of expiredPromotions.docs) {
        batch.update(doc.ref, {
          status: PromotionStatus.EXPIRED,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Remove promotion badge from property
        const promotion = doc.data() as PromotedListing;
        batch.update(this.firestore.collection('properties').doc(promotion.propertyId), {
          'metadata.promoted': false,
          'metadata.promotionType': null,
          'metadata.promotionEndDate': null,
        });
      }

      await batch.commit();

      logger.info('Expired promotions processed', { count: expiredPromotions.size });
    } catch (error) {
      logger.error('Failed to expire old promotions', { error });
    }
  }

  /**
   * Get promotion analytics
   */
  async getPromotionAnalytics(userId: string): Promise<{
    totalSpent: number;
    totalImpressions: number;
    totalClicks: number;
    totalInquiries: number;
    roi: number;
  }> {
    try {
      const promotionsSnapshot = await this.firestore
        .collection('promoted_listings')
        .where('userId', '==', userId)
        .get();

      let totalSpent = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalInquiries = 0;

      for (const doc of promotionsSnapshot.docs) {
        const promo = doc.data() as PromotedListing;
        if (promo.isPaid) {
          totalSpent += promo.totalCost;
        }
        totalImpressions += promo.stats.impressions;
        totalClicks += promo.stats.clicks;
        totalInquiries += promo.stats.inquiries;
      }

      // Simple ROI calculation (inquiries as conversions)
      const roi = totalSpent > 0 ? ((totalInquiries * 100 - totalSpent) / totalSpent) * 100 : 0;

      return {
        totalSpent,
        totalImpressions,
        totalClicks,
        totalInquiries,
        roi,
      };
    } catch (error) {
      logger.error('Failed to get promotion analytics', { userId, error });
      throw error;
    }
  }
}

// Singleton instance
export const promotionService = new PromotionService();
