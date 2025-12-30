import { z } from 'zod';

/**
 * Workspace Schema
 * Isolated workspace for user data and resources
 */
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Ownership
  ownerId: z.string(), // User ID of the workspace owner

  // Members (for team/shared workspaces)
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(['owner', 'admin', 'member', 'viewer']),
    joinedAt: z.date(),
  })).default([]),

  // Settings
  settings: z.object({
    allowInvites: z.boolean().default(false),
    requireApproval: z.boolean().default(true),
    maxMembers: z.number().int().min(1).default(1),
  }),

  // Resource limits
  limits: z.object({
    maxSavedSearches: z.number().int().min(0).default(10),
    maxFavorites: z.number().int().min(0).default(50),
    maxProperties: z.number().int().min(0).optional(), // For agents
    storageQuotaMB: z.number().int().min(0).default(100),
  }),

  // Usage statistics
  usage: z.object({
    savedSearches: z.number().int().min(0).default(0),
    favorites: z.number().int().min(0).default(0),
    properties: z.number().int().min(0).default(0),
    storageUsedMB: z.number().min(0).default(0),
  }),

  // Metadata
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  status: z.enum(['active', 'suspended', 'deleted']).default('active'),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

/**
 * Workspace Invitation Schema
 */
export const WorkspaceInvitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  invitedBy: z.string(), // User ID
  invitedEmail: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  createdAt: z.date(),
  expiresAt: z.date(),
  acceptedAt: z.date().optional(),
});

export type WorkspaceInvitation = z.infer<typeof WorkspaceInvitationSchema>;
