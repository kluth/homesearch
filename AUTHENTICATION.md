# House Finder - Authentication & Authorization Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Firebase Auth Setup](#firebase-auth-setup)
5. [Client Implementation](#client-implementation)
6. [API Authentication](#api-authentication)
7. [Workspace Isolation](#workspace-isolation)
8. [Security Rules](#security-rules)
9. [Testing Authentication](#testing-authentication)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The House Finder platform implements a comprehensive authentication and authorization system with:

- ✅ **Firebase Authentication** - Secure user sign-up and login
- ✅ **Role-Based Access Control (RBAC)** - Five user roles with granular permissions
- ✅ **Workspace Isolation** - Each user has isolated data space
- ✅ **Custom Claims** - JWT tokens with role and workspace information
- ✅ **Firestore Security Rules** - Database-level access control
- ✅ **Middleware & Guards** - API-level authorization
- ✅ **Multi-tenancy** - Support for team workspaces (future)

---

## Architecture

### Authentication Flow

```
┌─────────┐         ┌──────────────┐         ┌───────────────┐
│ Client  │────────▶│ Firebase Auth│────────▶│ Cloud Functions│
│         │◀────────│              │◀────────│                │
└─────────┘  ID Token └──────────────┘  Custom  └───────────────┘
                                         Claims
                    │
                    ▼
              ┌──────────────┐
              │   Firestore  │
              │Security Rules│
              └──────────────┘
```

### Components

1. **Firebase Auth** - Handles user sign-up, login, password reset
2. **Custom Claims** - Stores role, workspaceId in JWT
3. **Firestore Security Rules** - Enforces permissions at database level
4. **Auth Middleware** - Validates tokens in Cloud Functions
5. **Authorization Guards** - Checks roles and permissions

---

## User Roles & Permissions

### Role Hierarchy

```
USER → PREMIUM → AGENT → ADMIN → SUPER_ADMIN
```

### Role Definitions

#### 1. **USER** (Default)
Standard user with basic access.

**Permissions:**
- ✅ Browse properties (read)
- ✅ Save searches (CRUD on own searches)
- ✅ Favorite properties (CRUD on own favorites)
- ✅ Update own profile
- ❌ Create property listings
- ❌ Access admin features

**Use Cases:**
- Property seekers
- First-time users
- Free tier users

#### 2. **PREMIUM**
Enhanced user with advanced features.

**Additional Permissions:**
- ✅ Advanced search filters
- ✅ Price analytics
- ✅ Historical price data
- ✅ Market trends
- ✅ Unlimited saved searches

**Use Cases:**
- Paid subscribers
- Power users
- Serious property hunters

#### 3. **AGENT**
Real estate agents with listing capabilities.

**Additional Permissions:**
- ✅ Create property listings
- ✅ Update own listings
- ✅ Delete own listings
- ✅ Manage client database
- ✅ View analytics
- ✅ Lead management

**Use Cases:**
- Real estate agents
- Property managers
- Brokers

#### 4. **ADMIN**
System administrators.

**Additional Permissions:**
- ✅ Access all workspaces
- ✅ Manage all users
- ✅ Update user roles (except super_admin)
- ✅ View system analytics
- ✅ Manage all resources

**Use Cases:**
- Platform administrators
- Customer support team
- Operations team

#### 5. **SUPER_ADMIN**
Unrestricted access.

**Additional Permissions:**
- ✅ All admin permissions
- ✅ Create super admins
- ✅ Modify system configuration
- ✅ Access audit logs
- ✅ Emergency controls

**Use Cases:**
- Platform owners
- Technical leads
- Emergency access

### Permission Matrix

| Resource | USER | PREMIUM | AGENT | ADMIN | SUPER_ADMIN |
|----------|------|---------|-------|-------|-------------|
| Browse Properties | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Listings | ❌ | ❌ | ✅ | ✅ | ✅ |
| Advanced Search | ❌ | ✅ | ✅ | ✅ | ✅ |
| Price Analytics | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Clients | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Firebase Auth Setup

### 1. Enable Authentication Providers

#### Email/Password (Required)

```bash
# In Firebase Console:
# 1. Go to Authentication → Sign-in method
# 2. Enable "Email/Password"
# 3. Enable "Email link (passwordless sign-in)" (optional)
```

#### OAuth Providers (Optional)

Enable additional providers for better UX:

- **Google Sign-In** - Recommended for quick onboarding
- **Facebook Login** - Social media integration
- **Apple Sign-In** - Required for iOS apps
- **Microsoft** - Enterprise users

### 2. Configure Email Templates

Customize email templates for better branding:

```bash
# In Firebase Console:
# Authentication → Templates

# Customize:
# - Email verification
# - Password reset
# - Email address change
# - SMS verification (if using phone auth)
```

### 3. Set Up Custom Claims

Custom claims are automatically set when users sign up through the `beforeUserCreate` trigger.

**Claims Structure:**

```typescript
{
  role: 'user' | 'premium' | 'agent' | 'admin' | 'super_admin',
  workspaceId: 'workspace_<userId>',
  permissions: ['properties:read', 'savedSearches:manage', ...],
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise'
}
```

### 4. User Registration Flow

When a new user signs up:

1. **Firebase Auth** creates the authentication record
2. **beforeUserCreate** trigger sets initial custom claims
3. **Cloud Function** creates user profile in Firestore
4. **Cloud Function** creates isolated workspace
5. **Email verification** sent (if enabled)

---

## Client Implementation

### Web (JavaScript/TypeScript)

#### 1. Install Firebase SDK

```bash
npm install firebase
```

#### 2. Initialize Firebase

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "house-finder-production.firebaseapp.com",
  projectId: "house-finder-production",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### 3. Sign Up

```typescript
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

async function signUp(email: string, password: string, displayName: string) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Complete profile setup
    const idToken = await user.getIdToken();
    await fetch('https://us-central1-house-finder-production.cloudfunctions.net/users/profile/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName }),
    });

    console.log('User registered successfully');
  } catch (error) {
    console.error('Sign up error:', error);
  }
}
```

#### 4. Sign In

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get ID token with custom claims
    const idTokenResult = await user.getIdTokenResult();

    console.log('User role:', idTokenResult.claims.role);
    console.log('Workspace ID:', idTokenResult.claims.workspaceId);

    return user;
  } catch (error) {
    console.error('Sign in error:', error);
  }
}
```

#### 5. Making Authenticated Requests

```typescript
import { auth } from './firebase';

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get fresh ID token
  const idToken = await user.getIdToken();

  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });
}

