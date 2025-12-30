import { z } from 'zod';
import { UserRole } from './user-profile.js';

/**
 * JWT Custom Claims Schema
 * Claims that will be set in Firebase Auth custom claims
 */
export const CustomClaimsSchema = z.object({
  role: z.nativeEnum(UserRole),
  workspaceId: z.string(),
  permissions: z.array(z.string()).optional(),
  subscriptionPlan: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
});

export type CustomClaims = z.infer<typeof CustomClaimsSchema>;

/**
 * Auth Context Schema
 * Complete authentication context passed to Cloud Functions
 */
export const AuthContextSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().default(false),
  role: z.nativeEnum(UserRole),
  workspaceId: z.string(),
  customClaims: CustomClaimsSchema.optional(),
  token: z.object({
    iat: z.number(),
    exp: z.number(),
    aud: z.string(),
    iss: z.string(),
    sub: z.string(),
  }).passthrough(),
});

export type AuthContext = z.infer<typeof AuthContextSchema>;

/**
 * API Key Schema
 * For service-to-service authentication
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  workspaceId: z.string(),
  permissions: z.array(z.string()),
  status: z.enum(['active', 'revoked', 'expired']),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  usageCount: z.number().int().min(0).default(0),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
