/**
 * Response Generator Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ResponseGeneratorService,
  ResponseLanguage,
  ResponseTone,
  type UserPreferences,
  type ResponseGenerationOptions,
} from './response-generator';
import type { UnifiedHouseModel } from '@house-finder/domain';

describe('ResponseGeneratorService', () => {
  let service: ResponseGeneratorService;

  beforeEach(() => {
    service = new ResponseGeneratorService();
  });

  describe('Language Detection', () => {
    it('should detect German from .de domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-1',
        title: 'Schöne Wohnung in Berlin',
        price: 1200,
        location: {
          country: 'Germany',
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.GERMAN);
      expect(response.subject).toContain('Anfrage');
      expect(response.body).toContain('Sehr geehrte Damen und Herren');
    });

    it('should detect French from .fr domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-2',
        title: 'Appartement à Paris',
        price: 1500,
        location: {
          country: 'France',
          city: 'Paris',
        },
        source: 'seloger',
        url: 'https://www.seloger.fr/...',
        metadata: {
          source: 'seloger.fr',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Jean Dupont',
        email: 'jean@example.fr',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.FRENCH);
      expect(response.body).toContain('Madame, Monsieur');
    });

    it('should detect Spanish from .es domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-3',
        title: 'Piso en Barcelona',
        price: 1000,
        location: {
          country: 'Spain',
          city: 'Barcelona',
        },
        source: 'idealista',
        url: 'https://www.idealista.es/...',
        metadata: {
          source: 'idealista.es',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Maria Garcia',
        email: 'maria@example.es',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.SPANISH);
      expect(response.body).toContain('Estimado/a señor/a');
    });

    it('should detect Italian from .it domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-4',
        title: 'Appartamento a Roma',
        price: 1200,
        location: {
          country: 'Italy',
          city: 'Roma',
        },
        source: 'immobiliare',
        url: 'https://www.immobiliare.it/...',
        metadata: {
          source: 'immobiliare.it',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Marco Rossi',
        email: 'marco@example.it',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.ITALIAN);
      expect(response.body).toContain('Gentile Signore/Signora');
    });

    it('should detect Dutch from .nl domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-5',
        title: 'Woning in Amsterdam',
        price: 1800,
        location: {
          country: 'Netherlands',
          city: 'Amsterdam',
        },
        source: 'funda',
        url: 'https://www.funda.nl/...',
        metadata: {
          source: 'funda.nl',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Jan de Vries',
        email: 'jan@example.nl',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.DUTCH);
      expect(response.body).toContain('Geachte heer/mevrouw');
    });

    it('should detect Portuguese from .pt domain', () => {
      const property: UnifiedHouseModel = {
        id: 'test-6',
        title: 'Apartamento em Lisboa',
        price: 900,
        location: {
          country: 'Portugal',
          city: 'Lisboa',
        },
        source: 'idealista',
        url: 'https://www.idealista.pt/...',
        metadata: {
          source: 'idealista.pt',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'João Silva',
        email: 'joao@example.pt',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.PORTUGUESE);
      expect(response.body).toContain('Prezado/a Senhor/a');
    });

    it('should default to English for unknown sources', () => {
      const property: UnifiedHouseModel = {
        id: 'test-7',
        title: 'Nice apartment in London',
        price: 2000,
        location: {
          country: 'UK',
          city: 'London',
        },
        source: 'zillow',
        url: 'https://www.zillow.com/...',
        metadata: {
          source: 'zillow.com',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'John Smith',
        email: 'john@example.com',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.language).toBe(ResponseLanguage.ENGLISH);
      expect(response.body).toContain('Dear Sir or Madam');
    });
  });

  describe('Response Generation', () => {
    it('should generate complete response with all sections', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-123',
        title: '3-Zimmer-Wohnung in München',
        price: 1500,
        type: 'apartment',
        location: {
          country: 'Germany',
          city: 'München',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+49 123 456789',
        moveInDate: '01.03.2024',
        householdSize: 2,
        pets: false,
        employmentStatus: 'Full-time employed',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
        includeViewingRequest: true,
        specificQuestions: [
          'Ist eine Einbauküche vorhanden?',
          'Gibt es einen Keller oder Stellplatz?',
        ],
      });

      expect(response.subject).toContain('3-Zimmer-Wohnung');
      expect(response.subject).toContain('prop-123');
      expect(response.body).toContain('Sehr geehrte Damen und Herren');
      expect(response.body).toContain('3-Zimmer-Wohnung in München');
      expect(response.body).toContain('Besichtigungstermin');
      expect(response.body).toContain('01.03.2024');
      expect(response.body).toContain('Full-time employed');
      expect(response.body).toContain('2 people');
      expect(response.body).toContain('Pets: No');
      expect(response.body).toContain('Ist eine Einbauküche vorhanden?');
      expect(response.body).toContain('Gibt es einen Keller oder Stellplatz?');
      expect(response.body).toContain('Max Mustermann');
      expect(response.body).toContain('max@example.com');
      expect(response.body).toContain('+49 123 456789');
      expect(response.propertyReference).toBe('prop-123');
    });

    it('should generate response without viewing request', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-456',
        title: 'Modern Apartment',
        price: 1200,
        location: {
          city: 'London',
        },
        source: 'zillow',
        url: 'https://www.zillow.com/...',
        metadata: {
          source: 'zillow.com',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
        includeViewingRequest: false,
      });

      expect(response.body).not.toContain('viewing');
      expect(response.body).not.toContain('schedule');
    });

    it('should generate response without questions', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-789',
        title: 'Studio in Paris',
        price: 800,
        location: {
          city: 'Paris',
        },
        source: 'seloger',
        url: 'https://www.seloger.fr/...',
        metadata: {
          source: 'seloger.fr',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Pierre Martin',
        email: 'pierre@example.fr',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
        specificQuestions: [],
      });

      expect(response.body).not.toContain("J'aurais quelques questions");
    });

    it('should handle minimal user preferences', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-minimal',
        title: 'Apartment',
        price: 1000,
        location: {
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        email: 'minimal@example.com',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.body).toContain('minimal@example.com');
      expect(response.subject).toBeTruthy();
      expect(response.body).toBeTruthy();
    });

    it('should respect language override', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-override',
        title: 'Wohnung in Berlin',
        price: 1200,
        location: {
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
      };

      // Force English despite German source
      const response = service.generateResponse({
        property,
        userPreferences,
        language: ResponseLanguage.ENGLISH,
      });

      expect(response.language).toBe(ResponseLanguage.ENGLISH);
      expect(response.body).toContain('Dear Sir or Madam');
      expect(response.body).not.toContain('Sehr geehrte');
    });
  });

  describe('Validation', () => {
    it('should validate preferences with name', () => {
      const preferences: UserPreferences = {
        name: 'John Doe',
      };

      expect(service.validatePreferences(preferences)).toBe(true);
    });

    it('should validate preferences with email', () => {
      const preferences: UserPreferences = {
        email: 'john@example.com',
      };

      expect(service.validatePreferences(preferences)).toBe(true);
    });

    it('should validate preferences with both name and email', () => {
      const preferences: UserPreferences = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      expect(service.validatePreferences(preferences)).toBe(true);
    });

    it('should invalidate empty preferences', () => {
      const preferences: UserPreferences = {};

      expect(service.validatePreferences(preferences)).toBe(false);
    });
  });

  describe('Available Languages', () => {
    it('should return all available languages', () => {
      const languages = service.getAvailableLanguages();

      expect(languages).toContain(ResponseLanguage.GERMAN);
      expect(languages).toContain(ResponseLanguage.ENGLISH);
      expect(languages).toContain(ResponseLanguage.FRENCH);
      expect(languages).toContain(ResponseLanguage.SPANISH);
      expect(languages).toContain(ResponseLanguage.ITALIAN);
      expect(languages).toContain(ResponseLanguage.DUTCH);
      expect(languages).toContain(ResponseLanguage.PORTUGUESE);
      expect(languages.length).toBe(7);
    });
  });

  describe('Additional Information', () => {
    it('should include additional info in response', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-info',
        title: 'Apartment',
        price: 1000,
        location: {
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const userPreferences: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
        additionalInfo: 'I am a non-smoker and work from home occasionally.',
      };

      const response = service.generateResponse({
        property,
        userPreferences,
      });

      expect(response.body).toContain('non-smoker');
      expect(response.body).toContain('work from home');
    });

    it('should handle pets flag correctly', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-pets',
        title: 'Apartment',
        price: 1000,
        location: {
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const withPets: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
        pets: true,
      };

      const withoutPets: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
        pets: false,
      };

      const responseWithPets = service.generateResponse({
        property,
        userPreferences: withPets,
      });

      const responseWithoutPets = service.generateResponse({
        property,
        userPreferences: withoutPets,
      });

      expect(responseWithPets.body).toContain('Pets: Yes');
      expect(responseWithoutPets.body).toContain('Pets: No');
    });

    it('should handle household size correctly', () => {
      const property: UnifiedHouseModel = {
        id: 'prop-household',
        title: 'Apartment',
        price: 1000,
        location: {
          city: 'Berlin',
        },
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/...',
        metadata: {
          source: 'immoscout24.de',
          extractedAt: new Date(),
        },
      };

      const singlePerson: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
        householdSize: 1,
      };

      const multiplePeople: UserPreferences = {
        name: 'Test User',
        email: 'test@example.com',
        householdSize: 3,
      };

      const responseSingle = service.generateResponse({
        property,
        userPreferences: singlePerson,
      });

      const responseMultiple = service.generateResponse({
        property,
        userPreferences: multiplePeople,
      });

      expect(responseSingle.body).toContain('1 person');
      expect(responseMultiple.body).toContain('3 people');
    });
  });
});