// Example: Get user profile
const response = await makeAuthenticatedRequest(
  'https://us-central1-house-finder-production.cloudfunctions.net/users/profile'
);
const profile = await response.json();
```

#### 6. Role-Based UI

```typescript
import { useAuth } from './hooks/useAuth';

function Dashboard() {
  const { user, role } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Everyone can see properties */}
      <PropertyList />

      {/* Premium and above can see analytics */}
      {['premium', 'agent', 'admin', 'super_admin'].includes(role) && (
        <PriceAnalytics />
      )}

      {/* Only agents can create listings */}
      {['agent', 'admin', 'super_admin'].includes(role) && (
        <CreateListing />
      )}

      {/* Only admins can manage users */}
      {['admin', 'super_admin'].includes(role) && (
        <UserManagement />
      )}
    </div>
  );
}
```

### Mobile (React Native)

Similar to web implementation using `@react-native-firebase/auth`.

---

## API Authentication

### Method 1: Firebase ID Token (Recommended)

**For User Clients:**

```bash
curl -X GET \
  https://us-central1-house-finder-production.cloudfunctions.net/users/profile \
  -H "Authorization: Bearer <ID_TOKEN>"
```

**How to Get ID Token:**

```typescript
const idToken = await auth.currentUser.getIdToken();
```

### Method 2: API Key

**For Service-to-Service:**

```bash
curl -X GET \
  https://us-central1-house-finder-production.cloudfunctions.net/properties \
  -H "X-API-Key: <API_KEY>"
