import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Immoscout24Scraper } from './immoscout24-scraper';
import { PropertyType, ListingStatus } from '@house-finder/domain';
import type { Browser, Page } from 'playwright';

// Mock HTML fixture for testing
const MOCK_LISTING_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div class="result-list">
    <article class="result-list-entry" data-id="123456789">
      <div class="result-list-entry__data">
        <a href="/expose/123456789" class="result-list-entry__brand-title-container">
          <h5 class="result-list-entry__brand-title">Schönes Einfamilienhaus mit Garten</h5>
        </a>
        <div class="result-list-entry__criteria">
          <div class="result-list-entry__primary-criterion">
            <span class="font-highlight">450.000 €</span>
          </div>
          <div class="result-list-entry__address">
            <span>10115 Berlin, Mitte</span>
          </div>
          <div class="result-list-entry__attributes">
            <span>150 m²</span>
            <span>4 Zimmer</span>
          </div>
        </div>
      </div>
    </article>
    <article class="result-list-entry" data-id="987654321">
      <div class="result-list-entry__data">
        <a href="/expose/987654321" class="result-list-entry__brand-title-container">
          <h5 class="result-list-entry__brand-title">Moderne Wohnung im Zentrum</h5>
        </a>
        <div class="result-list-entry__criteria">
          <div class="result-list-entry__primary-criterion">
            <span class="font-highlight">350.000 €</span>
          </div>
          <div class="result-list-entry__address">
            <span>80331 München, Altstadt</span>
          </div>
          <div class="result-list-entry__attributes">
            <span>85 m²</span>
            <span>3 Zimmer</span>
          </div>
        </div>
      </div>
    </article>
  </div>
