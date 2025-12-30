/**
 * Complete Workflow Example
 * Demonstrates the full House Finder extraction pipeline
 */

import { ZillowApiClient } from '../providers/zillow-api-client.js';
import { Immoscout24Scraper } from '../providers/immoscout24-scraper.js';
import { DataTransformerService } from '../services/data-transformer.js';
import { ProviderRegistry } from '../services/provider-registry.js';
import { CircuitBreaker } from '../services/circuit-breaker.js';

/**
 * Example 1: Basic Provider Usage
 */
export async function example1BasicProviderUsage(): Promise<void> {
  console.log('=== Example 1: Basic Provider Usage ===\n');

  // Initialize Zillow API client
  const zillowClient = new ZillowApiClient({
    apiKey: 'your-api-key-here',
    baseUrl: 'https://api.zillow-mock.com',
  });

  // Extract data from Zillow
  const result = await zillowClient.extract({
    location: { city: 'San Francisco', state: 'CA' },
    priceRange: { min: 400000, max: 1000000 },
    limit: 10,
  });

  if (result.success) {
    console.log(`✓ Extracted ${result.extractedCount} properties from Zillow`);
    console.log(`  First property: ${result.data[0]?.title}`);
  } else {
    console.log(`✗ Extraction failed: ${result.errors?.[0]?.message}`);
  }

  console.log();
}

/**
 * Example 2: Web Scraping with Playwright
 */
export async function example2WebScraping(): Promise<void> {
  console.log('=== Example 2: Web Scraping with Playwright ===\n');

  // Initialize Immoscout24 scraper
  const immoscoutScraper = new Immoscout24Scraper({
    baseUrl: 'https://www.immobilienscout24.de',
    headless: true,
    timeout: 30000,
  });

  try {
    // Scrape German properties
    const result = await immoscoutScraper.extract({
      location: { city: 'München' },
      priceRange: { min: 300000, max: 800000 },
    });

    if (result.success) {
      console.log(`✓ Scraped ${result.extractedCount} properties from Immoscout24`);
      console.log(`  Duration: ${result.metadata?.duration}ms`);

      result.data.forEach((house, i) => {
        console.log(`  ${i + 1}. ${house.title} - €${house.price.toLocaleString()}`);
      });
    }
  } finally {
    await immoscoutScraper.cleanup();
  }

  console.log();
}

/**
 * Example 3: Multi-Source Data Collection
 */
export async function example3MultiSourceCollection(): Promise<void> {
  console.log('=== Example 3: Multi-Source Data Collection ===\n');

  // Create provider registry
  const registry = new ProviderRegistry();

  // Register multiple providers
  registry.register(
    new ZillowApiClient({
      apiKey: 'zillow-key',
      baseUrl: 'https://api.zillow-mock.com',
    })
  );

  registry.register(
    new Immoscout24Scraper({
      baseUrl: 'https://www.immobilienscout24.de',
      headless: true,
    })
  );

  console.log(`Registered ${registry.count()} providers:`);
  console.log(`  API clients: ${registry.getByType('api').length}`);
  console.log(`  Web scrapers: ${registry.getByType('scraper').length}`);

  // Execute all providers in parallel
  console.log('\nExecuting all providers...');
  const results = await registry.executeAll({
    priceRange: { min: 300000, max: 800000 },
  });

  console.log(`\nResults:`);
  results.forEach((result, i) => {
    console.log(`  Provider ${i + 1}: ${result.extractedCount} properties extracted`);
  });

  console.log();
}

/**
 * Example 4: Data Transformation and Deduplication
 */
