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

import { beforeUserCreated, beforeUserSignedIn, HttpsError } from 'firebase-functions/v2/identity';
import { UserRole } from '@house-finder/domain';

/**
 * Before User Creation Trigger
 * Validates user data before account is created
 */
export const beforeUserCreate = beforeUserCreated(async (event) => {
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
      throw new HttpsError('invalid-argument', 'Disposable email addresses are not allowed');
    }
  }

  // Set default custom claims
  return {
    customClaims: {
      role: UserRole.USER,
      workspaceId: `workspace_${user?.uid}`,
    },
  };
});

/**
 * Before User Sign In Trigger
 * Basic validation before allowing sign in
 */
export const beforeUserSignIn = beforeUserSignedIn(async (event) => {
  const user = event.data;

  if (!user?.uid) {
    throw new HttpsError('invalid-argument', 'User ID is required');
  }

  // Additional validations can be added here
  // For full user status checking, see auth-functions.ts
});
