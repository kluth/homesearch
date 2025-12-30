import { z } from 'zod';

/**
 * User Role Enumeration
 * Defines the hierarchy of user permissions in the system
 */
export enum UserRole {
  /** Standard user with basic access */
  USER = 'user',
  /** Premium user with advanced features */
  PREMIUM = 'premium',
  /** Agent with property listing capabilities */
  AGENT = 'agent',
  /** Administrator with full system access */
  ADMIN = 'admin',
  /** Super admin with unrestricted access */
  SUPER_ADMIN = 'super_admin',
}

/**
 * User Status Enumeration
 */
export enum UserStatus {
  /** Active user account */
  ACTIVE = 'active',
  /** Suspended user account */
  SUSPENDED = 'suspended',
  /** Pending email verification */
  PENDING_VERIFICATION = 'pending_verification',
  /** Deactivated account */
  DEACTIVATED = 'deactivated',
}

/**
 * Permission Schema
 * Granular permissions for fine-grained access control
 */
export const PermissionSchema = z.object({
  resource: z.string(),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete', 'list', 'manage'])),
});

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * User Subscription Schema
 */
export const UserSubscriptionSchema = z.object({
  plan: z.enum(['free', 'basic', 'premium', 'enterprise']),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']),
  startDate: z.date(),
  endDate: z.date().optional(),
  autoRenew: z.boolean().default(true),
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

/**
 * User Preferences Schema
 * Extended preferences for personalization
 */
export const UserPreferencesSchema = z.object({
  // Notification preferences
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    newProperties: z.boolean().default(true),
    priceChanges: z.boolean().default(true),
    savedSearchAlerts: z.boolean().default(true),
  }),

  // Privacy settings
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts_only']).default('private'),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
  }),

  // UI preferences
  interface: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    language: z.string().default('en'),
    currency: z.string().length(3).default('USD'),
    measurementUnit: z.enum(['metric', 'imperial']).default('metric'),
  }),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * User Profile Schema
 * Complete user profile with authentication and authorization data
 */
export const UserProfileSchema = z.object({
  // Core identity
  uid: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),

  // Profile information
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().optional(),

  // Authorization
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING_VERIFICATION),
  permissions: z.array(PermissionSchema).default([]),

  // Subscription
  subscription: UserSubscriptionSchema.optional(),

  // Preferences
  preferences: UserPreferencesSchema.optional(),

  // Metadata
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date().optional(),
    lastLoginIP: z.string().optional(),
    loginCount: z.number().int().min(0).default(0),
    source: z.string().optional(), // Registration source (web, mobile, oauth)
    referralCode: z.string().optional(),
  }),

  // Workspace
  workspaceId: z.string(), // User's isolated workspace ID

  // Additional data
  customClaims: z.record(z.string(), z.unknown()).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Role Permissions Mapping
 * Define what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    { resource: 'properties', actions: ['read', 'list'] },
    { resource: 'savedSearches', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'favorites', actions: ['create', 'read', 'delete', 'list'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],

  [UserRole.PREMIUM]: [
    { resource: 'properties', actions: ['read', 'list'] },
    { resource: 'savedSearches', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'favorites', actions: ['create', 'read', 'delete', 'list'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'advancedSearch', actions: ['read', 'list'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'priceHistory', actions: ['read'] },
  ],

  [UserRole.AGENT]: [
    { resource: 'properties', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'savedSearches', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'favorites', actions: ['create', 'read', 'delete', 'list'] },
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'listings', actions: ['create', 'read', 'update', 'delete', 'list', 'manage'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'analytics', actions: ['read', 'list'] },
  ],

  [UserRole.ADMIN]: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete', 'list', 'manage'] },
  ],

  [UserRole.SUPER_ADMIN]: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete', 'list', 'manage'] },
  ],
};

/**
 * Public User Profile Schema
 * Limited user information for public display
 */
export const PublicUserProfileSchema = UserProfileSchema.pick({
  uid: true,
  displayName: true,
  photoURL: true,
  role: true,
}).extend({
  email: z.string().email().optional(), // Only if user allows it in privacy settings
  phoneNumber: z.string().optional(), // Only if user allows it in privacy settings
});

export type PublicUserProfile = z.infer<typeof PublicUserProfileSchema>;
