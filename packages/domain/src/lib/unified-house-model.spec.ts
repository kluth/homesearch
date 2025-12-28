import { describe, it, expect } from '@jest/globals';
import {
  UnifiedHouseModelSchema,
  PropertyType,
  ListingStatus,
  EnergyRating,
  type UnifiedHouseModel,
} from './unified-house-model';

describe('UnifiedHouseModel', () => {
  describe('Schema Validation', () => {
    it('should validate a complete house model', () => {
      const validHouse: UnifiedHouseModel = {
        id: 'house-123',
        source: 'immoscout24',
        url: 'https://www.immoscout24.de/expose/123',
        title: 'Beautiful Family Home',
        description: 'A lovely 4-bedroom house in a quiet neighborhood',
        price: 450000,
        currency: 'EUR',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          address: '123 Main Street',
          city: 'Berlin',
          state: 'Berlin',
          postalCode: '10115',
          country: 'Germany',
          latitude: 52.5200,
          longitude: 13.4050,
        },
        details: {
          bedrooms: 4,
          bathrooms: 2,
          livingArea: 150,
          lotSize: 300,
          yearBuilt: 2010,
          energyRating: EnergyRating.B,
          heatingType: 'Gas',
          parkingSpaces: 2,
          floors: 2,
        },
        amenities: ['Garden', 'Garage', 'Balcony'],
        images: [
          {
            url: 'https://example.com/image1.jpg',
            alt: 'Living room',
            order: 1,
          },
        ],
        contact: {
          name: 'John Doe Realty',
          phone: '+49 30 12345678',
          email: 'contact@johndoe-realty.com',
        },
        metadata: {
          extractedAt: new Date('2025-12-28T10:00:00Z'),
          lastUpdated: new Date('2025-12-28T10:00:00Z'),
          rawData: {},
        },
      };

      const result = UnifiedHouseModelSchema.safeParse(validHouse);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal house model with only required fields', () => {
      const minimalHouse = {
        id: 'house-456',
        source: 'zillow',
        url: 'https://www.zillow.com/homedetails/456',
        title: 'Cozy Apartment',
        price: 250000,
        currency: 'USD',
        propertyType: PropertyType.APARTMENT,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'New York',
          country: 'USA',
        },
        metadata: {
          extractedAt: new Date(),
        },
      };

      const result = UnifiedHouseModelSchema.safeParse(minimalHouse);
      expect(result.success).toBe(true);
    });

    it('should reject invalid property type', () => {
      const invalidHouse = {
        id: 'house-789',
        source: 'test',
        url: 'https://test.com',
        title: 'Test Property',
        price: 100000,
        currency: 'USD',
        propertyType: 'INVALID_TYPE',
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test City',
          country: 'Test Country',
        },
        metadata: {
          extractedAt: new Date(),
        },
      };

      const result = UnifiedHouseModelSchema.safeParse(invalidHouse);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const incompleteHouse = {
        id: 'house-999',
        source: 'test',
        // Missing: url, title, price, currency, propertyType, status, location, metadata
      };

      const result = UnifiedHouseModelSchema.safeParse(incompleteHouse);
      expect(result.success).toBe(false);
    });

    it('should handle optional details fields', () => {
      const houseWithPartialDetails = {
        id: 'house-111',
        source: 'test',
        url: 'https://test.com/111',
        title: 'Test House',
        price: 300000,
        currency: 'EUR',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Munich',
          country: 'Germany',
        },
        details: {
          bedrooms: 3,
          // Other fields are optional
        },
        metadata: {
          extractedAt: new Date(),
        },
      };

      const result = UnifiedHouseModelSchema.safeParse(houseWithPartialDetails);
      expect(result.success).toBe(true);
    });

    it('should validate image arrays correctly', () => {
      const houseWithImages = {
        id: 'house-222',
        source: 'test',
        url: 'https://test.com/222',
        title: 'House with Images',
        price: 400000,
        currency: 'USD',
        propertyType: PropertyType.CONDO,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Los Angeles',
          country: 'USA',
        },
        images: [
          { url: 'https://example.com/1.jpg', order: 1 },
          { url: 'https://example.com/2.jpg', alt: 'Kitchen', order: 2 },
        ],
        metadata: {
          extractedAt: new Date(),
        },
      };

      const result = UnifiedHouseModelSchema.safeParse(houseWithImages);
      expect(result.success).toBe(true);
    });

    it('should validate energy ratings', () => {
      const ratings = [
        EnergyRating.A_PLUS,
        EnergyRating.A,
        EnergyRating.B,
        EnergyRating.C,
        EnergyRating.D,
        EnergyRating.E,
        EnergyRating.F,
        EnergyRating.G,
        EnergyRating.H,
      ];

      ratings.forEach((rating) => {
        const house = {
          id: `house-${rating}`,
          source: 'test',
          url: 'https://test.com',
          title: 'Test',
          price: 100000,
          currency: 'EUR',
          propertyType: PropertyType.HOUSE,
          status: ListingStatus.ACTIVE,
          location: { city: 'Test', country: 'Test' },
          details: { energyRating: rating },
          metadata: { extractedAt: new Date() },
        };

        const result = UnifiedHouseModelSchema.safeParse(house);
        expect(result.success).toBe(true);
      });
    });

    it('should validate different listing statuses', () => {
      const statuses = [
        ListingStatus.ACTIVE,
        ListingStatus.PENDING,
        ListingStatus.SOLD,
        ListingStatus.OFF_MARKET,
      ];

      statuses.forEach((status) => {
        const house = {
          id: `house-${status}`,
          source: 'test',
          url: 'https://test.com',
          title: 'Test',
          price: 100000,
          currency: 'USD',
          propertyType: PropertyType.HOUSE,
          status,
          location: { city: 'Test', country: 'Test' },
          metadata: { extractedAt: new Date() },
        };

        const result = UnifiedHouseModelSchema.safeParse(house);
        expect(result.success).toBe(true);
      });
    });

    it('should validate coordinates within valid ranges', () => {
      const houseWithValidCoords = {
        id: 'house-coords',
        source: 'test',
        url: 'https://test.com',
        title: 'Test',
        price: 100000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test',
          country: 'Test',
          latitude: 45.5,
          longitude: -75.5,
        },
        metadata: { extractedAt: new Date() },
      };

      const result = UnifiedHouseModelSchema.safeParse(houseWithValidCoords);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const houseWithInvalidLat = {
        id: 'house-invalid-lat',
        source: 'test',
        url: 'https://test.com',
        title: 'Test',
        price: 100000,
        currency: 'USD',
        propertyType: PropertyType.HOUSE,
        status: ListingStatus.ACTIVE,
        location: {
          city: 'Test',
          country: 'Test',
          latitude: 95, // Invalid: > 90
          longitude: 0,
        },
        metadata: { extractedAt: new Date() },
      };

      const result = UnifiedHouseModelSchema.safeParse(houseWithInvalidLat);
      expect(result.success).toBe(false);
    });
  });
});
