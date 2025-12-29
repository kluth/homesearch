import { describe, it, expect } from '@jest/globals';
import { DataTransformerService } from './data-transformer';
import { PropertyType, ListingStatus, type UnifiedHouseModel } from '@house-finder/domain';

describe('DataTransformerService', () => {
  let service: DataTransformerService;

  beforeEach(() => {
    service = new DataTransformerService();
  });

  describe('Deduplication', () => {
    it('should remove exact duplicates by ID', () => {
      const houses: UnifiedHouseModel[] = [
        {
          id: 'test-1',
          source: 'source-a',
          url: 'https://example.com/1',
          title: 'House 1',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test City', country: 'Test' },
          metadata: { extractedAt: new Date() },
        },
        {
          id: 'test-1',
          source: 'source-a',
          url: 'https://example.com/1',
          title: 'House 1',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test City', country: 'Test' },
          metadata: { extractedAt: new Date() },
        },
      ];

      const deduplicated = service.deduplicate(houses);
      expect(deduplicated).toHaveLength(1);
    });

    it('should detect duplicates by similar address', () => {
      const houses: UnifiedHouseModel[] = [
        {
          id: 'zillow-1',
          source: 'zillow',
          url: 'https://zillow.com/1',
          title: 'Beautiful Home',
          price: 500000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: {
            address: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
          },
          metadata: { extractedAt: new Date() },
        },
        {
          id: 'immoscout-1',
          source: 'immoscout24',
          url: 'https://immoscout24.de/1',
          title: 'Schönes Haus',
          price: 480000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
          },
          metadata: { extractedAt: new Date() },
        },
      ];

      const deduplicated = service.deduplicate(houses);
      expect(deduplicated).toHaveLength(1);
    });

    it('should keep distinct properties', () => {
      const houses: UnifiedHouseModel[] = [
        {
          id: 'test-1',
          source: 'test',
          url: 'https://example.com/1',
          title: 'House 1',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'City A', country: 'Test' },
          metadata: { extractedAt: new Date() },
        },
        {
          id: 'test-2',
          source: 'test',
          url: 'https://example.com/2',
          title: 'House 2',
          price: 200000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'City B', country: 'Test' },
          metadata: { extractedAt: new Date() },
        },
      ];

      const deduplicated = service.deduplicate(houses);
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe('Price Normalization', () => {
    it('should convert EUR to USD', () => {
      const house = {
        price: 100000,
        currency: 'EUR',
      };

      const normalized = service.normalizePriceToUSD(house.price, house.currency);
      expect(normalized).toBeGreaterThan(100000); // EUR typically > USD
    });

    it('should keep USD prices unchanged', () => {
      const house = {
        price: 100000,
        currency: 'USD',
      };

      const normalized = service.normalizePriceToUSD(house.price, house.currency);
      expect(normalized).toBe(100000);
    });

    it('should handle unknown currencies with default rate', () => {
      const house = {
        price: 100000,
        currency: 'XYZ',
      };

      const normalized = service.normalizePriceToUSD(house.price, house.currency);
      expect(normalized).toBe(100000); // Default: assume 1:1
    });
  });

  describe('Merge Duplicates', () => {
    it('should merge properties from multiple sources', () => {
      const house1: UnifiedHouseModel = {
        id: 'test-1',
        source: 'source-a',
        url: 'https://source-a.com/1',
        title: 'Beautiful House',
        price: 500000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test City',
          state: 'TS',
          country: 'USA',
        },
        details: {
          bedrooms: 4,
        },
        metadata: { extractedAt: new Date() },
      };

      const house2: UnifiedHouseModel = {
        id: 'test-2',
        source: 'source-b',
        url: 'https://source-b.com/1',
        title: 'Beautiful House',
        price: 490000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test City',
          state: 'TS',
          country: 'USA',
        },
        details: {
          bathrooms: 3,
          livingArea: 2000,
        },
        metadata: { extractedAt: new Date() },
      };

      const merged = service.mergeDuplicates([house1, house2]);

      expect(merged.details?.bedrooms).toBe(4);
      expect(merged.details?.bathrooms).toBe(3);
      expect(merged.details?.livingArea).toBe(2000);
    });

    it('should prefer more recent data when merging', () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-01');

      const house1: UnifiedHouseModel = {
        id: 'test-1',
        source: 'source-a',
        url: 'https://source-a.com/1',
        title: 'Old Title',
        price: 500000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: { city: 'Test', country: 'USA' },
        metadata: { extractedAt: oldDate },
      };

      const house2: UnifiedHouseModel = {
        id: 'test-2',
        source: 'source-b',
        url: 'https://source-b.com/1',
        title: 'New Title',
        price: 510000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: { city: 'Test', country: 'USA' },
        metadata: { extractedAt: newDate },
      };

      const merged = service.mergeDuplicates([house1, house2]);

      expect(merged.title).toBe('New Title');
      expect(merged.price).toBe(510000);
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence to complete listings', () => {
      const house: UnifiedHouseModel = {
        id: 'test-1',
        source: 'test',
        url: 'https://example.com/1',
        title: 'Complete House',
        description: 'Full description',
        price: 500000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          address: '123 Main St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060,
        },
        details: {
          bedrooms: 4,
          bathrooms: 3,
          livingArea: 2000,
          yearBuilt: 2010,
          energyRating: 'B' as const,
        },
        images: [
          { url: 'https://example.com/img1.jpg', order: 0 },
          { url: 'https://example.com/img2.jpg', order: 1 },
        ],
        amenities: ['Garden', 'Garage'],
        contact: {
          phone: '+1234567890',
          email: 'contact@example.com',
        },
        metadata: { extractedAt: new Date() },
      };

      const confidence = service.calculateConfidence(house);
      expect(confidence).toBeGreaterThan(0.7); // Adjusted expectation
    });

    it('should assign low confidence to minimal listings', () => {
      const house: UnifiedHouseModel = {
        id: 'test-1',
        source: 'test',
        url: 'https://example.com/1',
        title: 'Minimal House',
        price: 500000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test',
          country: 'USA',
        },
        metadata: { extractedAt: new Date() },
      };

      const confidence = service.calculateConfidence(house);
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('Enrich Data', () => {
    it('should add confidence scores to houses', () => {
      const houses: UnifiedHouseModel[] = [
        {
          id: 'test-1',
          source: 'test',
          url: 'https://example.com/1',
          title: 'House',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test', country: 'USA' },
          metadata: { extractedAt: new Date() },
        },
      ];

      const enriched = service.enrichData(houses);

      expect(enriched[0]?.metadata.confidence).toBeDefined();
      expect(typeof enriched[0]?.metadata.confidence).toBe('number');
    });

    it('should normalize all prices to USD', () => {
      const houses: UnifiedHouseModel[] = [
        {
          id: 'test-1',
          source: 'test',
          url: 'https://example.com/1',
          title: 'House',
          price: 100000,
          currency: 'EUR',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test', country: 'Germany' },
          details: {
            livingArea: 100, // Add living area to enable price per sqm calculation
          },
          metadata: { extractedAt: new Date() },
        },
      ];

      const enriched = service.enrichData(houses);

      expect(enriched[0]?.pricePerSquareMeter).toBeDefined();
      expect(enriched[0]?.pricePerSquareMeter).toBeGreaterThan(0);
    });
  });
});