</body>
</html>
`;

describe('Immoscout24Scraper', () => {
  let scraper: Immoscout24Scraper;

  beforeEach(() => {
    scraper = new Immoscout24Scraper({
      baseUrl: 'https://www.immobilienscout24.de',
      headless: true,
      timeout: 30000,
    });
  });

  afterEach(async () => {
    await scraper.cleanup();
  });

  describe('Configuration', () => {
    it('should have correct provider metadata', () => {
      expect(scraper.name).toBe('immoscout24');
      expect(scraper.type).toBe('scraper');
    });

    it('should validate valid configuration', async () => {
      const isValid = await scraper.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidScraper = new Immoscout24Scraper({
        baseUrl: '',
        headless: true,
      });

      const isValid = await invalidScraper.validateConfig();
      expect(isValid).toBe(false);
    });
  });

  describe('HTML Parsing', () => {
    it('should parse listing data from HTML', () => {
      const listings = scraper.parseListingsFromHtml(MOCK_LISTING_HTML);

      expect(listings).toHaveLength(2);
    });

    it('should extract correct data from first listing', () => {
      const listings = scraper.parseListingsFromHtml(MOCK_LISTING_HTML);
      const first = listings[0];

      expect(first).toBeDefined();
      expect(first?.id).toBe('immoscout24-123456789');
      expect(first?.title).toBe('Schönes Einfamilienhaus mit Garten');
      expect(first?.price).toBe(450000);
      expect(first?.currency).toBe('EUR');
      expect(first?.location.city).toBe('Berlin');
      expect(first?.location.postalCode).toBe('10115');
    });

    it('should extract correct data from second listing', () => {
      const listings = scraper.parseListingsFromHtml(MOCK_LISTING_HTML);
      const second = listings[1];

      expect(second).toBeDefined();
      expect(second?.id).toBe('immoscout24-987654321');
      expect(second?.title).toBe('Moderne Wohnung im Zentrum');
      expect(second?.price).toBe(350000);
      expect(second?.location.city).toBe('München');
      expect(second?.location.postalCode).toBe('80331');
    });

    it('should handle empty HTML gracefully', () => {
      const listings = scraper.parseListingsFromHtml('<html><body></body></html>');
      expect(listings).toHaveLength(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const listings = scraper.parseListingsFromHtml('invalid html');
      expect(listings).toHaveLength(0);
    });
  });

  describe('Price Parsing', () => {
    it('should parse German price format correctly', () => {
      const testCases = [
        { input: '450.000 €', expected: 450000 },
        { input: '1.250.000 €', expected: 1250000 },
        { input: '85.500 €', expected: 85500 },
        { input: '999 €', expected: 999 },
      ];

      testCases.forEach(({ input, expected }) => {
        const parsed = scraper.parseGermanPrice(input);
        expect(parsed).toBe(expected);
      });
    });

    it('should return null for invalid prices', () => {
      const invalidPrices = ['', 'Preis auf Anfrage', 'VB', 'invalid'];

      invalidPrices.forEach((invalid) => {
        const parsed = scraper.parseGermanPrice(invalid);
        expect(parsed).toBeNull();
      });
    });
  });

  describe('Property Type Detection', () => {
    it('should detect house from title', () => {
      const titles = [
        'Schönes Einfamilienhaus',
        'Reihenhaus mit Garten',
        'Doppelhaushälfte',
      ];

      titles.forEach((title) => {
        const type = scraper.detectPropertyType(title);
        expect(type).toBe(PropertyType.HOUSE);
      });
    });

    it('should detect apartment from title', () => {
      const titles = [
        'Moderne Wohnung',
        'Eigentumswohnung',
        'Apartment im Zentrum',
      ];

      titles.forEach((title) => {
        const type = scraper.detectPropertyType(title);
        expect(type).toBe(PropertyType.APARTMENT);
      });
    });

    it('should default to house for unknown types', () => {
      const type = scraper.detectPropertyType('Immobilie zu verkaufen');
      expect(type).toBe(PropertyType.HOUSE);
    });
  });

  describe('URL Building', () => {
    it('should build search URL with location', () => {
      const url = scraper.buildSearchUrl({
        location: { city: 'Berlin' },
      });

      expect(url).toContain('immobilienscout24.de');
      expect(url).toContain('berlin');
    });

    it('should build search URL with price range', () => {
      const url = scraper.buildSearchUrl({
        location: { city: 'München' },
        priceRange: { min: 100000, max: 500000 },
      });

      expect(url).toContain('muenchen');
      expect(url).toContain('100000');
      expect(url).toContain('500000');
    });

    it('should handle special characters in city names', () => {
      const url = scraper.buildSearchUrl({
        location: { city: 'München' },
      });

      expect(url).toContain('muenchen'); // ü -> ue
    });
  });

  describe('User Agent Rotation', () => {
    it('should return valid user agent', () => {
      const userAgent = scraper.getRandomUserAgent();

      expect(userAgent).toBeDefined();
      expect(userAgent.length).toBeGreaterThan(0);
      expect(userAgent).toContain('Mozilla');
    });

    it('should rotate user agents', () => {
      const userAgents = new Set<string>();

      for (let i = 0; i < 10; i++) {
        userAgents.add(scraper.getRandomUserAgent());
      }

      // Should have at least 2 different user agents in 10 calls
      expect(userAgents.size).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle extraction errors gracefully', async () => {
      const errorScraper = new Immoscout24Scraper({
        baseUrl: 'https://invalid-url-that-does-not-exist-12345.com',
        headless: true,
        timeout: 5000,
      });

      const result = await errorScraper.extract();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCount).toBeGreaterThan(0);
        expect(result.errors).toBeDefined();
      }

      await errorScraper.cleanup();
    });
  });

  describe('Metadata Tracking', () => {
    it('should include metadata in successful results', () => {
      const listings = scraper.parseListingsFromHtml(MOCK_LISTING_HTML);

      listings.forEach((listing) => {
        expect(listing.metadata).toBeDefined();
        expect(listing.metadata.extractedAt).toBeInstanceOf(Date);
        expect(listing.metadata.rawData).toBeDefined();
      });
    });
  });
});
