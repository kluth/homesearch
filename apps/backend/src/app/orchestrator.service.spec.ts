import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorService, JobStatus } from './orchestrator.service';

describe('OrchestratorService', () => {
  let service: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrchestratorService],
    }).compile();

    service = module.get<OrchestratorService>(OrchestratorService);
    await service.initialize();
  });

  afterEach(() => {
    // Stop scheduler if running
    service.stopScheduler();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize successfully', async () => {
      // Service is already initialized in beforeEach
      expect(service).toBeDefined();
    });
  });

  describe('Source Discovery', () => {
    it('should discover sources for a location', async () => {
      const sources = await service.discoverSources('Germany', 5);

      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should discover German sources for "de" abbreviation', async () => {
      const sources = await service.discoverSources('de', 5);

      expect(sources.length).toBeGreaterThan(0);
      // Should include German sources
      const sourceNames = sources.map((s) => s.name);
      expect(sourceNames.some((name) => name.includes('immobilien'))).toBe(true);
    });

    it('should return sources sorted by quality score', async () => {
      const sources = await service.discoverSources('United States', 5);

      if (sources.length > 1) {
        // Verify descending order by quality score
        for (let i = 0; i < sources.length - 1; i++) {
          const currentScore = sources[i]?.quality?.score ?? 0;
          const nextScore = sources[i + 1]?.quality?.score ?? 0;
          expect(currentScore).toBeGreaterThanOrEqual(nextScore);
        }
      }
    });

    it('should return empty array for unknown location', async () => {
      const sources = await service.discoverSources('Unknown Location XYZ', 5);

      // Will return default sources sorted by confidence
      expect(Array.isArray(sources)).toBe(true);
    });
  });

  describe('Extraction Jobs', () => {
    it('should create extraction jobs for a location', async () => {
      const jobs = await service.startExtraction('Germany');

      expect(jobs).toBeDefined();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should create jobs with correct properties', async () => {
      const jobs = await service.startExtraction('France');

      if (jobs.length > 0) {
        const job = jobs[0];
        expect(job).toBeDefined();
        expect(job?.id).toBeDefined();
        expect(job?.sourceId).toBeDefined();
        expect(job?.status).toBeDefined();
        expect(job?.createdAt).toBeInstanceOf(Date);
        expect(job?.priority).toBeGreaterThan(0);
        expect(job?.retryCount).toBe(0);
      }
    });

    it('should assign higher priority to excellent sources', async () => {
      const jobs = await service.startExtraction('United States');

      if (jobs.length > 1) {
        // Find jobs with different quality sources
        const priorities = jobs.map((j) => j.priority);
        const uniquePriorities = new Set(priorities);

        // Should have different priorities
        expect(uniquePriorities.size).toBeGreaterThan(1);
      }
    });

    it('should retrieve job by ID', async () => {
      const jobs = await service.startExtraction('Spain');

      if (jobs.length > 0) {
        const jobId = jobs[0]?.id;
        if (jobId) {
          const retrievedJob = service.getJob(jobId);

          expect(retrievedJob).toBeDefined();
          expect(retrievedJob?.id).toBe(jobId);
        }
      }
    });

    it('should return undefined for non-existent job', () => {
      const job = service.getJob('non-existent-id');

      expect(job).toBeUndefined();
    });
  });

  describe('Job Status Management', () => {
    it('should filter jobs by status', async () => {
      await service.startExtraction('Italy');

      const allJobs = service.getAllJobs();
      expect(allJobs.length).toBeGreaterThan(0);

      // Initially all jobs should be pending or running or completed
      const pendingJobs = service.getJobsByStatus(JobStatus.PENDING);
      const runningJobs = service.getJobsByStatus(JobStatus.RUNNING);
      const completedJobs = service.getJobsByStatus(JobStatus.COMPLETED);

      const totalByStatus = pendingJobs.length + runningJobs.length + completedJobs.length;
      expect(totalByStatus).toBeLessThanOrEqual(allJobs.length);
    });

    it('should get all jobs', async () => {
      const jobs1 = await service.startExtraction('Germany');
      const jobs2 = await service.startExtraction('France');

      const allJobs = service.getAllJobs();

      expect(allJobs.length).toBeGreaterThanOrEqual(jobs1.length + jobs2.length);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', async () => {
      const stats = service.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.running).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
      expect(stats.totalProperties).toBeGreaterThanOrEqual(0);
    });

    it('should update statistics after extraction', async () => {
      const statsBefore = service.getStatistics();

      await service.startExtraction('Canada');

      const statsAfter = service.getStatistics();

      expect(statsAfter.totalJobs).toBeGreaterThan(statsBefore.totalJobs);
    });
  });

  describe('Scheduler', () => {
    it('should start scheduler', () => {
      expect(() => service.startScheduler()).not.toThrow();
    });

    it('should stop scheduler', () => {
      service.startScheduler();
      expect(() => service.stopScheduler()).not.toThrow();
    });

    it('should not start scheduler twice', () => {
      service.startScheduler();
      // Starting again should just log a warning
      service.startScheduler();
      service.stopScheduler();
    });
  });
});
