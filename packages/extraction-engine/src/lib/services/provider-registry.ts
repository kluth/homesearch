import type { DataProvider, ExtractionResult, SearchParams } from '../providers/base-provider';

/**
 * Options for provider registration
 */
export interface RegistrationOptions {
  /**
   * If true, replace existing provider with same name
   */
  replace?: boolean;
}

/**
 * Health check result for a provider
 */
export interface ProviderHealthStatus {
  provider: string;
  healthy: boolean;
  error?: string;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  total: number;
  byType: {
    api: number;
    scraper: number;
  };
}

/**
 * Provider Registry
 * Manages all data providers and provides unified access
 */
export class ProviderRegistry {
  private providers: Map<string, DataProvider> = new Map();

  /**
   * Register a new provider
   */
  public register(provider: DataProvider, options: RegistrationOptions = {}): void {
    if (this.providers.has(provider.name) && !options.replace) {
      throw new Error(`Provider ${provider.name} already registered`);
    }

    this.providers.set(provider.name, provider);
  }

  /**
   * Unregister a provider
   */
  public unregister(name: string): void {
    this.providers.delete(name);
  }

  /**
   * Check if a provider is registered
   */
  public has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get a provider by name (throws if not found)
   */
  public get(name: string): DataProvider {
    const provider = this.providers.get(name);
    if (provider === undefined) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }

  /**
   * Try to get a provider by name (returns undefined if not found)
   */
  public tryGet(name: string): DataProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  public getAll(): DataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  public getByType(type: 'scraper' | 'api'): DataProvider[] {
    return this.getAll().filter((p) => p.type === type);
  }

  /**
   * Get count of registered providers
   */
  public count(): number {
    return this.providers.size;
  }

  /**
   * Clear all providers
   */
  public clear(): void {
    this.providers.clear();
  }

  /**
   * List all provider names
   */
  public listNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Execute all providers in parallel
   */
  public async executeAll(params?: SearchParams): Promise<ExtractionResult[]> {
    const providers = this.getAll();
    const promises = providers.map((p) => p.extract(params));
    return Promise.all(promises);
  }

  /**
   * Execute all providers of a specific type
   */
  public async executeAllOfType(
    type: 'scraper' | 'api',
    params?: SearchParams
  ): Promise<ExtractionResult[]> {
    const providers = this.getByType(type);
    const promises = providers.map((p) => p.extract(params));
    return Promise.all(promises);
  }

  /**
   * Execute specific providers by name
   */
  public async execute(
    providerNames: string[],
    params?: SearchParams
  ): Promise<ExtractionResult[]> {
    const providers = providerNames.map((name) => this.get(name));
    const promises = providers.map((p) => p.extract(params));
    return Promise.all(promises);
  }

  /**
   * Health check all providers
   */
  public async healthCheckAll(): Promise<ProviderHealthStatus[]> {
    const providers = this.getAll();
    const results = await Promise.allSettled(
      providers.map(async (p) => ({
        provider: p.name,
        healthy: await p.healthCheck(),
      }))
    );

    return results.map((result, index) => {
      const providerName = providers[index]?.name ?? 'unknown';
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: providerName,
          healthy: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });
  }

  /**
   * Get registry statistics
   */
  public getStats(): RegistryStats {
    const all = this.getAll();
    return {
      total: all.length,
      byType: {
        api: all.filter((p) => p.type === 'api').length,
        scraper: all.filter((p) => p.type === 'scraper').length,
      },
    };
  }

  /**
   * Validate configuration of all providers
   */
  public async validateAll(): Promise<Map<string, boolean>> {
    const providers = this.getAll();
    const results = await Promise.all(
      providers.map(async (p) => ({
        name: p.name,
        valid: await p.validateConfig(),
      }))
    );

    return new Map(results.map((r) => [r.name, r.valid]));
  }
}
