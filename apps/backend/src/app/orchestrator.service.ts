import { Injectable, Logger } from '@nestjs/common';
import {
  SourceDiscoveryAgent,
  ProviderRegistry,
  CircuitBreaker,
  DataTransformerService,
  type FetchSchedule,
  type DiscoveredSource,
} from '@house-finder/extraction-engine';
import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Extraction job status
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Extraction job
 */
export interface ExtractionJob {
  id: string;
  sourceId: string;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: UnifiedHouseModel[];
  error?: string;
  retryCount: number;
  priority: number; // Higher = more important
}

/**
 * Orchestrator Service
 * Coordinates extraction across multiple sources with priority scheduling
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private discoveryAgent: SourceDiscoveryAgent;
  private providerRegistry: ProviderRegistry;
  private transformer: DataTransformerService;
  private jobs: Map<string, ExtractionJob> = new Map();
  private isSchedulerRunning = false;

  constructor() {
    this.discoveryAgent = new SourceDiscoveryAgent();
    this.providerRegistry = new ProviderRegistry();
    this.transformer = new DataTransformerService();
  }

  /**
   * Initialize the orchestrator
   */
  public async initialize(): Promise<void> {
    this.logger.log('Initializing Orchestrator Service...');

    // Load discovered sources from config
    await this.discoveryAgent.initialize();

    this.logger.log('Orchestrator Service initialized successfully');
  }

  /**
   * Discover sources for a location
   */
  public async discoverSources(location: string, limit = 10): Promise<DiscoveredSource[]> {
    this.logger.log(`Discovering sources for location: ${location}`);

    const sources = await this.discoveryAgent.discoverSources({
      location,
      limit,
    });

    this.logger.log(`Discovered ${sources.length} sources for ${location}`);

    // Log quality grades
    for (const source of sources) {
      this.logger.debug(
        `Source: ${source.name} - Quality: ${source.quality?.grade} (${source.quality?.score}/100)`
      );
    }

    return sources;
  }

  /**
   * Start extraction for a specific location
   */
  public async startExtraction(location: string): Promise<ExtractionJob[]> {
    this.logger.log(`Starting extraction for location: ${location}`);

    // Discover sources
    const sources = await this.discoverSources(location);

    if (sources.length === 0) {
      this.logger.warn(`No sources found for location: ${location}`);
      return [];
    }

    // Create jobs for each source based on priority
    const jobs: ExtractionJob[] = [];
    const schedules = this.discoveryAgent.getFetchSchedules();

    for (const source of sources) {
      const schedule = schedules.find((s) => s.sourceId === source.name);
      const priority = this.calculatePriority(source.quality?.score ?? 0);

      const job: ExtractionJob = {
        id: `job-${source.name}-${Date.now()}`,
        sourceId: source.name,
        status: JobStatus.PENDING,
        createdAt: new Date(),
        retryCount: 0,
        priority,
      };

      this.jobs.set(job.id, job);
      jobs.push(job);

      this.logger.log(
        `Created job ${job.id} for source ${source.name} with priority ${priority}`
      );
    }

    // Start executing jobs
    this.executeJobs(jobs);

    return jobs;
  }

  /**
   * Execute extraction jobs with priority ordering
   */
  private async executeJobs(jobs: ExtractionJob[]): Promise<void> {
    // Sort by priority (highest first)
    const sortedJobs = [...jobs].sort((a, b) => b.priority - a.priority);

    for (const job of sortedJobs) {
      try {
        await this.executeJob(job);
      } catch (error) {
        this.logger.error(`Job ${job.id} failed:`, error);
      }
    }
  }

  /**
   * Execute a single extraction job
   */
  private async executeJob(job: ExtractionJob): Promise<void> {
    this.logger.log(`Executing job ${job.id} for source ${job.sourceId}`);

    // Update job status
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date();
    this.jobs.set(job.id, job);

    try {
      // Get provider from registry (in real implementation, would dynamically create from source)
      // For now, we'll simulate extraction
      const results = await this.extractFromSource(job.sourceId);

      // Transform results
      const transformed = this.transformer.transform(results);

      // Update job with results
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.results = transformed;
      this.jobs.set(job.id, job);

      this.logger.log(
        `Job ${job.id} completed successfully. Extracted ${transformed.length} properties.`
      );
    } catch (error) {
      job.status = JobStatus.FAILED;
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);
      this.jobs.set(job.id, job);

      this.logger.error(`Job ${job.id} failed:`, error);

      // Retry logic for failed jobs
      if (job.retryCount < 3) {
        job.retryCount++;
        job.status = JobStatus.PENDING;
        this.logger.log(`Retrying job ${job.id} (attempt ${job.retryCount}/3)`);
        setTimeout(() => this.executeJob(job), 5000 * job.retryCount); // Exponential backoff
      }
    }
  }

  /**
   * Extract data from a source (placeholder - would use actual providers)
   */
  private async extractFromSource(sourceId: string): Promise<UnifiedHouseModel[]> {
    // In real implementation, this would:
    // 1. Get the provider from registry
    // 2. Execute extraction with circuit breaker
    // 3. Return results

    // For now, simulate extraction
    this.logger.debug(`Simulating extraction from source: ${sourceId}`);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    return [
      // Simulated results would go here
      // In production, this calls actual providers
    ];
  }

  /**
   * Calculate priority based on quality score
   */
  private calculatePriority(qualityScore: number): number {
    if (qualityScore >= 90) return 10; // CRITICAL
    if (qualityScore >= 75) return 7; // HIGH
    if (qualityScore >= 60) return 5; // MEDIUM
    return 3; // LOW
  }

  /**
   * Get job status
   */
  public getJob(jobId: string): ExtractionJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  public getAllJobs(): ExtractionJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  public getJobsByStatus(status: JobStatus): ExtractionJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }

  /**
   * Start automatic scheduler based on fetch schedules
   */
  public startScheduler(): void {
    if (this.isSchedulerRunning) {
      this.logger.warn('Scheduler is already running');
      return;
    }

    this.logger.log('Starting automatic extraction scheduler');
    this.isSchedulerRunning = true;

    // Run scheduler every minute
    setInterval(() => {
      this.runScheduledExtractions();
    }, 60 * 1000);

    // Run immediately
    this.runScheduledExtractions();
  }

  /**
   * Stop the scheduler
   */
  public stopScheduler(): void {
    this.logger.log('Stopping automatic extraction scheduler');
    this.isSchedulerRunning = false;
  }

  /**
   * Run scheduled extractions based on fetch priorities
   */
  private async runScheduledExtractions(): Promise<void> {
    if (!this.isSchedulerRunning) {
      return;
    }

    this.logger.debug('Running scheduled extractions');

    const schedules = this.discoveryAgent.getFetchSchedules();
    const now = Date.now();

    for (const schedule of schedules) {
      const lastFetch = schedule.lastFetched?.getTime() ?? 0;
      const timeSinceLastFetch = now - lastFetch;

      // Check if it's time to fetch this source
      if (timeSinceLastFetch >= schedule.intervalMs) {
        this.logger.log(
          `Scheduling extraction for ${schedule.sourceId} (priority: ${schedule.priority})`
        );

        // Create and execute job
        const job: ExtractionJob = {
          id: `scheduled-${schedule.sourceId}-${Date.now()}`,
          sourceId: schedule.sourceId,
          status: JobStatus.PENDING,
          createdAt: new Date(),
          retryCount: 0,
          priority: this.priorityToNumber(schedule.priority),
        };

        this.jobs.set(job.id, job);
        this.executeJob(job);

        // Update last fetch time
        schedule.lastFetched = new Date();
      }
    }
  }

  /**
   * Convert FetchPriority enum to numeric priority
   */
  private priorityToNumber(priority: string): number {
    switch (priority) {
      case 'CRITICAL':
        return 10;
      case 'HIGH':
        return 7;
      case 'MEDIUM':
        return 5;
      case 'LOW':
        return 3;
      default:
        return 5;
    }
  }

  /**
   * Get extraction statistics
   */
  public getStatistics(): {
    totalJobs: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    totalProperties: number;
  } {
    const allJobs = this.getAllJobs();
    const totalProperties = allJobs.reduce((sum, job) => sum + (job.results?.length ?? 0), 0);

    return {
      totalJobs: allJobs.length,
      pending: this.getJobsByStatus(JobStatus.PENDING).length,
      running: this.getJobsByStatus(JobStatus.RUNNING).length,
      completed: this.getJobsByStatus(JobStatus.COMPLETED).length,
      failed: this.getJobsByStatus(JobStatus.FAILED).length,
      totalProperties,
    };
  }
}
