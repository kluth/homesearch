"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userManagementService = exports.UserManagementService = void 0;
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const domain_1 = require("@house-finder/domain");
/**
 * User Management Service
 * Handles user CRUD operations and custom claims
 */
class UserManagementService {
    constructor() {
        this.firestore = admin.firestore();
        this.auth = admin.auth();
    }
    /**
     * Create user profile in Firestore
     * Called when a new user signs up
     */
    async createUserProfile(uid, userData) {
        try {
            // Create workspace for the user
            const workspaceId = `workspace_${uid}`;
            const now = new Date();
            const workspace = {
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
            const userProfile = {
                uid,
                email: userData.email,
                emailVerified: userData.emailVerified || false,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                role: domain_1.UserRole.USER,
                status: userData.emailVerified ? domain_1.UserStatus.ACTIVE : domain_1.UserStatus.PENDING_VERIFICATION,
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
                role: domain_1.UserRole.USER,
                workspaceId,
            });
            v2_1.logger.info('User profile created', { uid, workspaceId });
            return userProfile;
        }
        catch (error) {
            v2_1.logger.error('Failed to create user profile', { uid, error });
            throw error;
        }
    }
    /**
     * Update user profile
     */
    async updateUserProfile(uid, updates) {
        try {
            await this.firestore.collection('users').doc(uid).update({
                ...updates,
                'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });
            v2_1.logger.info('User profile updated', { uid });
        }
        catch (error) {
            v2_1.logger.error('Failed to update user profile', { uid, error });
            throw error;
        }
    }
    /**
     * Get user profile
     */
    async getUserProfile(uid) {
        try {
            const doc = await this.firestore.collection('users').doc(uid).get();
            if (!doc.exists) {
                return null;
            }
            return doc.data();
        }
        catch (error) {
            v2_1.logger.error('Failed to get user profile', { uid, error });
            throw error;
        }
    }
    /**
     * Delete user and all associated data
     */
    async deleteUser(uid) {
        try {
            const userProfile = await this.getUserProfile(uid);
            if (!userProfile) {
                v2_1.logger.warn('User profile not found for deletion', { uid });
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
            v2_1.logger.info('User deleted', { uid });
        }
        catch (error) {
            v2_1.logger.error('Failed to delete user', { uid, error });
            throw error;
        }
    }
    /**
     * Set custom claims for user
     */
    async setUserClaims(uid, claims) {
        try {
            await this.auth.setCustomUserClaims(uid, claims);
            v2_1.logger.info('Custom claims set', { uid, claims });
        }
        catch (error) {
            v2_1.logger.error('Failed to set custom claims', { uid, error });
            throw error;
        }
    }
    /**
     * Update user role
     */
    async updateUserRole(uid, role) {
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
            v2_1.logger.info('User role updated', { uid, role });
        }
        catch (error) {
            v2_1.logger.error('Failed to update user role', { uid, error });
            throw error;
        }
    }
    /**
     * Update user status
     */
    async updateUserStatus(uid, status) {
        try {
            await this.firestore.collection('users').doc(uid).update({
                status,
                'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });
            // If suspending, revoke all refresh tokens
            if (status === domain_1.UserStatus.SUSPENDED) {
                await this.auth.revokeRefreshTokens(uid);
            }
            v2_1.logger.info('User status updated', { uid, status });
        }
        catch (error) {
            v2_1.logger.error('Failed to update user status', { uid, error });
            throw error;
        }
    }
    /**
     * Record user login
     */
    async recordLogin(uid, ip) {
        try {
            await this.firestore.collection('users').doc(uid).update({
                'metadata.lastLoginAt': admin.firestore.FieldValue.serverTimestamp(),
                'metadata.lastLoginIP': ip || null,
                'metadata.loginCount': admin.firestore.FieldValue.increment(1),
            });
        }
        catch (error) {
            v2_1.logger.error('Failed to record login', { uid, error });
            // Don't throw - this is not critical
        }
    }
    /**
     * List users (admin only)
     */
    async listUsers(limit = 100, pageToken) {
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
            const users = snapshot.docs.map(doc => doc.data());
            const nextPageToken = snapshot.docs.length === limit
                ? snapshot.docs[snapshot.docs.length - 1].id
                : undefined;
            return { users, nextPageToken };
        }
        catch (error) {
            v2_1.logger.error('Failed to list users', { error });
            throw error;
        }
    }
}
exports.UserManagementService = UserManagementService;
// Singleton instance
exports.userManagementService = new UserManagementService();
//# sourceMappingURL=user-management.js.map