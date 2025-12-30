/**
 * School Information Schemas
 *
 * Comprehensive school data for property searches.
 * Addresses User Story 8.1: School District Priority
 */

import { z } from 'zod';

/**
 * School Type
 */
export enum SchoolType {
  ELEMENTARY = 'elementary',
  MIDDLE = 'middle',
  HIGH = 'high',
  CHARTER = 'charter',
  PRIVATE = 'private',
  MAGNET = 'magnet',
  SPECIAL_EDUCATION = 'special_education',
  ALTERNATIVE = 'alternative',
}

/**
 * School Performance Level
 */
export enum PerformanceLevel {
  BELOW_AVERAGE = 'below_average',
  AVERAGE = 'average',
  ABOVE_AVERAGE = 'above_average',
  EXCELLENT = 'excellent',
}

/**
 * Test Score Schema
 */
export const TestScoreSchema = z.object({
  subject: z.string(),
  score: z.number().min(0).max(100),
  percentile: z.number().min(0).max(100),
  year: z.number(),
});

export type TestScore = z.infer<typeof TestScoreSchema>;

/**
 * School Demographics
 */
export const SchoolDemographicsSchema = z.object({
  totalStudents: z.number(),
  studentTeacherRatio: z.number(),
  percentEligibleFreeLunch: z.number().optional(),
  percentMinority: z.number().optional(),
  percentEnglishLearners: z.number().optional(),
  percentSpecialEducation: z.number().optional(),
});

export type SchoolDemographics = z.infer<typeof SchoolDemographicsSchema>;

/**
 * School Rating Source
 */
export enum RatingSource {
  GREAT_SCHOOLS = 'great_schools',
  NICHE = 'niche',
  SCHOOL_DIGGER = 'school_digger',
  STATE_DEPARTMENT = 'state_department',
  US_NEWS = 'us_news',
}

/**
 * School Rating
 */
export const SchoolRatingSchema = z.object({
  source: z.nativeEnum(RatingSource),
  rating: z.number().min(1).max(10),
  outOf: z.number().default(10),
  lastUpdated: z.date(),
  url: z.string().url().optional(),
});

export type SchoolRating = z.infer<typeof SchoolRatingSchema>;

/**
 * Parent Review
 */
export const ParentReviewSchema = z.object({
  id: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  comment: z.string(),
  postedBy: z.string(), // Anonymous or name
  postedAt: z.date(),
  helpful: z.number().default(0),
  topics: z.array(z.enum([
    'academics',
    'teachers',
    'facilities',
    'extracurriculars',
    'diversity',
    'safety',
    'administration',
  ])).optional(),
});

export type ParentReview = z.infer<typeof ParentReviewSchema>;

/**
 * School Boundary Coordinates
 */
export const BoundaryCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type BoundaryCoordinate = z.infer<typeof BoundaryCoordinateSchema>;

/**
 * School Contact Information
 */
export const SchoolContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  principalName: z.string().optional(),
});

export type SchoolContact = z.infer<typeof SchoolContactSchema>;

/**
 * Complete School Information
 */
export const SchoolInformationSchema = z.object({
  id: z.string(),
  ncessId: z.string().optional(), // National Center for Education Statistics ID

  // Basic Info
  name: z.string(),
  type: z.nativeEnum(SchoolType),
  grades: z.string(), // e.g., "K-5", "6-8", "9-12"

  // Location
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }),

  // District
  district: z.object({
    id: z.string(),
    name: z.string(),
    website: z.string().url().optional(),
  }),

  // Ratings & Performance
  ratings: z.array(SchoolRatingSchema),
  averageRating: z.number().min(1).max(10),
  performanceLevel: z.nativeEnum(PerformanceLevel),

  // Test Scores
  testScores: z.array(TestScoreSchema),

  // Demographics
  demographics: SchoolDemographicsSchema,

  // Boundary
  boundaryCoordinates: z.array(BoundaryCoordinateSchema).optional(),

  // Reviews
  parentReviews: z.array(ParentReviewSchema).optional(),
  averageParentRating: z.number().min(1).max(5).optional(),
  totalReviews: z.number().default(0),

  // Programs & Features
  programs: z.array(z.enum([
    'gifted_talented',
    'special_education',
    'english_language_learner',
    'stem',
    'arts',
    'sports',
    'advanced_placement',
    'international_baccalaureate',
    'dual_language',
    'montessori',
  ])).optional(),

  extracurriculars: z.array(z.string()).optional(),

  // Contact
  contact: SchoolContactSchema,

  // Metadata
  lastUpdated: z.date(),
  dataSource: z.string(), // e.g., "GreatSchools API"
  verified: z.boolean().default(false),
});

export type SchoolInformation = z.infer<typeof SchoolInformationSchema>;

/**
 * Property School Assignment
 * Links properties to their assigned schools
 */
export const PropertySchoolAssignmentSchema = z.object({
  propertyId: z.string(),
  address: z.string(),

  // Assigned Schools
  elementarySchool: z.object({
    schoolId: z.string(),
    name: z.string(),
    rating: z.number(),
    distance: z.number(), // Miles
  }).optional(),

  middleSchool: z.object({
    schoolId: z.string(),
    name: z.string(),
    rating: z.number(),
    distance: z.number(),
  }).optional(),

  highSchool: z.object({
    schoolId: z.string(),
    name: z.string(),
    rating: z.number(),
    distance: z.number(),
  }).optional(),

  // Nearby Private/Charter Options
  nearbySchools: z.array(z.object({
    schoolId: z.string(),
    name: z.string(),
    type: z.nativeEnum(SchoolType),
    rating: z.number(),
    distance: z.number(),
  })).optional(),

  // Summary
  averageRating: z.number(),
  bestRating: z.number(),
  worstRating: z.number(),

  // Verification
  verified: z.boolean().default(false),
  lastVerified: z.date().optional(),
});

export type PropertySchoolAssignment = z.infer<typeof PropertySchoolAssignmentSchema>;

/**
 * School Search Criteria
 */
export const SchoolSearchCriteriaSchema = z.object({
  minRating: z.number().min(1).max(10).optional(),
  types: z.array(z.nativeEnum(SchoolType)).optional(),
  programs: z.array(z.string()).optional(),
  maxDistance: z.number().optional(), // Miles from property
  performanceLevel: z.nativeEnum(PerformanceLevel).optional(),
});

export type SchoolSearchCriteria = z.infer<typeof SchoolSearchCriteriaSchema>;

/**
 * School Comparison
 * Compare multiple schools side-by-side
 */
export const SchoolComparisonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  schools: z.array(z.string()), // School IDs
  createdAt: z.date(),
  notes: z.string().optional(),
});

export type SchoolComparison = z.infer<typeof SchoolComparisonSchema>;
