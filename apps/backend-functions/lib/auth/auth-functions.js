"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.beforeUserSignIn = exports.beforeUserCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const identity_1 = require("firebase-functions/v2/identity");
const user_management_js_1 = require("./user-management.js");
const auth_middleware_js_1 = require("./auth-middleware.js");
const authorization_guards_js_1 = require("./authorization-guards.js");
const domain_1 = require("@house-finder/domain");
const v2_1 = require("firebase-functions/v2");
/**
 * Firebase Auth Triggers
 */
/**
 * Before User Creation Trigger
 * Validates user data before account is created
 */
exports.beforeUserCreate = (0, identity_1.beforeUserCreated)(async (event) => {
    const user = event.data;
    // Block disposable email domains
    const disposableEmailDomains = [
        'tempmail.com',
        'throwaway.email',
        '10minutemail.com',
        'guerrillamail.com',
    ];
    if (user?.email) {
        const emailDomain = user.email.split('@')[1]?.toLowerCase();
        if (emailDomain && disposableEmailDomains.includes(emailDomain)) {
            throw new identity_1.HttpsError('invalid-argument', 'Disposable email addresses are not allowed');
        }
    }
    // Set default custom claims
    return {
        customClaims: {
            role: domain_1.UserRole.USER,
            workspaceId: `workspace_${user?.uid}`,
        },
    };
});
/**
 * Before User Sign In Trigger
 * Check user status before allowing sign in
 */
exports.beforeUserSignIn = (0, identity_1.beforeUserSignedIn)(async (event) => {
    const user = event.data;
    if (!user?.uid) {
        throw new identity_1.HttpsError('invalid-argument', 'User ID is required');
    }
    // Get user profile from Firestore
    const userProfile = await user_management_js_1.userManagementService.getUserProfile(user.uid);
    if (!userProfile) {
        // User profile doesn't exist yet, allow sign in to create it
        return;
    }
    // Block suspended users
    if (userProfile.status === domain_1.UserStatus.SUSPENDED) {
        throw new identity_1.HttpsError('permission-denied', 'Your account has been suspended');
    }
    // Block deactivated users
    if (userProfile.status === domain_1.UserStatus.DEACTIVATED) {
        throw new identity_1.HttpsError('permission-denied', 'Your account has been deactivated');
    }
    // Record login
    await user_management_js_1.userManagementService.recordLogin(user.uid, event.ipAddress);
});
/**
 * Firestore Trigger: Create user profile when Firebase Auth user is created
 */
exports.onUserCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        v2_1.logger.error('No data associated with the event');
        return;
    }
    const userId = event.params.userId;
    v2_1.logger.info('User profile created in Firestore', { userId });
});
/**
 * User Management HTTP Functions
 */
// TODO: Install express to enable user management API
// const userApi = express();
/**
 * GET /profile
 * Get current user's profile
 */
userApi.get('/profile', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const profile = await user_management_js_1.userManagementService.getUserProfile(req.auth.uid);
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }
        res.json(profile);
    }
    catch (error) {
        v2_1.logger.error('Failed to get profile', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /profile
 * Update current user's profile
 */
userApi.patch('/profile', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const allowedFields = ['displayName', 'photoURL', 'phoneNumber', 'preferences'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        await user_management_js_1.userManagementService.updateUserProfile(req.auth.uid, updates);
        res.json({ success: true, message: 'Profile updated' });
    }
    catch (error) {
        v2_1.logger.error('Failed to update profile', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /profile/complete
 * Complete user profile after registration
 */
userApi.post('/profile/complete', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Check if profile already exists
        let profile = await user_management_js_1.userManagementService.getUserProfile(req.auth.uid);
        if (!profile) {
            // Create new profile
            profile = await user_management_js_1.userManagementService.createUserProfile(req.auth.uid, {
                email: req.auth.email || '',
                displayName: req.body.displayName,
                photoURL: req.body.photoURL,
                emailVerified: req.auth.emailVerified,
            });
        }
        res.json(profile);
    }
    catch (error) {
        v2_1.logger.error('Failed to complete profile', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * DELETE /profile
 * Delete current user's account
 */
userApi.delete('/profile', auth_middleware_js_1.authenticate, authorization_guards_js_1.requireEmailVerified, async (req, res) => {
    try {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        await user_management_js_1.userManagementService.deleteUser(req.auth.uid);
        res.json({ success: true, message: 'Account deleted' });
    }
    catch (error) {
        v2_1.logger.error('Failed to delete account', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * Admin-only endpoints
 */
/**
 * GET /admin/users
 * List all users (admin only)
 */
userApi.get('/admin/users', auth_middleware_js_1.authenticate, (0, authorization_guards_js_1.requireRole)(domain_1.UserRole.ADMIN, domain_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const pageToken = req.query.pageToken;
        const result = await user_management_js_1.userManagementService.listUsers(limit, pageToken);
        res.json(result);
    }
    catch (error) {
        v2_1.logger.error('Failed to list users', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /admin/users/:userId/role
 * Update user role (admin only)
 */
userApi.patch('/admin/users/:userId/role', auth_middleware_js_1.authenticate, (0, authorization_guards_js_1.requireRole)(domain_1.UserRole.ADMIN, domain_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!Object.values(domain_1.UserRole).includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }
        // Prevent non-super-admins from creating super admins
        if (role === domain_1.UserRole.SUPER_ADMIN && req.auth?.role !== domain_1.UserRole.SUPER_ADMIN) {
            res.status(403).json({ error: 'Only super admins can create super admins' });
            return;
        }
        await user_management_js_1.userManagementService.updateUserRole(userId, role);
        res.json({ success: true, message: 'Role updated' });
    }
    catch (error) {
        v2_1.logger.error('Failed to update user role', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /admin/users/:userId/status
 * Update user status (admin only)
 */
userApi.patch('/admin/users/:userId/status', auth_middleware_js_1.authenticate, (0, authorization_guards_js_1.requireRole)(domain_1.UserRole.ADMIN, domain_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!Object.values(domain_1.UserStatus).includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }
        await user_management_js_1.userManagementService.updateUserStatus(userId, status);
        res.json({ success: true, message: 'Status updated' });
    }
    catch (error) {
        v2_1.logger.error('Failed to update user status', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * DELETE /admin/users/:userId
 * Delete user account (admin only)
 */
userApi.delete('/admin/users/:userId', auth_middleware_js_1.authenticate, (0, authorization_guards_js_1.requireRole)(domain_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const { userId } = req.params;
        // Prevent self-deletion
        if (userId === req.auth?.uid) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }
        await user_management_js_1.userManagementService.deleteUser(userId);
        res.json({ success: true, message: 'User deleted' });
    }
    catch (error) {
        v2_1.logger.error('Failed to delete user', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Export as Cloud Function
// export const users = onRequest({
//   region: 'us-central1',
//   cors: true,
// }, userApi);
//# sourceMappingURL=auth-functions.js.map