```

**Create API Key:**

```typescript
// Admin endpoint
POST /users/admin/api-keys
{
  "name": "Production Service",
  "permissions": ["properties:read"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

## Workspace Isolation

### Concept

Each user has an isolated workspace for their data:

- Saved searches
- Favorites
- Interactions
- Preferences

### Workspace Structure

```typescript
{
  id: 'workspace_<userId>',
  name: "John's Workspace",
  ownerId: '<userId>',
  members: [{
    userId: '<userId>',
    role: 'owner',
    joinedAt: '2025-12-30T...',
  }],
  limits: {
    maxSavedSearches: 10,    // Free tier
    maxFavorites: 50,
    storageQuotaMB: 100,
  },
  usage: {
    savedSearches: 5,
    favorites: 23,
    storageUsedMB: 12.5,
  }
}
```

### Data Isolation

All user-specific collections include `workspaceId`:

```typescript
// Saved search document
{
  id: 'search_123',
  workspaceId: 'workspace_user_abc',  // ← Isolates data
  userId: 'user_abc',
  query: { ... },
  // ...
}
```

**Security Rule:**

```javascript
match /savedSearches/{searchId} {
  allow read: if ownsWorkspace(resource.data.workspaceId);
}
```

Users can only access data in their workspace!

---

## Security Rules

### Key Helper Functions

```javascript
// Check if user owns workspace
function ownsWorkspace(workspaceId) {
  return request.auth.token.workspaceId == workspaceId;
}

// Check if user has role
function hasRole(role) {
  return request.auth.token.role == role;
}

// Check if user is admin
function isAdmin() {
  return hasAnyRole(['admin', 'super_admin']);
}
```

### Example Rules

#### User can only read own profile:

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
}
```

#### User can only access own workspace:

```javascript
match /workspaces/{workspaceId} {
  allow read: if ownsWorkspace(workspaceId) || isAdmin();
}
```

#### Agents can create listings:

```javascript
match /properties/{propertyId} {
  allow create: if hasAnyRole(['agent', 'admin', 'super_admin']);
}
```

---

## Testing Authentication

### 1. Test User Registration

```bash
# Create test user
curl -X POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "returnSecureToken": true
  }'
```

### 2. Test Authentication Flow

```typescript
import { auth } from './firebase';

// Sign in
const user = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');

// Get token with claims
const idTokenResult = await user.getIdTokenResult();

console.log('Claims:', idTokenResult.claims);
// Should include: role, workspaceId

// Test authenticated endpoint
const response = await fetch('...', {
  headers: { 'Authorization': `Bearer ${idTokenResult.token}` }
});
```

### 3. Test Role-Based Access

```typescript
// Try accessing admin endpoint as regular user (should fail)
const response = await fetch('.../admin/users', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});

console.log(response.status); // 403 Forbidden
```

### 4. Test Workspace Isolation

```typescript
// User A creates saved search
const searchA = await createSavedSearch(userAToken, { query: '...' });

// User B tries to access User A's search (should fail)
const response = await fetch(`.../savedSearches/${searchA.id}`, {
  headers: { 'Authorization': `Bearer ${userBToken}` }
});

console.log(response.status); // 403 Forbidden
```

---

## Troubleshooting

### "User not authenticated"

**Cause:** Missing or invalid ID token

**Solution:**
```typescript
// Refresh token
const idToken = await auth.currentUser.getIdToken(true); // force refresh
```

### "Insufficient permissions"

**Cause:** User role doesn't have required permission

**Solution:**
1. Check user role: `idTokenResult.claims.role`
2. Verify role has permission in `ROLE_PERMISSIONS`
3. Update role if needed (admin only)

### "Email not verified"

**Cause:** Email verification required for endpoint

**Solution:**
```typescript
await sendEmailVerification(auth.currentUser);
```

### "Workspace access denied"

**Cause:** Trying to access another user's workspace

**Solution:**
- Ensure `workspaceId` in request matches user's workspace
- Don't manually specify `workspaceId` - it's injected automatically

### Custom claims not updating

**Cause:** Token needs refresh after role change

**Solution:**
```typescript
// Force token refresh
await auth.currentUser.getIdToken(true);

// Or sign out and back in
await signOut(auth);
await signInWithEmailAndPassword(auth, email, password);
```

---

## Best Practices

### 1. Always Validate Tokens Server-Side

❌ **Don't trust client-side checks:**

```typescript
// Client checks role (can be manipulated!)
if (userRole === 'admin') {
  // Show admin panel
}
```

✅ **Validate on server:**

```typescript
// Server validates token and checks role
app.get('/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  // Only executes if user is actually admin
});
```

### 2. Use Short-Lived Tokens

- ID tokens expire after 1 hour (default)
- Refresh tokens before expiry
- Don't store tokens in localStorage (use httpOnly cookies if possible)

### 3. Implement Rate Limiting

```typescript
// Prevent brute force attacks
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};
```

### 4. Log Security Events

```typescript
// Log failed authentication attempts
logger.warn('Failed login attempt', {
  email,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});
```

### 5. Enable MFA (Multi-Factor Authentication)

```typescript
import { multiFactor } from 'firebase/auth';

// Enroll in MFA
await multiFactor(user).enroll(phoneAuthCredential, 'My Phone');
```

---

## Next Steps

1. ✅ Set up Firebase Authentication providers
2. ✅ Test user registration and login
3. ✅ Implement role-based UI in client
4. ✅ Test security rules in emulator
5. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
6. ✅ Monitor authentication metrics in Firebase Console

---

**Last Updated:** 2025-12-30
**Maintained By:** Development Team
