import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  SUBSCRIPTION_PLANS,
  UsageTracking,
  PaymentProvider,
} from '@house-finder/domain';
import { PaymentProviderFactory } from './payment-providers.js';

/**
 * Subscription Management Service
 */
export class SubscriptionService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * Create new subscription
   */
  async createSubscription(
    userId: string,
    workspaceId: string,
    plan: SubscriptionPlan,
    interval: BillingInterval,
    paymentProvider: PaymentProvider,
    paymentMethodId?: string
  ): Promise<Subscription> {
    try {
      const planDetails = SUBSCRIPTION_PLANS[plan];
      const amount = interval === BillingInterval.MONTHLY
        ? planDetails.price.monthly
        : planDetails.price.yearly;

      const now = new Date();
      const periodEnd = new Date(now);
      if (interval === BillingInterval.MONTHLY) {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const subscription: Subscription = {
        id: this.firestore.collection('subscriptions').doc().id,
        userId,
        workspaceId,
        plan,
        status: amount === 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIALING,
        interval,
        amount,
        currency: planDetails.currency,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        paymentProvider,
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      };

      // Create payment provider subscription if not free
      if (amount > 0) {
        const provider = PaymentProviderFactory.getProvider(paymentProvider);

        // Create customer if needed
        const userDoc = await this.firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();

        let customerId = userData?.paymentProviderCustomerId;
        if (!customerId) {
          customerId = await provider.createCustomer(userData?.email || '', userData?.displayName);
          await this.firestore.collection('users').doc(userId).update({
            paymentProviderCustomerId: customerId,
          });
        }

        // Create subscription
        const providerPlanId = this.getPlanId(plan, interval);
        const subscriptionId = await provider.createSubscription(customerId, providerPlanId);

        subscription.paymentProviderCustomerId = customerId;
        subscription.paymentProviderSubscriptionId = subscriptionId;
        subscription.status = SubscriptionStatus.ACTIVE;
      }

      // Save to Firestore
      await this.firestore.collection('subscriptions').doc(subscription.id).set({
        ...subscription,
        currentPeriodStart: admin.firestore.Timestamp.fromDate(subscription.currentPeriodStart),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(subscription.currentPeriodEnd),
        trialStart: subscription.trialStart ? admin.firestore.Timestamp.fromDate(subscription.trialStart) : null,
        trialEnd: subscription.trialEnd ? admin.firestore.Timestamp.fromDate(subscription.trialEnd) : null,
        metadata: {
          ...subscription.metadata,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      // Update user's subscription plan in custom claims
      await admin.auth().setCustomUserClaims(userId, {
        ...(await admin.auth().getUser(userId)).customClaims,
        subscriptionPlan: plan,
      });

      // Update user profile
      await this.firestore.collection('users').doc(userId).update({
        'subscription.plan': plan,
        'subscription.status': subscription.status,
      });

      logger.info('Subscription created', { userId, plan });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { userId, plan, error });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelImmediately = false,
    reason?: string
  ): Promise<void> {
    try {
      const subscriptionRef = this.firestore.collection('subscriptions').doc(subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data() as Subscription;

      // Cancel with payment provider
      if (subscription.paymentProviderSubscriptionId) {
        const provider = PaymentProviderFactory.getProvider(subscription.paymentProvider);
        await provider.cancelSubscription(subscription.paymentProviderSubscriptionId);
      }

      // Update subscription
      const updates: any = {
        cancelAtPeriodEnd: !cancelImmediately,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.canceledAt': admin.firestore.FieldValue.serverTimestamp(),
      };

      if (reason) {
        updates['metadata.cancelReason'] = reason;
      }

      if (cancelImmediately) {
        updates.status = SubscriptionStatus.CANCELED;
        updates.currentPeriodEnd = admin.firestore.FieldValue.serverTimestamp();

        // Downgrade to free plan
        await this.firestore.collection('users').doc(subscription.userId).update({
          'subscription.plan': SubscriptionPlan.FREE,
          'subscription.status': SubscriptionStatus.CANCELED,
        });

        await admin.auth().setCustomUserClaims(subscription.userId, {
          ...(await admin.auth().getUser(subscription.userId)).customClaims,
          subscriptionPlan: SubscriptionPlan.FREE,
        });
      }

      await subscriptionRef.update(updates);

      logger.info('Subscription canceled', { subscriptionId, cancelImmediately });
    } catch (error) {
      logger.error('Failed to cancel subscription', { subscriptionId, error });
      throw error;
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan,
    newInterval?: BillingInterval
  ): Promise<void> {
    try {
      const subscriptionRef = this.firestore.collection('subscriptions').doc(subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionDoc.data() as Subscription;
      const interval = newInterval || subscription.interval;
      const planDetails = SUBSCRIPTION_PLANS[newPlan];
      const newAmount = interval === BillingInterval.MONTHLY
        ? planDetails.price.monthly
        : planDetails.price.yearly;

      // Update subscription
      await subscriptionRef.update({
        plan: newPlan,
        interval,
        amount: newAmount,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user
      await this.firestore.collection('users').doc(subscription.userId).update({
        'subscription.plan': newPlan,
      });

      await admin.auth().setCustomUserClaims(subscription.userId, {
        ...(await admin.auth().getUser(subscription.userId)).customClaims,
        subscriptionPlan: newPlan,
      });

      logger.info('Subscription changed', { subscriptionId, newPlan });
    } catch (error) {
      logger.error('Failed to change subscription', { subscriptionId, error });
      throw error;
    }
  }

  /**
   * Check if user has access to feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const userDoc = await this.firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.subscription?.plan) {
        return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features[feature as keyof typeof SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features] || false;
      }

      const plan = userData.subscription.plan as SubscriptionPlan;
      const planFeatures = SUBSCRIPTION_PLANS[plan].features;

      return planFeatures[feature as keyof typeof planFeatures] || false;
    } catch (error) {
      logger.error('Failed to check feature access', { userId, feature, error });
      return false;
    }
  }

  /**
   * Track usage
   */
  async trackUsage(
    userId: string,
    workspaceId: string,
    metric: keyof UsageTracking
  ): Promise<void> {
    try {
      const period = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usageRef = this.firestore
        .collection('usage_tracking')
        .doc(`${workspaceId}_${period}`);

      await usageRef.set({
        userId,
        workspaceId,
        period,
        [metric]: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      logger.error('Failed to track usage', { userId, metric, error });
    }
  }

  /**
   * Get Stripe/PayPal plan ID
   */
  private getPlanId(plan: SubscriptionPlan, interval: BillingInterval): string {
    // In production, these would be actual Stripe Price IDs
    return `price_${plan}_${interval}`;
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();
