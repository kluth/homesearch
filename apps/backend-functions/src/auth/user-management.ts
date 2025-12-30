import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { UserProfile, UserRole, UserStatus, Workspace } from '@house-finder/domain';

/**
 * User Management Service
 * Handles user CRUD operations and custom claims
 */
export class UserManagementService {
  private firestore: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  constructor() {
    this.firestore = admin.firestore();
    this.auth = admin.auth();
  }

  /**
   * Create user profile in Firestore
   * Called when a new user signs up
   */
  async createUserProfile(uid: string, userData: {
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }): Promise<UserProfile> {
    try {
      // Create workspace for the user
      const workspaceId = `workspace_${uid}`;
      const now = new Date();

      const workspace: Workspace = {
        id: workspaceId,
        name: `${userData.displayName || userData.email}'s Workspace`,
        ownerId: uid,
        members: [{
          userId: uid,
          role: 'owner',
          joinedAt: now,
        }],
        settings: {
          allowInvites: false,
          requireApproval: true,
          maxMembers: 1,
        },
        limits: {
          maxSavedSearches: 10,
          maxFavorites: 50,
          storageQuotaMB: 100,
        },
        usage: {
          savedSearches: 0,
          favorites: 0,
          properties: 0,
          storageUsedMB: 0,
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
        status: 'active',
      };

      // Create user profile
      const userProfile: UserProfile = {
        uid,
        email: userData.email,
        emailVerified: userData.emailVerified || false,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: UserRole.USER,
        status: userData.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
        permissions: [],
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            newProperties: true,
            priceChanges: true,
            savedSearchAlerts: true,
          },
          privacy: {
            profileVisibility: 'private',
            showEmail: false,
            showPhone: false,
          },
          interface: {
            theme: 'auto',
            language: 'en',
            currency: 'USD',
            measurementUnit: 'metric',
          },
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          loginCount: 0,
          source: 'web',
        },
        workspaceId,
      };

      // Write to Firestore in batch
      const batch = this.firestore.batch();

      batch.set(this.firestore.collection('users').doc(uid), {
        ...userProfile,
        metadata: {
          ...userProfile.metadata,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        preferences: userProfile.preferences,
      });

      batch.set(this.firestore.collection('workspaces').doc(workspaceId), {
        ...workspace,
        members: workspace.members.map(m => ({
          ...m,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        })),
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      await batch.commit();

      // Set custom claims
      await this.setUserClaims(uid, {
        role: UserRole.USER,
        workspaceId,
      });

      logger.info('User profile created', { uid, workspaceId });

      return userProfile;
    } catch (error) {
      logger.error('Failed to create user profile', { uid, error });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await this.firestore.collection('users').doc(uid).update({
        ...updates,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('User profile updated', { uid });
    } catch (error) {
      logger.error('Failed to update user profile', { uid, error });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const doc = await this.firestore.collection('users').doc(uid).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as UserProfile;
    } catch (error) {
      logger.error('Failed to get user profile', { uid, error });
      throw error;
    }
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(uid);

      if (!userProfile) {
        logger.warn('User profile not found for deletion', { uid });
        return;
      }

      // Delete user data from Firestore
      const batch = this.firestore.batch();

      // Delete user profile
      batch.delete(this.firestore.collection('users').doc(uid));

      // Delete workspace if user is the owner
      if (userProfile.workspaceId) {
        const workspace = await this.firestore.collection('workspaces').doc(userProfile.workspaceId).get();

        if (workspace.exists && workspace.data()?.ownerId === uid) {
          batch.delete(this.firestore.collection('workspaces').doc(userProfile.workspaceId));

          // Delete user's saved searches
          const savedSearches = await this.firestore
            .collection('savedSearches')
            .where('workspaceId', '==', userProfile.workspaceId)
            .get();

          savedSearches.docs.forEach(doc => batch.delete(doc.ref));

          // Delete user's favorites
          const favorites = await this.firestore
            .collection('favorites')
            .where('workspaceId', '==', userProfile.workspaceId)
            .get();

          favorites.docs.forEach(doc => batch.delete(doc.ref));
        }
      }

      await batch.commit();

      // Delete from Firebase Auth
      await this.auth.deleteUser(uid);

      logger.info('User deleted', { uid });
    } catch (error) {
      logger.error('Failed to delete user', { uid, error });
      throw error;
    }
  }

  /**
   * Set custom claims for user
   */
  async setUserClaims(uid: string, claims: {
    role?: UserRole;
    workspaceId?: string;
    permissions?: string[];
    subscriptionPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  }): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
      logger.info('Custom claims set', { uid, claims });
    } catch (error) {
      logger.error('Failed to set custom claims', { uid, error });
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    try {
      // Update in Firestore
      await this.firestore.collection('users').doc(uid).update({
        role,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update custom claims
      const currentClaims = (await this.auth.getUser(uid)).customClaims || {};
      await this.setUserClaims(uid, {
        ...currentClaims,
        role,
      });

      logger.info('User role updated', { uid, role });
    } catch (error) {
      logger.error('Failed to update user role', { uid, error });
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(uid: string, status: UserStatus): Promise<void> {
    try {
      await this.firestore.collection('users').doc(uid).update({
        status,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      // If suspending, revoke all refresh tokens
      if (status === UserStatus.SUSPENDED) {
        await this.auth.revokeRefreshTokens(uid);
      }

      logger.info('User status updated', { uid, status });
    } catch (error) {
      logger.error('Failed to update user status', { uid, error });
      throw error;
    }
  }

  /**
   * Record user login
   */
  async recordLogin(uid: string, ip?: string): Promise<void> {
    try {
      await this.firestore.collection('users').doc(uid).update({
        'metadata.lastLoginAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.lastLoginIP': ip || null,
        'metadata.loginCount': admin.firestore.FieldValue.increment(1),
      });
    } catch (error) {
      logger.error('Failed to record login', { uid, error });
      // Don't throw - this is not critical
    }
  }

  /**
   * List users (admin only)
   */
  async listUsers(limit = 100, pageToken?: string): Promise<{
    users: UserProfile[];
    nextPageToken?: string;
  }> {
    try {
      let query = this.firestore.collection('users')
        .orderBy('metadata.createdAt', 'desc')
        .limit(limit);

      if (pageToken) {
        const snapshot = await this.firestore.collection('users').doc(pageToken).get();
        if (snapshot.exists) {
          query = query.startAfter(snapshot);
        }
      }

      const snapshot = await query.get();

      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      const nextPageToken = snapshot.docs.length === limit
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;

      return { users, nextPageToken };
    } catch (error) {
      logger.error('Failed to list users', { error });
      throw error;
    }
  }
}

// Singleton instance
export const userManagementService = new UserManagementService();
