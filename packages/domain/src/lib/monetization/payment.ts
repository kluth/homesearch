import { z } from 'zod';

/**
 * Payment Provider Enumeration
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

/**
 * Payment Method Type
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

/**
 * Payment Intent Schema
 */
export const PaymentIntentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),

  // Payment details
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  status: z.nativeEnum(PaymentStatus),

  // Purpose
  description: z.string(),
  purpose: z.enum([
    'subscription',
    'listing_promotion',
    'premium_report',
    'featured_listing',
    'virtual_tour',
    'lead_purchase',
  ]),

  // Provider details
  provider: z.nativeEnum(PaymentProvider),
  providerPaymentId: z.string().optional(),
  providerCustomerId: z.string().optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
  receiptEmail: z.string().email().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

/**
 * Payment Method Schema
 */
export const PaymentMethodSchema = z.object({
  id: z.string(),
  userId: z.string(),

  type: z.nativeEnum(PaymentMethodType),
  isDefault: z.boolean().default(false),

  // Card details (if type is 'card')
  card: z.object({
    brand: z.string(), // visa, mastercard, amex, etc.
    last4: z.string(),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int(),
  }).optional(),

  // Provider details
  provider: z.nativeEnum(PaymentProvider),
  providerMethodId: z.string(),

  billingDetails: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Invoice Schema
 */
export const InvoiceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subscriptionId: z.string().optional(),

  // Invoice details
  number: z.string(), // Invoice number (e.g., "INV-2025-0001")
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),

  // Line items
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
  })),

  // Tax & totals
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  total: z.number().positive(),

  // Dates
  periodStart: z.date(),
  periodEnd: z.date(),
  dueDate: z.date().optional(),
  paidAt: z.date().optional(),

  // Provider
  provider: z.nativeEnum(PaymentProvider),
  providerInvoiceId: z.string().optional(),

  // PDF
  pdfUrl: z.string().url().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * Refund Schema
 */
export const RefundSchema = z.object({
  id: z.string(),
  paymentId: z.string(),
  userId: z.string(),

  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'other']),
  status: z.nativeEnum(PaymentStatus),

  provider: z.nativeEnum(PaymentProvider),
  providerRefundId: z.string().optional(),

  createdAt: z.date(),
  processedAt: z.date().optional(),
});

export type Refund = z.infer<typeof RefundSchema>;
