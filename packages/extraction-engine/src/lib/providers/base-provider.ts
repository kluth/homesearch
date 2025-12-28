import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Error codes for extraction failures
 */
export type ErrorCode =
  | 'EXTRACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTHENTICATION_ERROR'
  | 'INVALID_RESPONSE'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * Extraction error details
 */
export interface ExtractionError {
  code: ErrorCode;
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Successful extraction result
 */
export interface SuccessfulExtractionResult {
  success: true;
  data: UnifiedHouseModel[];
  extractedCount: number;
  errorCount: number;
  errors?: never;
  metadata?: {
    duration?: number; // Extraction duration in milliseconds
    pagesScraped?: number;
    apiCallsUsed?: number;
  };
}

/**
 * Failed extraction result
 */
export interface FailedExtractionResult {
  success: false;
  data: UnifiedHouseModel[]; // Partial data if some items were extracted before failure
  extractedCount: number;
  errorCount: number;
  errors?: ExtractionError[];
  metadata?: {
    duration?: number;
    pagesScraped?: number;
    apiCallsUsed?: number;
  };
}

/**
 * Union type for extraction results
 */
export type ExtractionResult = SuccessfulExtractionResult | FailedExtractionResult;

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  maxRetries?: number;
  timeout?: number; // in milliseconds
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  headers?: Record<string, string>;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

/**
 * Search parameters for data extraction
 */
export interface SearchParams {
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number; // in kilometers
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  propertyTypes?: string[];
  keywords?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Base interface for all data providers (scrapers and API clients)
 * This implements the Strategy Pattern
 */
export interface DataProvider {
  /**
   * Unique name of the provider
   */
  readonly name: string;

  /**
   * Type of provider (scraper or api)
   */
  readonly type: 'scraper' | 'api';

  /**
   * Extract data from the provider
   * @param params Optional search parameters
   * @returns Extraction result with house data or errors
   */
  extract(params?: SearchParams): Promise<ExtractionResult>;

  /**
   * Validate provider configuration
   * @returns True if configuration is valid
   */
  validateConfig(): Promise<boolean>;

  /**
   * Check if the provider is healthy and accessible
   * @returns True if provider is accessible
   */
  healthCheck(): Promise<boolean>;

  /**
   * Optional cleanup method
   */
  cleanup?(): Promise<void>;
}

/**
 * Abstract base class for scrapers with common functionality
 */
export abstract class BaseScraper implements DataProvider {
  abstract readonly name: string;
  readonly type = 'scraper' as const;

  constructor(protected config: ProviderConfig = {}) {}

  abstract extract(params?: SearchParams): Promise<ExtractionResult>;
  abstract validateConfig(): Promise<boolean>;
  abstract healthCheck(): Promise<boolean>;

  /**
   * Create a standardized error object
   */
  protected createError(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): ExtractionError {
    return {
      code,
      message,
      timestamp: new Date(),
      details,
    };
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    data: UnifiedHouseModel[],
    metadata?: SuccessfulExtractionResult['metadata']
  ): SuccessfulExtractionResult {
    return {
      success: true,
      data,
      extractedCount: data.length,
      errorCount: 0,
      metadata,
    };
  }

  /**
   * Create a failed result
   */
  protected createFailedResult(
    data: UnifiedHouseModel[],
    errors: ExtractionError[],
    metadata?: FailedExtractionResult['metadata']
  ): FailedExtractionResult {
    return {
      success: false,
      data,
      extractedCount: data.length,
      errorCount: errors.length,
      errors,
      metadata,
    };
  }
}

/**
 * Abstract base class for API clients with common functionality
 */
export abstract class BaseApiClient implements DataProvider {
  abstract readonly name: string;
  readonly type = 'api' as const;

  constructor(protected config: ProviderConfig = {}) {}

  abstract extract(params?: SearchParams): Promise<ExtractionResult>;
  abstract validateConfig(): Promise<boolean>;
  abstract healthCheck(): Promise<boolean>;

  /**
   * Create a standardized error object
   */
  protected createError(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): ExtractionError {
    return {
      code,
      message,
      timestamp: new Date(),
      details,
    };
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    data: UnifiedHouseModel[],
    metadata?: SuccessfulExtractionResult['metadata']
  ): SuccessfulExtractionResult {
    return {
      success: true,
      data,
      extractedCount: data.length,
      errorCount: 0,
      metadata,
    };
  }

  /**
   * Create a failed result
   */
  protected createFailedResult(
    data: UnifiedHouseModel[],
    errors: ExtractionError[],
    metadata?: FailedExtractionResult['metadata']
  ): FailedExtractionResult {
    return {
      success: false,
      data,
      extractedCount: data.length,
      errorCount: errors.length,
      errors,
      metadata,
    };
  }
}
