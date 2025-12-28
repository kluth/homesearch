import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { ZillowApiClient } from './zillow-api-client';
import { PropertyType, ListingStatus } from '@house-finder/domain';

describe('ZillowApiClient', () => {
  const API_KEY = 'test-api-key';
  const BASE_URL = 'https://api.zillow-mock.com';

  let client: ZillowApiClient;

  beforeEach(() => {
    client = new ZillowApiClient({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(client.name).toBe('zillow-api');
      expect(client.type).toBe('api');
    });

    it('should validate valid configuration', async () => {
      const isValid = await client.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidClient = new ZillowApiClient({
        apiKey: '',
        baseUrl: BASE_URL,
      });

      const isValid = await invalidClient.validateConfig();
      expect(isValid).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should pass health check when API is accessible', async () => {
      nock(BASE_URL)
        .get('/health')
        .reply(200, { status: 'ok' });

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should fail health check when API is not accessible', async () => {
      nock(BASE_URL)
        .get('/health')
        .reply(500);

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should fail health check on network error', async () => {
      nock(BASE_URL)
        .get('/health')
        .replyWithError('Network error');

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Data Extraction', () => {
    it('should successfully extract and transform data', async () => {
      const mockApiResponse = {
        results: [
          {
            zpid: '12345',
            detailUrl: 'https://www.zillow.com/homedetails/12345',
            price: 450000,
            address: {
              streetAddress: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zipcode: '94102',
              country: 'USA',
            },
            bedrooms: 3,
            bathrooms: 2,
            livingArea: 1500,
            homeType: 'SINGLE_FAMILY',
            homeStatus: 'FOR_SALE',
            description: 'Beautiful home in SF',
            lotSize: 3000,
            yearBuilt: 2010,
            latitude: 37.7749,
            longitude: -122.4194,
            imgSrc: 'https://photos.zillow.com/1.jpg',
          },
        ],
        totalResults: 1,
      };

      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, mockApiResponse);

      const result = await client.extract({
        location: { city: 'San Francisco', state: 'CA' },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toHaveLength(1);
      expect(result.extractedCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const house = result.data[0];
      expect(house.id).toBe('zillow-12345');
      expect(house.source).toBe('zillow-api');
      expect(house.title).toContain('123 Main St');
      expect(house.price).toBe(450000);
      expect(house.currency).toBe('USD');
      expect(house.propertyType).toBe(PropertyType.HOUSE);
      expect(house.status).toBe(ListingStatus.ACTIVE);
      expect(house.location.city).toBe('San Francisco');
      expect(house.location.state).toBe('CA');
      expect(house.details?.bedrooms).toBe(3);
      expect(house.details?.bathrooms).toBe(2);
      expect(house.details?.livingArea).toBe(1500);
    });

    it('should handle empty results', async () => {
      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, { results: [], totalResults: 0 });

      const result = await client.extract();

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toHaveLength(0);
      expect(result.extractedCount).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(500, { error: 'Internal Server Error' });

      const result = await client.extract();

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.data).toHaveLength(0);
      expect(result.errorCount).toBe(1);
      expect(result.errors?.[0]?.code).toBe('NETWORK_ERROR');
    });

    it('should handle rate limiting', async () => {
      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(429, { error: 'Too Many Requests' });

      const result = await client.extract();

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.errors?.[0]?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle malformed responses', async () => {
      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, 'Invalid JSON');

      const result = await client.extract();

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.errors?.[0]?.code).toBe('PARSE_ERROR');
    });

    it('should respect search parameters', async () => {
      const mockResponse = {
        results: [],
        totalResults: 0,
      };

      const scope = nock(BASE_URL)
        .get('/search')
        .query({
          city: 'New York',
          state: 'NY',
          minPrice: '100000',
          maxPrice: '500000',
          limit: '10',
        })
        .reply(200, mockResponse);

      await client.extract({
        location: { city: 'New York', state: 'NY' },
        priceRange: { min: 100000, max: 500000 },
        limit: 10,
      });

      expect(scope.isDone()).toBe(true);
    });

    it('should include API metadata in results', async () => {
      const mockResponse = {
        results: [
          {
            zpid: '99999',
            detailUrl: 'https://www.zillow.com/homedetails/99999',
            price: 300000,
            address: {
              city: 'Austin',
              state: 'TX',
              country: 'USA',
            },
            homeType: 'CONDO',
            homeStatus: 'FOR_SALE',
          },
        ],
        totalResults: 1,
      };

      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.extract();

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.apiCallsUsed).toBe(1);
      expect(typeof result.metadata?.duration).toBe('number');
    });
  });

  describe('Property Type Mapping', () => {
    it('should map SINGLE_FAMILY to HOUSE', async () => {
      const mockResponse = {
        results: [
          {
            zpid: '1',
            detailUrl: 'https://www.zillow.com/1',
            price: 100000,
            address: { city: 'Test', country: 'USA' },
            homeType: 'SINGLE_FAMILY',
            homeStatus: 'FOR_SALE',
          },
        ],
        totalResults: 1,
      };

      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.extract();
      if (!result.success) return;

      expect(result.data[0]?.propertyType).toBe(PropertyType.HOUSE);
    });

    it('should map APARTMENT to APARTMENT', async () => {
      const mockResponse = {
        results: [
          {
            zpid: '2',
            detailUrl: 'https://www.zillow.com/2',
            price: 200000,
            address: { city: 'Test', country: 'USA' },
            homeType: 'APARTMENT',
            homeStatus: 'FOR_SALE',
          },
        ],
        totalResults: 1,
      };

      nock(BASE_URL)
        .get('/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.extract();
      if (!result.success) return;

      expect(result.data[0]?.propertyType).toBe(PropertyType.APARTMENT);
    });
  });
});
