/**
 * Currency Conversion Schemas
 *
 * Multi-currency support for international buyers.
 * Addresses User Story 5.2: Currency Conversion
 */

import { z } from 'zod';

/**
 * Supported Currencies
 */
export enum SupportedCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
  INR = 'INR',
  MXN = 'MXN',
  BRL = 'BRL',
  KRW = 'KRW',
  SGD = 'SGD',
  HKD = 'HKD',
}

/**
 * Exchange Rate
 */
export const ExchangeRateSchema = z.object({
  baseCurrency: z.nativeEnum(SupportedCurrency),
  targetCurrency: z.nativeEnum(SupportedCurrency),
  rate: z.number(),
  inverseRate: z.number(),
  lastUpdated: z.date(),
  source: z.string(), // "ExchangeRate-API", "Fixer.io", etc.
});

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

/**
 * Currency Conversion
 */
export const CurrencyConversionSchema = z.object({
  baseCurrency: z.nativeEnum(SupportedCurrency),
  rates: z.record(z.number()), // currency code -> rate
  lastUpdated: z.date(),
  expiresAt: z.date(),
});

export type CurrencyConversion = z.infer<typeof CurrencyConversionSchema>;

/**
 * Price Display (Multi-currency)
 */
export const MultiCurrencyPriceSchema = z.object({
  usd: z.number(),
  displayCurrency: z.nativeEnum(SupportedCurrency),
  displayAmount: z.number(),
  exchangeRate: z.number(),
  rateAsOf: z.date(),
  disclaimer: z.string().default('Exchange rates are approximate and for reference only'),
});

export type MultiCurrencyPrice = z.infer<typeof MultiCurrencyPriceSchema>;

/**
 * User Currency Preference
 */
export const UserCurrencyPreferenceSchema = z.object({
  userId: z.string(),
  preferredCurrency: z.nativeEnum(SupportedCurrency),
  homeCurrency: z.nativeEnum(SupportedCurrency),
  showBothCurrencies: z.boolean().default(true),
});

export type UserCurrencyPreference = z.infer<typeof UserCurrencyPreferenceSchema>;
