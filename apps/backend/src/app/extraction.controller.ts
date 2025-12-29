import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { OrchestratorService, type ExtractionJob, JobStatus } from './orchestrator.service';
import type { DiscoveredSource } from '@house-finder/extraction-engine';

/**
 * DTO for starting extraction
 */
export class StartExtractionDto {
  location: string;
}

/**
 * DTO for discovering sources
 */
export class DiscoverSourcesDto {
  location: string;
  limit?: number;
}

/**
 * Extraction Controller
 * REST API for managing property extractions
 */
@Controller('extraction')
export class ExtractionController {
  private readonly logger = new Logger(ExtractionController.name);

  constructor(private readonly orchestrator: OrchestratorService) {}

  /**
   * POST /extraction/start
   * Start extraction for a specific location
   */
  @Post('start')
  public async startExtraction(@Body() dto: StartExtractionDto): Promise<{
    message: string;
    jobs: ExtractionJob[];
  }> {
    this.logger.log(`API: Starting extraction for location: ${dto.location}`);

    const jobs = await this.orchestrator.startExtraction(dto.location);

    return {
      message: `Started extraction for ${dto.location} with ${jobs.length} sources`,
      jobs,
    };
  }

  /**
   * POST /extraction/discover
   * Discover sources for a location without starting extraction
   */
  @Post('discover')
  public async discoverSources(@Body() dto: DiscoverSourcesDto): Promise<{
    message: string;
    sources: DiscoveredSource[];
  }> {
    this.logger.log(`API: Discovering sources for location: ${dto.location}`);

    const sources = await this.orchestrator.discoverSources(dto.location, dto.limit ?? 10);

    return {
      message: `Discovered ${sources.length} sources for ${dto.location}`,
      sources,
    };
  }

  /**
   * GET /extraction/jobs
   * Get all extraction jobs
   */
  @Get('jobs')
  public getAllJobs(@Query('status') status?: string): ExtractionJob[] {
    if (status) {
      const jobStatus = status.toUpperCase() as JobStatus;
      return this.orchestrator.getJobsByStatus(jobStatus);
    }

    return this.orchestrator.getAllJobs();
  }

  /**
   * GET /extraction/jobs/:id
   * Get a specific job by ID
   */
  @Get('jobs/:id')
  public getJob(@Param('id') id: string): ExtractionJob | { error: string } {
    const job = this.orchestrator.getJob(id);

    if (!job) {
      return { error: `Job ${id} not found` };
    }

    return job;
  }

  /**
   * GET /extraction/statistics
   * Get extraction statistics
   */
  @Get('statistics')
  public getStatistics(): {
    totalJobs: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    totalProperties: number;
  } {
    return this.orchestrator.getStatistics();
  }

  /**
   * POST /extraction/scheduler/start
   * Start the automatic scheduler
   */
  @Post('scheduler/start')
  public startScheduler(): { message: string } {
    this.logger.log('API: Starting scheduler');
    this.orchestrator.startScheduler();

    return {
      message: 'Scheduler started successfully',
    };
  }

  /**
   * POST /extraction/scheduler/stop
   * Stop the automatic scheduler
   */
  @Post('scheduler/stop')
  public stopScheduler(): { message: string } {
    this.logger.log('API: Stopping scheduler');
    this.orchestrator.stopScheduler();

    return {
      message: 'Scheduler stopped successfully',
    };
  }

  /**
   * GET /extraction/health
   * Health check endpoint
   */
  @Get('health')
  public healthCheck(): {
    status: string;
    timestamp: string;
    stats: ReturnType<typeof this.orchestrator.getStatistics>;
  } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: this.orchestrator.getStatistics(),
    };
  }
}
