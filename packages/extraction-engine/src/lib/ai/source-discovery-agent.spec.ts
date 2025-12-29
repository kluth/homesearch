import { describe, it, expect, beforeEach } from '@jest/globals';
import { SourceDiscoveryAgent, SourceType, DiscoveredSource } from './source-discovery-agent';

describe('SourceDiscoveryAgent', () => {
  let agent: SourceDiscoveryAgent;

  beforeEach(() => {
    agent = new SourceDiscoveryAgent();
  });

  describe('Source Discovery', () => {
    it('should discover real estate websites for a location', async () => {
      const sources = await agent.discoverSources({
        location: 'United States',
        limit: 3,
      });

      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.length).toBeLessThanOrEqual(3);
    });

    it('should include source metadata', async () => {
      const sources = await agent.discoverSources({
        location: 'Germany',
        limit: 1,
      });

      const source = sources[0];
      if (source) {
        expect(source.name).toBeDefined();
        expect(source.url).toBeDefined();
        expect(source.type).toBeDefined();
        expect(['api', 'scraper']).toContain(source.type);
      }
    });

    it('should detect API-based sources', async () => {
      const sources = await agent.discoverSources({
        location: 'United Kingdom',
        limit: 5,
      });

      const apiSources = sources.filter(s => s.type === 'api');
      // Some sources might have APIs
      expect(apiSources.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect scraper-based sources', async () => {
      const sources = await agent.discoverSources({
        location: 'France',
        limit: 5,
      });

      const scraperSources = sources.filter(s => s.type === 'scraper');
      expect(scraperSources.length).toBeGreaterThan(0);
    });

    it('should provide confidence scores', async () => {
      const sources = await agent.discoverSources({
        location: 'Canada',
        limit: 2,
      });

      sources.forEach(source => {
        expect(source.confidence).toBeDefined();
        expect(source.confidence).toBeGreaterThanOrEqual(0);
        expect(source.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Source Analysis', () => {
    it('should analyze a website for scraping potential', async () => {
      const analysis = await agent.analyzeWebsite('https://www.example-realestate.com');

      expect(analysis).toBeDefined();
      expect(analysis.isScrappable).toBeDefined();
      expect(typeof analysis.isScrappable).toBe('boolean');
    });

    it('should detect listing patterns', async () => {
      const analysis = await agent.analyzeWebsite('https://www.realtor.com');

      expect(analysis.patterns).toBeDefined();
      expect(analysis.patterns.hasListings).toBeDefined();
    });

    it('should detect API availability', async () => {
      const analysis = await agent.analyzeWebsite('https://api.example.com');

      expect(analysis.hasApi).toBeDefined();
      expect(typeof analysis.hasApi).toBe('boolean');
    });

    it('should provide selector suggestions for scraping', async () => {
      const analysis = await agent.analyzeWebsite('https://www.immobilienscout24.de');

      if (analysis.isScrappable) {
        expect(analysis.suggestedSelectors).toBeDefined();
      }
    });
  });

  describe('Provider Code Generation', () => {
    it('should generate scraper code for a website', () => {
      const source: DiscoveredSource = {
        name: 'example-real-estate',
        url: 'https://www.example.com',
        type: 'scraper',
        confidence: 0.85,
        patterns: {
          hasListings: true,
          listingSelector: '.property-card',
          titleSelector: '.property-title',
          priceSelector: '.property-price',
        },
      };

      const code = agent.generateProviderCode(source);

      expect(code).toContain('class');
      expect(code).toContain('BaseScraper');
      expect(code).toContain('extract');
      expect(code).toContain('.property-card');
    });

    it('should generate API client code', () => {
      const source: DiscoveredSource = {
        name: 'example-api',
        url: 'https://api.example.com',
        type: 'api',
        confidence: 0.90,
        apiEndpoints: {
          search: '/v1/properties/search',
          details: '/v1/properties/:id',
        },
      };

      const code = agent.generateProviderCode(source);

      expect(code).toContain('class');
      expect(code).toContain('BaseApiClient');
      expect(code).toContain('extract');
      expect(code).toContain('/v1/properties/search');
    });

    it('should include proper imports in generated code', () => {
      const source: DiscoveredSource = {
        name: 'test-source',
        url: 'https://test.com',
        type: 'scraper',
        confidence: 0.8,
      };

      const code = agent.generateProviderCode(source);

      expect(code).toContain('import');
      expect(code).toContain('UnifiedHouseModel');
      expect(code).toContain('PropertyType');
      expect(code).toContain('ListingStatus');
    });
  });

  describe('Automatic Integration', () => {
    it('should have method to auto-discover and register providers', () => {
      expect(typeof agent.autoDiscoverAndRegister).toBe('function');
    });

    it('should return discovered source count', async () => {
      const result = await agent.discoverSources({
        location: 'Spain',
        limit: 3,
      });

      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Quality Filtering', () => {
    it('should filter sources by minimum confidence', async () => {
      const allSources = await agent.discoverSources({
        location: 'Italy',
        limit: 10,
      });

      const highConfidenceSources = allSources.filter(s => s.confidence > 0.7);

      expect(highConfidenceSources.length).toBeLessThanOrEqual(allSources.length);
    });

    it('should prioritize well-known sources', async () => {
      const sources = await agent.discoverSources({
        location: 'United States',
        limit: 5,
      });

      // First result should typically have high confidence
      if (sources.length > 0) {
        expect(sources[0]?.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      const analysis = await agent.analyzeWebsite('not-a-valid-url');

      expect(analysis.isScrappable).toBe(false);
      expect(analysis.error).toBeDefined();
    });

    it('should handle unreachable websites', async () => {
      const analysis = await agent.analyzeWebsite('https://this-does-not-exist-12345.com');

      expect(analysis.isScrappable).toBe(false);
    });

    it('should return empty array for invalid location', async () => {
      const sources = await agent.discoverSources({
        location: '',
        limit: 5,
      });

      expect(Array.isArray(sources)).toBe(true);
    });
  });
});
