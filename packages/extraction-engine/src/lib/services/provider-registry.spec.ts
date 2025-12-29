import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProviderRegistry } from './provider-registry';
import type { DataProvider, ExtractionResult } from '../providers/base-provider';
import { PropertyType, ListingStatus } from '@house-finder/domain';

// Mock provider for testing
class MockProvider implements DataProvider {
  constructor(
    public readonly name: string,
    public readonly type: 'scraper' | 'api' = 'api'
  ) {}

  async extract(): Promise<ExtractionResult> {
    return {
      success: true,
      data: [
        {
          id: `${this.name}-1`,
          source: this.name,
          url: 'https://example.com/1',
          title: 'Test House',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test City', country: 'Test' },
          metadata: { extractedAt: new Date() },
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

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  describe('Registration', () => {
    it('should register a provider', () => {
      const provider = new MockProvider('test-provider');
      registry.register(provider);

      expect(registry.has('test-provider')).toBe(true);
    });

    it('should register multiple providers', () => {
      registry.register(new MockProvider('provider-1'));
      registry.register(new MockProvider('provider-2'));
      registry.register(new MockProvider('provider-3'));

      expect(registry.count()).toBe(3);
    });

    it('should throw error when registering duplicate provider', () => {
      const provider = new MockProvider('duplicate');
      registry.register(provider);

      expect(() => registry.register(provider)).toThrow('Provider duplicate already registered');
    });

    it('should allow replacing a provider', () => {
      const provider1 = new MockProvider('replaceable');
      const provider2 = new MockProvider('replaceable');

      registry.register(provider1);
      registry.register(provider2, { replace: true });

      expect(registry.get('replaceable')).toBe(provider2);
    });
  });

  describe('Retrieval', () => {
    it('should retrieve a registered provider', () => {
      const provider = new MockProvider('test');
      registry.register(provider);

      const retrieved = registry.get('test');
      expect(retrieved).toBe(provider);
    });

    it('should throw error when retrieving non-existent provider', () => {
      expect(() => registry.get('non-existent')).toThrow(
        'Provider non-existent not found'
      );
    });

    it('should return undefined with tryGet for non-existent provider', () => {
      const result = registry.tryGet('non-existent');
      expect(result).toBeUndefined();
    });

    it('should get all registered providers', () => {
      registry.register(new MockProvider('p1'));
      registry.register(new MockProvider('p2'));
      registry.register(new MockProvider('p3'));

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((p) => p.name)).toContain('p1');
      expect(all.map((p) => p.name)).toContain('p2');
      expect(all.map((p) => p.name)).toContain('p3');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      registry.register(new MockProvider('api-1', 'api'));
      registry.register(new MockProvider('api-2', 'api'));
      registry.register(new MockProvider('scraper-1', 'scraper'));
      registry.register(new MockProvider('scraper-2', 'scraper'));
    });

    it('should filter providers by type', () => {
      const apiProviders = registry.getByType('api');
      expect(apiProviders).toHaveLength(2);
      expect(apiProviders.every((p) => p.type === 'api')).toBe(true);
    });

    it('should get all scrapers', () => {
      const scrapers = registry.getByType('scraper');
      expect(scrapers).toHaveLength(2);
      expect(scrapers.every((p) => p.type === 'scraper')).toBe(true);
    });
  });

  describe('Removal', () => {
    it('should unregister a provider', () => {
      const provider = new MockProvider('removable');
      registry.register(provider);

      expect(registry.has('removable')).toBe(true);

      registry.unregister('removable');

      expect(registry.has('removable')).toBe(false);
    });

    it('should not throw when unregistering non-existent provider', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow();
    });

    it('should clear all providers', () => {
      registry.register(new MockProvider('p1'));
      registry.register(new MockProvider('p2'));
      registry.register(new MockProvider('p3'));

      expect(registry.count()).toBe(3);

      registry.clear();

      expect(registry.count()).toBe(0);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute all providers in parallel', async () => {
      registry.register(new MockProvider('provider-1'));
      registry.register(new MockProvider('provider-2'));
      registry.register(new MockProvider('provider-3'));

      const results = await registry.executeAll();

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should execute only API providers', async () => {
      registry.register(new MockProvider('api-1', 'api'));
      registry.register(new MockProvider('api-2', 'api'));
      registry.register(new MockProvider('scraper-1', 'scraper'));

      const results = await registry.executeAllOfType('api');

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should execute only scrapers', async () => {
      registry.register(new MockProvider('api-1', 'api'));
      registry.register(new MockProvider('scraper-1', 'scraper'));
      registry.register(new MockProvider('scraper-2', 'scraper'));

      const results = await registry.executeAllOfType('scraper');

      expect(results).toHaveLength(2);
    });

    it('should handle provider execution failures gracefully', async () => {
      class FailingProvider implements DataProvider {
        readonly name = 'failing';
        readonly type = 'api' as const;

        async extract(): Promise<ExtractionResult> {
          return {
            success: false,
            data: [],
            extractedCount: 0,
            errorCount: 1,
            errors: [
              {
                code: 'EXTRACTION_FAILED',
                message: 'Intentional failure',
                timestamp: new Date(),
              },
            ],
          };
        }

        async validateConfig(): Promise<boolean> {
          return true;
        }

        async healthCheck(): Promise<boolean> {
          return false;
        }
      }

      registry.register(new MockProvider('success'));
      registry.register(new FailingProvider());

      const results = await registry.executeAll();

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
    });
  });

  describe('Health Checks', () => {
    it('should check health of all providers', async () => {
      registry.register(new MockProvider('p1'));
      registry.register(new MockProvider('p2'));

      const health = await registry.healthCheckAll();

      expect(health).toHaveLength(2);
      expect(health.every((h) => h.healthy)).toBe(true);
    });

    it('should return health status with provider names', async () => {
      registry.register(new MockProvider('provider-1'));

      const health = await registry.healthCheckAll();

      expect(health[0]).toEqual({
        provider: 'provider-1',
        healthy: true,
      });
    });
  });

  describe('Metadata', () => {
    it('should list all provider names', () => {
      registry.register(new MockProvider('alpha'));
      registry.register(new MockProvider('beta'));
      registry.register(new MockProvider('gamma'));

      const names = registry.listNames();

      expect(names).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('should provide registry statistics', () => {
      registry.register(new MockProvider('api-1', 'api'));
      registry.register(new MockProvider('api-2', 'api'));
      registry.register(new MockProvider('scraper-1', 'scraper'));

      const stats = registry.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.api).toBe(2);
      expect(stats.byType.scraper).toBe(1);
    });
  });
});
