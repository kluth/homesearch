import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SourceConfigManager, FetchPriority } from './source-config';
import { SourceType, SourceQuality, type DiscoveredSource } from './source-discovery-agent';

describe('SourceConfigManager', () => {
  let configManager: SourceConfigManager;
  let testConfigPath: string;

  beforeEach(() => {
    testConfigPath = path.join(process.cwd(), '.house-finder-test', 'test-config.json');
    configManager = new SourceConfigManager(testConfigPath);
  });

  afterEach(async () => {
    // Clean up test config
    try {
      await fs.unlink(testConfigPath);
      await fs.rmdir(path.dirname(testConfigPath));
    } catch {
      // Ignore errors
    }
  });

  describe('Configuration Loading', () => {
    it('should create default configuration if file does not exist', async () => {
      const config = await configManager.load();

      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
      expect(config.sources).toEqual([]);
      expect(config.abbreviations).toBeDefined();
    });

    it('should load existing configuration from disk', async () => {
      // Save initial config
      const initialConfig = await configManager.load();
      initialConfig.sources.push({
        name: 'test-source',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.9,
      });
      await configManager.save(initialConfig);

      // Create new manager and load
      const newManager = new SourceConfigManager(testConfigPath);
      const loadedConfig = await newManager.load();

      expect(loadedConfig.sources).toHaveLength(1);
      expect(loadedConfig.sources[0]?.name).toBe('test-source');
    });
  });

  describe('Source Management', () => {
    it('should add new source to configuration', async () => {
      const newSource: DiscoveredSource = {
        name: 'zillow',
        url: 'https://www.zillow.com',
        type: SourceType.API,
        confidence: 0.95,
        language: 'en',
      };

      await configManager.addSource(newSource);
      const sources = await configManager.getSources();

      expect(sources).toHaveLength(1);
      expect(sources[0]?.name).toBe('zillow');
    });

    it('should update existing source', async () => {
      const source: DiscoveredSource = {
        name: 'test',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.7,
        estimatedFields: ['price', 'title'],
      };

      await configManager.addSource(source);

      // Update with more fields
      const updatedSource: DiscoveredSource = {
        name: 'test',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.8,
        estimatedFields: ['price', 'title', 'bedrooms', 'bathrooms'],
      };

      await configManager.addSource(updatedSource);
      const sources = await configManager.getSources();

      expect(sources).toHaveLength(1);
      expect(sources[0]?.estimatedFields).toHaveLength(4);
      expect(sources[0]?.confidence).toBe(0.8);
    });

    it('should merge sources intelligently', async () => {
      const source1: DiscoveredSource = {
        name: 'test',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.7,
        supportedLanguages: ['en'],
        estimatedFields: ['price', 'title'],
      };

      await configManager.addSource(source1);

      const source2: DiscoveredSource = {
        name: 'test',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.6, // Lower confidence
        supportedLanguages: ['en', 'de'], // Additional language
        estimatedFields: ['bedrooms'], // Additional field
      };

      await configManager.addSource(source2);
      const sources = await configManager.getSources();

      expect(sources).toHaveLength(1);
      expect(sources[0]?.confidence).toBe(0.7); // Keeps higher confidence
      expect(sources[0]?.supportedLanguages).toContain('en');
      expect(sources[0]?.supportedLanguages).toContain('de'); // Merged
      expect(sources[0]?.estimatedFields).toHaveLength(3); // Merged fields
    });
  });

  describe('Location Mappings', () => {
    it('should add location mapping', async () => {
      await configManager.addLocationMapping('germany', ['immoscout24', 'immowelt']);

      const config = await configManager.load();

      expect(config.locationMappings.germany).toEqual(['immoscout24', 'immowelt']);
    });

    it('should store abbreviations', async () => {
      await configManager.addAbbreviation('de', 'germany');

      const config = await configManager.load();

      expect(config.abbreviations.de).toBe('germany');
    });
  });

  describe('Fetch Scheduling', () => {
    it('should assign CRITICAL priority to excellent sources', () => {
      const excellentSource: DiscoveredSource = {
        name: 'zillow',
        url: 'https://zillow.com',
        type: SourceType.API,
        confidence: 0.95,
        quality: {
          grade: SourceQuality.EXCELLENT,
          score: 95,
          dataRichness: 95,
          reliability: 95,
          coverage: 95,
          performance: 90,
          reasonsForGrade: ['Excellent source'],
        },
      };

      const schedules = configManager.getFetchSchedules([excellentSource]);

      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.priority).toBe(FetchPriority.CRITICAL);
      expect(schedules[0]?.intervalMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should assign HIGH priority to good sources', () => {
      const goodSource: DiscoveredSource = {
        name: 'realtor',
        url: 'https://realtor.com',
        type: SourceType.SCRAPER,
        confidence: 0.85,
        quality: {
          grade: SourceQuality.GOOD,
          score: 80,
          dataRichness: 80,
          reliability: 80,
          coverage: 80,
          performance: 75,
          reasonsForGrade: ['Good source'],
        },
      };

      const schedules = configManager.getFetchSchedules([goodSource]);

      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.priority).toBe(FetchPriority.HIGH);
      expect(schedules[0]?.intervalMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should assign MEDIUM priority to fair sources', () => {
      const fairSource: DiscoveredSource = {
        name: 'medium-source',
        url: 'https://medium.com',
        type: SourceType.SCRAPER,
        confidence: 0.65,
        quality: {
          grade: SourceQuality.FAIR,
          score: 65,
          dataRichness: 65,
          reliability: 65,
          coverage: 65,
          performance: 60,
          reasonsForGrade: ['Fair source'],
        },
      };

      const schedules = configManager.getFetchSchedules([fairSource]);

      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.priority).toBe(FetchPriority.MEDIUM);
      expect(schedules[0]?.intervalMs).toBe(30 * 60 * 1000); // 30 minutes
    });

    it('should assign LOW priority to poor sources', () => {
      const poorSource: DiscoveredSource = {
        name: 'poor-source',
        url: 'https://poor.com',
        type: SourceType.SCRAPER,
        confidence: 0.45,
        quality: {
          grade: SourceQuality.POOR,
          score: 45,
          dataRichness: 45,
          reliability: 45,
          coverage: 45,
          performance: 40,
          reasonsForGrade: ['Limited data'],
        },
      };

      const schedules = configManager.getFetchSchedules([poorSource]);

      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.priority).toBe(FetchPriority.LOW);
      expect(schedules[0]?.intervalMs).toBe(60 * 60 * 1000); // 60 minutes
    });

    it('should create schedules for multiple sources with different priorities', () => {
      const sources: DiscoveredSource[] = [
        {
          name: 'excellent',
          url: 'https://excellent.com',
          type: SourceType.API,
          confidence: 0.95,
          quality: { grade: SourceQuality.EXCELLENT, score: 95 } as any,
        },
        {
          name: 'good',
          url: 'https://good.com',
          type: SourceType.SCRAPER,
          confidence: 0.80,
          quality: { grade: SourceQuality.GOOD, score: 80 } as any,
        },
        {
          name: 'poor',
          url: 'https://poor.com',
          type: SourceType.SCRAPER,
          confidence: 0.50,
          quality: { grade: SourceQuality.POOR, score: 50 } as any,
        },
      ];

      const schedules = configManager.getFetchSchedules(sources);

      expect(schedules).toHaveLength(3);

      // Verify different intervals for different priorities
      const intervals = schedules.map((s) => s.intervalMs);
      expect(new Set(intervals).size).toBe(3); // All different
    });
  });

  describe('Persistence', () => {
    it('should persist configuration to disk', async () => {
      const source: DiscoveredSource = {
        name: 'persistent',
        url: 'https://persistent.com',
        type: SourceType.API,
        confidence: 0.9,
      };

      await configManager.addSource(source);

      // Verify file exists
      const stats = await fs.stat(testConfigPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should update lastUpdated timestamp on save', async () => {
      const config1 = await configManager.load();
      const timestamp1 = config1.lastUpdated;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await configManager.addSource({
        name: 'test',
        url: 'https://test.com',
        type: SourceType.SCRAPER,
        confidence: 0.8,
      });

      const config2 = await configManager.load();
      const timestamp2 = config2.lastUpdated;

      expect(timestamp2).not.toBe(timestamp1);
    });
  });
});
