/**
 * Payment Provider Integration
 *
 * NOTE: This file provides interfaces for payment providers.
 * To enable actual payment processing, install the required SDKs:
 *
 * For Stripe:
 *   cd apps/backend-functions && pnpm install stripe
 *
 * For PayPal:
 *   cd apps/backend-functions && pnpm install @paypal/checkout-server-sdk
 *
 * Environment variables needed:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - PAYPAL_CLIENT_ID
 *   - PAYPAL_CLIENT_SECRET
 */

import { logger } from 'firebase-functions/v2';
import { PaymentProvider, PaymentStatus, PaymentIntent } from '@house-finder/domain';

/**
 * Payment Provider Interface
 */
export interface IPaymentProvider {
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, unknown>): Promise<{
    id: string;
    clientSecret: string;
  }>;

  confirmPayment(paymentIntentId: string): Promise<boolean>;
  refundPayment(paymentIntentId: string, amount?: number): Promise<boolean>;
  createCustomer(email: string, name?: string): Promise<string>;
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean>;
  createSubscription(customerId: string, priceId: string): Promise<string>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}

/**
 * Stripe Payment Provider
 */
export class StripeProvider implements IPaymentProvider {
  private stripe: any;
  private isInitialized = false;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    try {
      // NOTE: Uncomment when Stripe is installed
      // const Stripe = require('stripe');
      // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // this.isInitialized = true;

      logger.info('Stripe provider initialized (mock mode - install Stripe SDK to enable)');
    } catch (error) {
      logger.error('Failed to initialize Stripe', { error });
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>
  ): Promise<{ id: string; clientSecret: string }> {
    if (!this.isInitialized) {
      // Mock response for development
      return {
        id: `pi_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret`,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed', { error });
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true; // Mock success
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      logger.error('Stripe payment confirmation failed', { error });
      return false;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    if (!this.isInitialized) {
      return true; // Mock success
    }

    try {
      const refundData: any = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);
      return refund.status === 'succeeded';
    } catch (error) {
      logger.error('Stripe refund failed', { error });
      return false;
    }
  }

  async createCustomer(email: string, name?: string): Promise<string> {
    if (!this.isInitialized) {
      return `cus_mock_${Date.now()}`; // Mock customer ID
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      return customer.id;
    } catch (error) {
      logger.error('Stripe customer creation failed', { error });
      throw error;
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return true;
    } catch (error) {
      logger.error('Stripe payment method attachment failed', { error });
      return false;
    }
  }

  async createSubscription(customerId: string, priceId: string): Promise<string> {
    if (!this.isInitialized) {
      return `sub_mock_${Date.now()}`;
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription.id;
    } catch (error) {
      logger.error('Stripe subscription creation failed', { error });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      logger.error('Stripe subscription cancellation failed', { error });
      return false;
    }
  }
}

/**
 * PayPal Payment Provider
 */
export class PayPalProvider implements IPaymentProvider {
  private client: any;
  private isInitialized = false;

  constructor() {
    this.initializePayPal();
  }

  private async initializePayPal() {
    try {
      // NOTE: Uncomment when PayPal SDK is installed
      // const paypal = require('@paypal/checkout-server-sdk');
      // const environment = process.env.NODE_ENV === 'production'
      //   ? new paypal.core.LiveEnvironment(
      //       process.env.PAYPAL_CLIENT_ID,
      //       process.env.PAYPAL_CLIENT_SECRET
      //     )
      //   : new paypal.core.SandboxEnvironment(
      //       process.env.PAYPAL_CLIENT_ID,
      //       process.env.PAYPAL_CLIENT_SECRET
      //     );
      // this.client = new paypal.core.PayPalHttpClient(environment);
      // this.isInitialized = true;

      logger.info('PayPal provider initialized (mock mode - install PayPal SDK to enable)');
    } catch (error) {
      logger.error('Failed to initialize PayPal', { error });
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>
  ): Promise<{ id: string; clientSecret: string }> {
    if (!this.isInitialized) {
      return {
        id: `pp_mock_${Date.now()}`,
        clientSecret: `pp_mock_${Date.now()}_secret`,
      };
    }

    // PayPal uses Orders API
    const request: any = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
      }],
    };

    try {
      // const orderRequest = new paypal.orders.OrdersCreateRequest();
      // orderRequest.prefer('return=representation');
      // orderRequest.requestBody(request);
      // const order = await this.client.execute(orderRequest);

      return {
        id: 'mock_order_id', // order.result.id
        clientSecret: 'mock_client_secret',
      };
    } catch (error) {
      logger.error('PayPal order creation failed', { error });
      throw error;
    }
  }

  async confirmPayment(orderId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    try {
      // const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
      // const capture = await this.client.execute(captureRequest);
      // return capture.result.status === 'COMPLETED';
      return true;
    } catch (error) {
      logger.error('PayPal payment confirmation failed', { error });
      return false;
    }
  }

  async refundPayment(captureId: string, amount?: number): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    try {
      // const refundRequest = new paypal.payments.CapturesRefundRequest(captureId);
      // if (amount) {
      //   refundRequest.requestBody({
      //     amount: {
      //       value: amount.toFixed(2),
      //       currency_code: 'USD',
      //     },
      //   });
      // }
      // const refund = await this.client.execute(refundRequest);
      // return refund.result.status === 'COMPLETED';
      return true;
    } catch (error) {
      logger.error('PayPal refund failed', { error });
      return false;
    }
  }

  // PayPal doesn't have a traditional "customer" concept
  async createCustomer(email: string, name?: string): Promise<string> {
    return `paypal_${email}`;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    // PayPal handles payment methods differently
    return true;
  }

  async createSubscription(customerId: string, planId: string): Promise<string> {
    if (!this.isInitialized) {
      return `sub_pp_mock_${Date.now()}`;
    }

    // PayPal Subscriptions API
    return `sub_pp_mock_${Date.now()}`;
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    // Cancel PayPal subscription
    return true;
  }
}

/**
 * Payment Provider Factory
 */
export class PaymentProviderFactory {
  static getProvider(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return new StripeProvider();
      case PaymentProvider.PAYPAL:
        return new PayPalProvider();
      case PaymentProvider.APPLE_PAY:
        // Apple Pay is handled through Stripe
        return new StripeProvider();
      case PaymentProvider.GOOGLE_PAY:
        // Google Pay is handled through Stripe
        return new StripeProvider();
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }
}
