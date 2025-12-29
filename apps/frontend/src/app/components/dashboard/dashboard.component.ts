import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public propertyService = inject(PropertyService);

  // Component signals
  public searchLocation = signal<string>('');
  public viewMode = signal<'grid' | 'list'>('grid');
  public selectedProperty = signal<any | null>(null);

  // Computed signals
  public hasProperties = computed(() => this.propertyService.totalPropertiesCount() > 0);
  public hasJobs = computed(() => this.propertyService.jobs().length > 0);
  public isExtracting = computed(() =>
    this.propertyService.jobs().some((j) => j.status === 'running')
  );

  ngOnInit() {
    // Check backend health on init
    this.checkBackendHealth();
  }

  async checkBackendHealth() {
    const healthy = await this.propertyService.checkHealth();
    if (!healthy) {
      this.propertyService.error.set('Backend is not responding');
    }
  }

  async onSearch() {
    const location = this.searchLocation().trim();
    if (!location) {
      return;
    }

    // First discover sources
    await this.propertyService.discoverSources(location);

    // Then start extraction
    await this.propertyService.startExtraction(location);
  }

  selectProperty(property: any) {
    this.selectedProperty.set(property);
  }

  closePropertyDetail() {
    this.selectedProperty.set(null);
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  }

  getJobStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      running: 'status-running',
      completed: 'status-completed',
      failed: 'status-failed',
    };
    return classes[status] || '';
  }

  getQualityBadgeClass(grade?: string): string {
    const classes: Record<string, string> = {
      EXCELLENT: 'badge-excellent',
      GOOD: 'badge-good',
      FAIR: 'badge-fair',
      POOR: 'badge-poor',
    };
    return classes[grade || ''] || 'badge-default';
  }
}
