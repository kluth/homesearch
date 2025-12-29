import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { UnifiedHouseModel } from '@house-finder/domain';

interface UserPreferences {
  name?: string;
  email?: string;
  phone?: string;
  moveInDate?: string;
  householdSize?: number;
  pets?: boolean;
  employmentStatus?: string;
  additionalInfo?: string;
}

interface GeneratedResponse {
  subject: string;
  body: string;
  language: string;
  tone: string;
  propertyReference?: string;
}

@Component({
  selector: 'app-response-generator',
  imports: [CommonModule, FormsModule],
  templateUrl: './response-generator.component.html',
  styleUrl: './response-generator.component.scss',
})
export class ResponseGeneratorComponent {
  private http = inject(HttpClient);

  // Inputs
  public property = input.required<UnifiedHouseModel>();
  public apiUrl = input<string>('http://localhost:3000/extraction');

  // Outputs
  public close = output<void>();
  public responseSent = output<GeneratedResponse>();

  // State
  public loading = signal<boolean>(false);
  public generatedResponse = signal<GeneratedResponse | null>(null);
  public responseId = signal<string | null>(null);
  public error = signal<string | null>(null);

  // User preferences
  public userPreferences = signal<UserPreferences>({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    householdSize: undefined,
    pets: false,
    employmentStatus: '',
    additionalInfo: '',
  });

  // Options
  public includeViewingRequest = signal<boolean>(true);
  public specificQuestions = signal<string>('');
  public selectedTone = signal<string>('professional');
  public selectedLanguage = signal<string>('auto');

  // Available options
  public tones = ['formal', 'professional', 'friendly', 'casual'];
  public languages = [
    { code: 'auto', label: 'Auto-detect' },
    { code: 'de', label: 'German' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'it', label: 'Italian' },
    { code: 'nl', label: 'Dutch' },
    { code: 'pt', label: 'Portuguese' },
  ];

  /**
   * Generate response
   */
  public async generateResponse(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const questions = this.specificQuestions()
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const response = await this.http
        .post<{
          message: string;
          response: GeneratedResponse;
          responseId: string;
        }>(`${this.apiUrl()}/generateResponse`, {
          propertyId: this.property().id,
          userPreferences: this.userPreferences(),
          language: this.selectedLanguage() === 'auto' ? undefined : this.selectedLanguage(),
          tone: this.selectedTone(),
          includeViewingRequest: this.includeViewingRequest(),
          specificQuestions: questions,
        })
        .toPromise();

      if (response != null) {
        this.generatedResponse.set(response.response);
        this.responseId.set(response.responseId);
      }
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to generate response');
      console.error('Error generating response:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Copy response to clipboard
   */
  public async copyToClipboard(): Promise<void> {
    const response = this.generatedResponse();
    if (response == null) return;

    const text = `Subject: ${response.subject}\n\n${response.body}`;

    try {
      await navigator.clipboard.writeText(text);
      alert('Response copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  /**
   * Mark response as sent
   */
  public async markAsSent(): Promise<void> {
    const responseId = this.responseId();
    const response = this.generatedResponse();

    if (responseId == null || response == null) return;

    try {
      await this.http
        .post(`${this.apiUrl()}/markResponseSent`, {
          responseId,
          sentAt: new Date().toISOString(),
        })
        .toPromise();

      this.responseSent.emit(response);
      this.close.emit();
    } catch (err) {
      console.error('Error marking response as sent:', err);
    }
  }

  /**
   * Close dialog
   */
  public closeDialog(): void {
    this.close.emit();
  }

  /**
   * Reset to edit mode
   */
  public editResponse(): void {
    this.generatedResponse.set(null);
    this.responseId.set(null);
  }

  /**
   * Check if form is valid
   */
  public isFormValid(): boolean {
    const prefs = this.userPreferences();
    return (prefs.name != null && prefs.name.length > 0) ||
           (prefs.email != null && prefs.email.length > 0);
  }
}
