import axios, { type AxiosInstance } from 'axios';
import {
  BaseApiClient,
  type ExtractionResult,
  type SearchParams,
  type ProviderConfig,
  type ExtractionError,
} from './base-provider';
import {
  type UnifiedHouseModel,
  PropertyType,
  ListingStatus,
  createHouseModel,
} from '@house-finder/domain';

/**
 * Configuration for Zillow API Client
 */
export interface ZillowApiConfig extends ProviderConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Zillow API response types
 */
interface ZillowProperty {
  zpid: string;
  detailUrl: string;
  price: number;
  address: {
    streetAddress?: string;
    city: string;
    state?: string;
    zipcode?: string;
    country: string;
  };
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  homeType: string;
  homeStatus: string;
  description?: string;
  lotSize?: number;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  imgSrc?: string;
}

interface ZillowApiResponse {
  results: ZillowProperty[];
  totalResults: number;
}

/**
 * Zillow API Client implementation
 */
export class ZillowApiClient extends BaseApiClient {
  readonly name = 'zillow-api';
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: ZillowApiConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  async extract(params?: SearchParams): Promise<ExtractionResult> {
    const startTime = Date.now();
    const errors: ExtractionError[] = [];
    const houses: UnifiedHouseModel[] = [];

    try {
      // Build query parameters
      const queryParams = this.buildQueryParams(params);

      // Make API request
      const response = await this.axiosInstance.get<ZillowApiResponse>('/search', {
        params: queryParams,
        validateStatus: () => true, // Don't throw on any status code
      });

      // Handle error status codes
      if (response.status >= 400) {
        const duration = Date.now() - startTime;
        const errorCode = this.mapHttpErrorToCode(response.status);
        const errorMessage =
          (response.data as { error?: string })?.error ??
          `HTTP ${response.status}`;

        errors.push(
          this.createError(errorCode, errorMessage, {
            statusCode: response.status,
          })
        );

        return this.createFailedResult(houses, errors, { duration, apiCallsUsed: 1 });
      }

      // Handle malformed JSON responses
      if (typeof response.data !== 'object' || response.data === null || !('results' in response.data)) {
        const duration = Date.now() - startTime;
        errors.push(
          this.createError('PARSE_ERROR', 'Invalid response format')
        );
        return this.createFailedResult(houses, errors, { duration, apiCallsUsed: 1 });
      }

      // Transform response data to unified model
      for (const property of response.data.results) {
        try {
          const house = this.transformToUnifiedModel(property);
          houses.push(house);
        } catch (error) {
          errors.push(
            this.createError(
              'PARSE_ERROR',
              `Failed to transform property ${property.zpid}: ${error instanceof Error ? error.message : String(error)}`,
              { propertyId: property.zpid }
            )
          );
        }
      }

      const duration = Date.now() - startTime;
      const metadata = {
        duration,
        apiCallsUsed: 1,
      };

      if (errors.length > 0) {
        return this.createFailedResult(houses, errors, metadata);
      }

      return this.createSuccessResult(houses, metadata);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const errorCode = this.mapHttpErrorToCode(error.response?.status ?? 0);
        const errorMessage =
          (error.response?.data as { error?: string })?.error ??
          error.message;

        errors.push(
          this.createError(errorCode, errorMessage, {
            statusCode: error.response?.status,
            url: error.config?.url,
          })
        );
      } else {
        errors.push(
          this.createError(
            'UNKNOWN_ERROR',
            error instanceof Error ? error.message : 'Unknown error occurred'
          )
        );
      }

      return this.createFailedResult(houses, errors, { duration, apiCallsUsed: 1 });
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return false;
    }

    if (!this.baseUrl || this.baseUrl.trim() === '') {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', {
        validateStatus: () => true,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Build query parameters from search params
   */
  private buildQueryParams(params?: SearchParams): Record<string, string> {
    const query: Record<string, string> = {};

    if (params?.location?.city != null) {
      query.city = params.location.city;
    }

    if (params?.location?.state != null) {
      query.state = params.location.state;
    }

    if (params?.priceRange?.min != null) {
      query.minPrice = params.priceRange.min.toString();
    }

    if (params?.priceRange?.max != null) {
      query.maxPrice = params.priceRange.max.toString();
    }

    if (params?.limit != null) {
      query.limit = params.limit.toString();
    }

    return query;
  }

  /**
   * Transform Zillow property to unified house model
   */
  private transformToUnifiedModel(property: ZillowProperty): UnifiedHouseModel {
    const title = property.address.streetAddress
      ? `${property.address.streetAddress}, ${property.address.city}`
      : `Property in ${property.address.city}`;

    return createHouseModel({
      id: `zillow-${property.zpid}`,
      source: this.name,
      url: property.detailUrl,
      title,
      description: property.description,
      price: property.price,
      currency: 'USD',
      propertyType: this.mapPropertyType(property.homeType),
      status: this.mapListingStatus(property.homeStatus),
      location: {
        address: property.address.streetAddress,
        city: property.address.city,
        state: property.address.state,
        postalCode: property.address.zipcode,
        country: property.address.country,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      details: {
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        livingArea: property.livingArea,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
      },
      images: property.imgSrc != null
        ? [
            {
              url: property.imgSrc,
              order: 0,
            },
          ]
        : undefined,
      metadata: {
        extractedAt: new Date(),
        rawData: property,
      },
    });
  }

  /**
   * Map Zillow property type to unified property type
   */
  private mapPropertyType(homeType: string): PropertyType {
    const typeMap: Record<string, PropertyType> = {
      SINGLE_FAMILY: PropertyType.HOUSE,
      APARTMENT: PropertyType.APARTMENT,
      CONDO: PropertyType.CONDO,
      TOWNHOUSE: PropertyType.TOWNHOUSE,
      LAND: PropertyType.LAND,
      MULTI_FAMILY: PropertyType.MULTI_FAMILY,
    };

    return typeMap[homeType] ?? PropertyType.HOUSE;
  }

  /**
   * Map Zillow listing status to unified status
   */
  private mapListingStatus(homeStatus: string): ListingStatus {
    const statusMap: Record<string, ListingStatus> = {
      FOR_SALE: ListingStatus.ACTIVE,
      PENDING: ListingStatus.PENDING,
      SOLD: ListingStatus.SOLD,
      OFF_MARKET: ListingStatus.OFF_MARKET,
    };

    return statusMap[homeStatus] ?? ListingStatus.ACTIVE;
  }

  /**
   * Map HTTP error codes to extraction error codes
   */
  private mapHttpErrorToCode(statusCode: number): ExtractionError['code'] {
    if (statusCode === 429) return 'RATE_LIMIT_EXCEEDED';
    if (statusCode === 401 || statusCode === 403) return 'AUTHENTICATION_ERROR';
    if (statusCode >= 400 && statusCode < 500) return 'INVALID_RESPONSE';
    if (statusCode >= 500) return 'NETWORK_ERROR';
    return 'UNKNOWN_ERROR';
  }
}
