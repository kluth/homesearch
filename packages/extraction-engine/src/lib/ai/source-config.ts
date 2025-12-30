import * as fs from 'fs/promises';
import * as path from 'path';
import type { DiscoveredSource } from './source-discovery-agent.js';

/**
 * Persistent configuration for discovered sources
 */
export interface SourceConfiguration {
  version: string;
  lastUpdated: string;
  sources: DiscoveredSource[];
  locationMappings: Record<string, string[]>; // Learned location -> source mappings
  languageMappings: Record<string, string>; // Learned location -> language mappings
  abbreviations: Record<string, string>; // Learned abbreviations -> full names
}

/**
 * Fetch priority based on quality
 */
export enum FetchPriority {
  CRITICAL = 'CRITICAL', // Excellent sources - fetch every 5 minutes
  HIGH = 'HIGH', // Good sources - fetch every 15 minutes
  MEDIUM = 'MEDIUM', // Fair sources - fetch every 30 minutes
  LOW = 'LOW', // Poor sources - fetch every 60 minutes
}

/**
 * Fetch schedule for a source
 */
export interface FetchSchedule {
  sourceId: string;
  priority: FetchPriority;
  intervalMs: number;
  lastFetched?: Date;
  nextFetch?: Date;
  successRate: number; // 0-1
}

/**
 * Manages persistent source configuration
 */
export class SourceConfigManager {
  private configPath: string;
  private config: SourceConfiguration | null = null;

  constructor(configPath?: string) {
    this.configPath =
      configPath ?? path.join(process.cwd(), '.house-finder', 'sources-config.json');
  }

  /**
   * Load configuration from disk
   */
  public async load(): Promise<SourceConfiguration> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(data) as SourceConfiguration;
      return this.config;
    } catch (error) {
      // Config doesn't exist yet, create default
      this.config = this.createDefaultConfig();
      return this.config;
    }
  }

  /**
   * Save configuration to disk
   */
  public async save(config: SourceConfiguration): Promise<void> {
    this.config = config;
    this.config.lastUpdated = new Date().toISOString();

    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });

    // Write config
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Add or update a source in configuration
   */
  public async addSource(source: DiscoveredSource): Promise<void> {
    if (this.config === null) {
      await this.load();
    }

    if (this.config === null) {
      throw new Error('Failed to load configuration');
    }

    // Check if source already exists
    const existingIndex = this.config.sources.findIndex((s) => s.name === source.name);

    if (existingIndex >= 0) {
      // Update existing source (merge new information)
      this.config.sources[existingIndex] = this.mergeSources(
        this.config.sources[existingIndex]!,
        source
      );
    } else {
      // Add new source
      this.config.sources.push(source);
    }

    await this.save(this.config);
  }

  /**
   * Add learned location mapping
   */
  public async addLocationMapping(location: string, sources: string[]): Promise<void> {
    if (this.config === null) {
      await this.load();
    }

    if (this.config === null) {
      throw new Error('Failed to load configuration');
    }

    this.config.locationMappings[location.toLowerCase()] = sources;
    await this.save(this.config);
  }

  /**
   * Add learned abbreviation
   */
  public async addAbbreviation(abbrev: string, fullName: string): Promise<void> {
    if (this.config === null) {
      await this.load();
    }

    if (this.config === null) {
      throw new Error('Failed to load configuration');
    }

    this.config.abbreviations[abbrev.toLowerCase()] = fullName.toLowerCase();
    await this.save(this.config);
  }

  /**
   * Get all sources
   */
  public async getSources(): Promise<DiscoveredSource[]> {
    if (this.config === null) {
      await this.load();
    }

    return this.config?.sources ?? [];
  }

  /**
   * Get fetch schedule for all sources
   */
  public getFetchSchedules(sources: DiscoveredSource[]): FetchSchedule[] {
    return sources.map((source) => {
      const priority = this.determineFetchPriority(source);
      const intervalMs = this.getIntervalForPriority(priority);

      return {
        sourceId: source.name,
        priority,
        intervalMs,
        successRate: source.confidence,
      };
    });
  }

  /**
   * Determine fetch priority based on quality grade
   */
  private determineFetchPriority(source: DiscoveredSource): FetchPriority {
    const score = source.quality?.score ?? source.confidence * 100;

    if (score >= 90) return FetchPriority.CRITICAL;
    if (score >= 75) return FetchPriority.HIGH;
    if (score >= 60) return FetchPriority.MEDIUM;
    return FetchPriority.LOW;
  }

  /**
   * Get fetch interval in milliseconds for priority
   */
  private getIntervalForPriority(priority: FetchPriority): number {
    const intervals: Record<FetchPriority, number> = {
      [FetchPriority.CRITICAL]: 5 * 60 * 1000, // 5 minutes
      [FetchPriority.HIGH]: 15 * 60 * 1000, // 15 minutes
      [FetchPriority.MEDIUM]: 30 * 60 * 1000, // 30 minutes
      [FetchPriority.LOW]: 60 * 60 * 1000, // 60 minutes
    };

    return intervals[priority];
  }

  /**
   * Merge two sources, keeping the best information from both
   */
  private mergeSources(existing: DiscoveredSource, newSource: DiscoveredSource): DiscoveredSource {
    return {
      ...existing,
      ...newSource,
      // Take higher confidence
      confidence: Math.max(existing.confidence, newSource.confidence),
      // Merge languages
      supportedLanguages: [
        ...new Set([...(existing.supportedLanguages ?? []), ...(newSource.supportedLanguages ?? [])]),
      ],
      // Merge estimated fields
      estimatedFields: [
        ...new Set([...(existing.estimatedFields ?? []), ...(newSource.estimatedFields ?? [])]),
      ],
      // Merge patterns
      patterns: {
        ...existing.patterns,
        ...newSource.patterns,
      },
      // Merge API endpoints
      apiEndpoints: {
        ...existing.apiEndpoints,
        ...newSource.apiEndpoints,
      },
      // Use better quality metrics
      quality:
        (newSource.quality?.score ?? 0) > (existing.quality?.score ?? 0)
          ? newSource.quality
          : existing.quality,
    };
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): SourceConfiguration {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      sources: [],
      locationMappings: {},
      languageMappings: {},
      abbreviations: {
        // Common country abbreviations
        us: 'united states',
        usa: 'united states',
        uk: 'united kingdom',
        gb: 'united kingdom',
        de: 'germany',
        fr: 'france',
        es: 'spain',
        it: 'italy',
        ca: 'canada',
        au: 'australia',
        nz: 'new zealand',
        nl: 'netherlands',
        be: 'belgium',
        ch: 'switzerland',
        at: 'austria',
        se: 'sweden',
        no: 'norway',
        dk: 'denmark',
        fi: 'finland',
        ie: 'ireland',
        pt: 'portugal',
        pl: 'poland',
        cz: 'czech republic',
        // Common state abbreviations (US)
        ny: 'new york',
        tx: 'texas',
        fl: 'florida',
      },
    };
  }
}