export async function example4DataTransformation(): Promise<void> {
  console.log('=== Example 4: Data Transformation and Deduplication ===\n');

  // Collect data from multiple sources
  const registry = new ProviderRegistry();
  registry.register(
    new ZillowApiClient({
      apiKey: 'key',
      baseUrl: 'https://api.zillow-mock.com',
    })
  );
  registry.register(
    new Immoscout24Scraper({
      baseUrl: 'https://www.immobilienscout24.de',
      headless: true,
    })
  );

  const results = await registry.executeAll();

  // Combine all data
  const allHouses = results.flatMap((r) => r.data);
  console.log(`Total properties before transformation: ${allHouses.length}`);

  // Transform and deduplicate
  const transformer = new DataTransformerService();
  const cleanHouses = transformer.transform(allHouses);

  console.log(`After deduplication: ${cleanHouses.length}`);
  console.log(`\nTop 3 properties by confidence:`);
  cleanHouses.slice(0, 3).forEach((house, i) => {
    console.log(
      `  ${i + 1}. ${house.title} (confidence: ${(house.metadata.confidence ?? 0).toFixed(2)})`
    );
  });

  console.log();
}

/**
 * Example 5: Circuit Breaker for Resilience
 */
export async function example5CircuitBreaker(): Promise<void> {
  console.log('=== Example 5: Circuit Breaker for Resilience ===\n');

  // Create circuit breaker
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 5000,
    successThreshold: 2,
  });

  // Simulate flaky API
  let callCount = 0;
  const flakyApiCall = async (): Promise<string> => {
    callCount++;
    if (callCount <= 3) {
      throw new Error('API temporarily unavailable');
    }
    return 'Success';
  };

  console.log('Calling flaky API through circuit breaker...\n');

  // Make calls
  for (let i = 1; i <= 6; i++) {
    try {
      const result = await breaker.execute(flakyApiCall);
      console.log(`Call ${i}: ${result} (state: ${breaker.getState()})`);
    } catch (error) {
      console.log(
        `Call ${i}: Failed - ${error instanceof Error ? error.message : 'Unknown error'} (state: ${breaker.getState()})`
      );
    }
  }

  const stats = breaker.getStats();
  console.log(`\nCircuit breaker stats:`);
  console.log(`  Successes: ${stats.successes}`);
  console.log(`  Failures: ${stats.failures}`);
  console.log(`  Rejections: ${stats.rejections}`);

  console.log();
}

/**
 * Example 6: Complete Pipeline (Production-Ready)
 */
export async function example6CompletePipeline(): Promise<void> {
  console.log('=== Example 6: Complete Production Pipeline ===\n');

  // 1. Setup providers with circuit breakers
  const registry = new ProviderRegistry();

  const zillowBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
  });

  const zillow = new ZillowApiClient({
    apiKey: process.env.ZILLOW_API_KEY ?? 'mock-key',
    baseUrl: process.env.ZILLOW_API_URL ?? 'https://api.zillow-mock.com',
  });

  registry.register(zillow);

  // 2. Health check all providers
  console.log('Running health checks...');
  const healthStatuses = await registry.healthCheckAll();
  healthStatuses.forEach((status) => {
    console.log(`  ${status.provider}: ${status.healthy ? '✓ Healthy' : '✗ Unhealthy'}`);
  });

  // 3. Execute with circuit breaker protection
  console.log('\nExecuting extraction...');
  const results = await Promise.all(
    registry.getAll().map(async (provider) => {
      try {
        return await zillowBreaker.execute(() =>
          provider.extract({
            location: { city: 'Boston', state: 'MA' },
            priceRange: { min: 500000, max: 1500000 },
          })
        );
      } catch (error) {
        console.log(`  ${provider.name} protected by circuit breaker`);
        return {
          success: false,
          data: [],
          extractedCount: 0,
          errorCount: 1,
        } as const;
      }
    })
  );

  // 4. Transform and deduplicate
  const transformer = new DataTransformerService();
  const allHouses = results.flatMap((r) => r.data);
  const cleanHouses = transformer.transform(allHouses);

  console.log(`\nPipeline complete:`);
  console.log(`  Raw properties: ${allHouses.length}`);
  console.log(`  After deduplication: ${cleanHouses.length}`);
  console.log(`  Average confidence: ${(cleanHouses.reduce((sum, h) => sum + (h.metadata.confidence ?? 0), 0) / cleanHouses.length).toFixed(2)}`);

  console.log();
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  House Finder - Complete Workflow Examples              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Note: These are examples showing the API usage
  // In a real scenario, you would have actual API keys and endpoints

  console.log('Note: These examples demonstrate the architecture.');
  console.log('Replace mock data with real API keys for production use.\n');
}
