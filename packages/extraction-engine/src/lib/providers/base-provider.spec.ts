import { describe, it, expect, jest } from '@jest/globals';
import type { DataProvider, ExtractionResult, ExtractionError } from './base-provider';
import { PropertyType, ListingStatus } from '@house-finder/domain';

// Mock provider implementation for testing
class MockSuccessfulProvider implements DataProvider {
  readonly name = 'mock-success';
  readonly type = 'scraper' as const;

  async extract(): Promise<ExtractionResult> {
    return {
      success: true,
      data: [
        {
          id: 'mock-1',
          source: 'mock-success',
          url: 'https://example.com/1',
          title: 'Mock House',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: {
            city: 'Test City',
            country: 'Test Country',
          },
          metadata: {
            extractedAt: new Date(),
          },
        },
      ],
      extractedCount: 1,
      errorCount: 0,
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

class MockFailingProvider implements DataProvider {
  readonly name = 'mock-fail';
  readonly type = 'api' as const;

  async extract(): Promise<ExtractionResult> {
    const error: ExtractionError = {
      code: 'EXTRACTION_FAILED',
      message: 'Mock extraction failed',
      timestamp: new Date(),
    };

    return {
      success: false,
      data: [],
      extractedCount: 0,
      errorCount: 1,
      errors: [error],
    };
  }

  async validateConfig(): Promise<boolean> {
    return false;
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}

describe('DataProvider Interface', () => {
  describe('MockSuccessfulProvider', () => {
    it('should successfully extract data', async () => {
      const provider = new MockSuccessfulProvider();
      const result = await provider.extract();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.extractedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toBeUndefined();
    });

    it('should return valid house model data', async () => {
      const provider = new MockSuccessfulProvider();
      const result = await provider.extract();

      if (!result.success) {
        throw new Error('Expected successful result');
      }

      const house = result.data[0];
      expect(house).toBeDefined();
      expect(house.id).toBe('mock-1');
      expect(house.source).toBe('mock-success');
      expect(house.title).toBe('Mock House');
      expect(house.price).toBe(100000);
    });

    it('should pass config validation', async () => {
      const provider = new MockSuccessfulProvider();
      const isValid = await provider.validateConfig();

      expect(isValid).toBe(true);
    });

    it('should pass health check', async () => {
      const provider = new MockSuccessfulProvider();
      const isHealthy = await provider.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should have correct provider metadata', () => {
      const provider = new MockSuccessfulProvider();

      expect(provider.name).toBe('mock-success');
      expect(provider.type).toBe('scraper');
    });
  });

  describe('MockFailingProvider', () => {
    it('should fail extraction gracefully', async () => {
      const provider = new MockFailingProvider();
      const result = await provider.extract();

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.extractedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
    });

    it('should return error details', async () => {
      const provider = new MockFailingProvider();
      const result = await provider.extract();

      if (result.success) {
        throw new Error('Expected failed result');
      }

      const error = result.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.code).toBe('EXTRACTION_FAILED');
      expect(error?.message).toBe('Mock extraction failed');
      expect(error?.timestamp).toBeInstanceOf(Date);
    });

    it('should fail config validation', async () => {
      const provider = new MockFailingProvider();
      const isValid = await provider.validateConfig();

      expect(isValid).toBe(false);
    });

    it('should fail health check', async () => {
      const provider = new MockFailingProvider();
      const isHealthy = await provider.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});
