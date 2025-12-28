import { z } from 'zod';

/**
 * Property type enumeration
 */
export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  MULTI_FAMILY = 'MULTI_FAMILY',
}

/**
 * Listing status enumeration
 */
export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  OFF_MARKET = 'OFF_MARKET',
}

/**
 * Energy rating enumeration (European standard)
 */
export enum EnergyRating {
  A_PLUS = 'A+',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
}

/**
 * Location schema with geocoding support
 */
export const LocationSchema = z.object({
  address: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  neighborhood: z.string().optional(),
  district: z.string().optional(),
});

/**
 * Property details schema
 */
export const PropertyDetailsSchema = z.object({
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  livingArea: z.number().positive().optional(), // in square meters
  lotSize: z.number().positive().optional(), // in square meters
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  energyRating: z.nativeEnum(EnergyRating).optional(),
  heatingType: z.string().optional(),
  coolingType: z.string().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  floors: z.number().int().positive().optional(),
  totalRooms: z.number().int().min(0).optional(),
  furnished: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  wheelchairAccessible: z.boolean().optional(),
});

/**
 * Image schema
 */
export const ImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  order: z.number().int().min(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/**
 * Contact information schema
 */
export const ContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  agentId: z.string().optional(),
});

/**
 * Metadata schema for tracking extraction information
 */
export const MetadataSchema = z.object({
  extractedAt: z.date(),
  lastUpdated: z.date().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  extractionVersion: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(), // Confidence score 0-1
});

/**
 * Unified House Model Schema
 * This is the central domain model that all scrapers and API clients map to
 */
export const UnifiedHouseModelSchema = z.object({
  // Unique identifier (combination of source + source ID)
  id: z.string(),

  // Source information
  source: z.string(), // e.g., 'immoscout24', 'zillow', 'local-broker'
  url: z.string().url(),

  // Basic information
  title: z.string(),
  description: z.string().optional(),

  // Pricing
  price: z.number().positive(),
  currency: z.string().length(3), // ISO 4217 currency code
  pricePerSquareMeter: z.number().positive().optional(),
  monthlyRent: z.number().positive().optional(), // For rental properties

  // Property classification
  propertyType: z.nativeEnum(PropertyType),
  status: z.nativeEnum(ListingStatus),

  // Location (required)
  location: LocationSchema,

  // Detailed information (optional)
  details: PropertyDetailsSchema.optional(),

  // Amenities and features
  amenities: z.array(z.string()).optional(),

  // Media
  images: z.array(ImageSchema).optional(),
  virtualTourUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),

  // Contact information
  contact: ContactSchema.optional(),

  // Additional fields
  listingDate: z.date().optional(),
  availableFrom: z.date().optional(),

  // Tags for categorization and search
  tags: z.array(z.string()).optional(),

  // Metadata (required)
  metadata: MetadataSchema,
});

/**
 * TypeScript type inference from Zod schema
 */
export type UnifiedHouseModel = z.infer<typeof UnifiedHouseModelSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

/**
 * Helper function to create a minimal valid house model
 */
export function createHouseModel(
  partial: Partial<UnifiedHouseModel> & Pick<UnifiedHouseModel, 'id' | 'source' | 'url' | 'title' | 'price' | 'currency' | 'propertyType' | 'status' | 'location'>
): UnifiedHouseModel {
  const model: UnifiedHouseModel = {
    ...partial,
    metadata: partial.metadata ?? {
      extractedAt: new Date(),
    },
  };

  return UnifiedHouseModelSchema.parse(model);
}
