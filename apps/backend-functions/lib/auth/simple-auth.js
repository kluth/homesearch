"use strict";
/**
 * Simple Authentication Triggers for Firebase
 *
 * NOTE: Full auth middleware and API endpoints are available but require Express.
 * To enable the complete user management API:
 * 1. cd apps/backend-functions
 * 2. pnpm install express @types/express
 * 3. Uncomment the imports in index.ts
 *
 * For now, these basic triggers handle user creation and validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeUserSignIn = exports.beforeUserCreate = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const domain_1 = require("@house-finder/domain");
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
 * Basic validation before allowing sign in
 */
exports.beforeUserSignIn = (0, identity_1.beforeUserSignedIn)(async (event) => {
    const user = event.data;
    if (!user?.uid) {
        throw new identity_1.HttpsError('invalid-argument', 'User ID is required');
    }
    // Additional validations can be added here
    // For full user status checking, see auth-functions.ts
});
//# sourceMappingURL=simple-auth.js.map