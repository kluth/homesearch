import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, switchMap, startWith, catchError, of } from 'rxjs';

/**
 * Property model (simplified from UnifiedHouseModel)
 */
export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  address?: string;
  city?: string;
  images?: string[];
  sourceUrl?: string;
  metadata: {
    source: string;
    extractedAt: Date;
    confidence?: number;
  };
}

/**
 * Extraction job status
 */
export interface ExtractionJob {
  id: string;
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  priority: number;
  results?: Property[];
}

/**
 * Statistics
 */
export interface Statistics {
  totalJobs: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  totalProperties: number;
}

/**
 * Discovered source
 */
export interface DiscoveredSource {
  name: string;
  url: string;
  type: 'api' | 'scraper';
  confidence: number;
  language?: string;
  localName?: string;
  quality?: {
    grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    score: number;
    reasonsForGrade: string[];
  };
}

/**
 * Property Service - Angular Signals Integration
 */
@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/extraction';

  // Signals for reactive state management
  public properties = signal<Property[]>([]);
  public jobs = signal<ExtractionJob[]>([]);
  public sources = signal<DiscoveredSource[]>([]);
  public statistics = signal<Statistics>({
    totalJobs: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    totalProperties: 0,
  });
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public currentLocation = signal<string>('');

  // Computed signals
  public excellentSources = computed(() =>
    this.sources().filter((s) => s.quality?.grade === 'EXCELLENT')
  );

  public goodSources = computed(() =>
    this.sources().filter((s) => s.quality?.grade === 'GOOD')
  );

  public recentProperties = computed(() =>
    this.properties()
      .sort(
        (a, b) =>
          new Date(b.metadata.extractedAt).getTime() -
          new Date(a.metadata.extractedAt).getTime()
      )
      .slice(0, 20)
  );

  public highConfidenceProperties = computed(() =>
    this.properties().filter((p) => (p.metadata.confidence ?? 0) >= 0.8)
  );

  public totalPropertiesCount = computed(() => this.properties().length);

  // Auto-refresh statistics every 30 seconds
  private statisticsRefresh$ = interval(30000).pipe(
    startWith(0),
    switchMap(() =>
      this.http.get<Statistics>(`${this.apiUrl}/statistics`).pipe(
        catchError(() => of(this.statistics())) // Return current state on error
      )
    )
  );

  public statisticsSignal = toSignal(this.statisticsRefresh$, {
    initialValue: this.statistics(),
  });

  /**
   * Discover sources for a location
   */
  public async discoverSources(location: string, limit = 10): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.currentLocation.set(location);

    try {
      const response = await this.http
        .post<{ sources: DiscoveredSource[] }>(`${this.apiUrl}/discover`, {
          location,
          limit,
        })
        .toPromise();

      if (response?.sources) {
        this.sources.set(response.sources);
      }
    } catch (err) {
      this.error.set('Failed to discover sources');
      console.error('Discovery error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Start extraction for a location
   */
  public async startExtraction(location: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.currentLocation.set(location);

    try {
      const response = await this.http
        .post<{ jobs: ExtractionJob[] }>(`${this.apiUrl}/start`, { location })
        .toPromise();

      if (response?.jobs) {
        this.jobs.set(response.jobs);
      }

      // Poll for job updates
      this.pollJobUpdates();
    } catch (err) {
      this.error.set('Failed to start extraction');
      console.error('Extraction error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Poll for job updates every 5 seconds
   */
  private pollJobUpdates(): void {
    const pollInterval = setInterval(async () => {
      try {
        const jobs = await this.http
          .get<ExtractionJob[]>(`${this.apiUrl}/jobs`)
          .toPromise();

        if (jobs) {
          this.jobs.set(jobs);

          // Collect all properties from completed jobs
          const allProperties: Property[] = [];
          for (const job of jobs) {
            if (job.status === 'completed' && job.results) {
              allProperties.push(...job.results);
            }
          }
          this.properties.set(allProperties);

          // Stop polling if all jobs are done
          const allCompleted = jobs.every(
            (j) => j.status === 'completed' || j.status === 'failed'
          );
          if (allCompleted) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  }

  /**
   * Get job by ID
   */
  public async getJob(jobId: string): Promise<ExtractionJob | null> {
    try {
      const job = await this.http
        .get<ExtractionJob>(`${this.apiUrl}/jobs/${jobId}`)
        .toPromise();
      return job ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Refresh statistics manually
   */
  public async refreshStatistics(): Promise<void> {
    try {
      const stats = await this.http
        .get<Statistics>(`${this.apiUrl}/statistics`)
        .toPromise();
      if (stats) {
        this.statistics.set(stats);
      }
    } catch (err) {
      console.error('Statistics error:', err);
    }
  }

  /**
   * Start scheduler
   */
  public async startScheduler(): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/scheduler/start`, {}).toPromise();
    } catch (err) {
      this.error.set('Failed to start scheduler');
      console.error('Scheduler error:', err);
    }
  }

  /**
   * Stop scheduler
   */
  public async stopScheduler(): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/scheduler/stop`, {}).toPromise();
    } catch (err) {
      this.error.set('Failed to stop scheduler');
      console.error('Scheduler error:', err);
    }
  }

  /**
   * Check backend health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.http
        .get<{ status: string }>(`${this.apiUrl}/health`)
        .toPromise();
      return response?.status === 'healthy';
    } catch {
      return false;
    }
  }
}
