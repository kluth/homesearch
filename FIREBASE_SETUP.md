# Firebase Setup Guide - House Finder Engine

This guide provides **super-granular, step-by-step instructions** for configuring Firebase projects to run the House Finder Engine with all authentication, database, functions, and monetization features.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Console Project Setup](#firebase-console-project-setup)
3. [Firebase Authentication Setup](#firebase-authentication-setup)
4. [Firestore Database Setup](#firestore-database-setup)
5. [Firebase Storage Setup](#firebase-storage-setup)
6. [Firebase Functions Configuration](#firebase-functions-configuration)
7. [Payment Provider Integration](#payment-provider-integration)
8. [Environment Variables & Secrets](#environment-variables--secrets)
9. [Security Rules Deployment](#security-rules-deployment)
10. [Custom Claims Setup](#custom-claims-setup)
11. [Firebase Extensions](#firebase-extensions)
12. [Testing & Verification](#testing--verification)
13. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Accounts

- [ ] **Google Account** with billing enabled
- [ ] **Stripe Account** (for payment processing)
- [ ] **PayPal Developer Account** (optional, for PayPal payments)
- [ ] **Node.js** v18+ installed
- [ ] **Firebase CLI** v13+ installed

### Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
# Should show v13.0.0 or higher

# Login to Firebase
firebase login
# This will open a browser window for authentication
```

### Check Node.js Version

```bash
node --version
# Should show v18.0.0 or higher

npm --version
# Should show v9.0.0 or higher
```

---

## Firebase Console Project Setup

### Step 1: Create Firebase Project

1. **Open Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Click **"Add project"** (blue button in center or top-right)

2. **Enter Project Details**
   - **Project name**: `house-finder-production` (or your preferred name)
   - Click **"Continue"**

3. **Google Analytics Configuration**
   - **Enable Google Analytics**: Toggle **ON** (recommended)
   - Click **"Continue"**

4. **Configure Google Analytics**
   - **Analytics account**: Select existing or create new
     - If creating new: Enter name like `House Finder Analytics`
   - **Analytics location**: Select your country
   - Accept terms and click **"Create project"**

5. **Wait for Project Creation**
   - Progress bar will show (~30 seconds)
   - Click **"Continue"** when ready

### Step 2: Upgrade to Blaze Plan (Required for Functions)

1. **Navigate to Billing**
   - In left sidebar, click **⚙️ (gear icon)** → **"Usage and billing"**
   - Click **"Details & settings"** tab

2. **Upgrade Plan**
   - Click **"Modify plan"** button
   - Select **"Blaze (pay as you go)"**
   - Click **"Purchase"**

3. **Set Up Billing**
   - **Billing account**: Select existing or create new
   - If creating new:
     - Enter **billing address**
     - Enter **payment method** (credit card)
     - Click **"Confirm purchase"**

4. **Set Budget Alerts** (Recommended)
   - Click **"Set budget"**
   - **Budget amount**: $50 (adjust as needed)
   - **Alert threshold**: 50%, 90%, 100%
   - **Email recipients**: Your email
   - Click **"Save"**

### Step 3: Register Web App

1. **Add Web App**
   - In Firebase Console overview, click **"</> (Web icon)"**
   - Or click **"Add app"** → **"Web"**

2. **Configure Web App**
   - **App nickname**: `House Finder Web App`
   - **Firebase Hosting**: ✅ Check this box
   - Click **"Register app"**

3. **Save Firebase Config**
   - You'll see a config object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "house-finder-production.firebaseapp.com",
     projectId: "house-finder-production",
     storageBucket: "house-finder-production.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
     measurementId: "G-ABCDEFGH"
   };
   ```
   - **Copy this entire object** and save to `.env.local` file in your frontend app
   - Click **"Continue to console"**

### Step 4: Enable Required Firebase Services

#### Enable Firestore

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"** button
3. **Select location**:
   - **Production mode** (we'll deploy rules later)
   - Click **"Next"**
4. **Choose location**:
   - Select closest region (e.g., `us-central1`, `europe-west1`)
   - ⚠️ **This cannot be changed later**
   - Click **"Enable"**
5. Wait for provisioning (~1 minute)

#### Enable Firebase Storage

1. Click **"Storage"** in left sidebar
2. Click **"Get started"**
3. **Security rules**:
   - Select **"Start in production mode"**
   - Click **"Next"**
4. **Storage location**:
   - Should match Firestore location
   - Click **"Done"**

#### Enable Firebase Hosting

1. Click **"Hosting"** in left sidebar
2. Click **"Get started"**
3. Follow CLI setup (we'll do this later)
4. Click **"Finish"**

---

## Firebase Authentication Setup

### Step 1: Enable Authentication

1. **Navigate to Authentication**
   - Click **"Authentication"** in left sidebar
   - Click **"Get started"**

### Step 2: Enable Email/Password Provider

1. **Navigate to Sign-in Methods**
   - Click **"Sign-in method"** tab
   - Click **"Email/Password"** row

2. **Configure Email/Password**
   - **Email/Password**: Toggle **ON**
   - **Email link (passwordless sign-in)**: Toggle **OFF** (unless you want passwordless)
   - Click **"Save"**

### Step 3: Enable Google Sign-In

1. **Add Google Provider**
   - Click **"Add new provider"**
   - Select **"Google"**

2. **Configure Google**
   - **Enable**: Toggle **ON**
   - **Project support email**: Select your email from dropdown
   - **Project public-facing name**: `House Finder`
   - Click **"Save"**

3. **Copy OAuth Credentials** (for local development)
   - Click on **"Google"** provider row
   - Copy **"Web SDK configuration"** → **"Web client ID"**
   - Save to `.env.local` as `VITE_GOOGLE_CLIENT_ID=...`

### Step 4: Enable Additional Providers (Optional)

#### Apple Sign-In

1. Click **"Add new provider"** → **"Apple"**
2. **Enable**: Toggle **ON**
3. **Apple Services ID**: Enter your Apple Services ID
4. **Apple Team ID**: Enter your Apple Team ID
5. **Private key**: Upload your `.p8` key file
6. **Key ID**: Enter your key ID
7. Click **"Save"**

#### GitHub Sign-In

1. Go to GitHub: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. **Application name**: `House Finder`
4. **Homepage URL**: `https://house-finder-production.web.app`
5. **Authorization callback URL**:
   - Copy from Firebase Console (shown in setup)
   - Example: `https://house-finder-production.firebaseapp.com/__/auth/handler`
6. Click **"Register application"**
7. Copy **"Client ID"** and **"Client Secret"**
8. Back in Firebase Console:
   - Click **"Add new provider"** → **"GitHub"**
   - **Enable**: Toggle **ON**
   - Paste **Client ID** and **Client Secret**
   - Click **"Save"**

### Step 5: Configure Authorized Domains

1. **Navigate to Settings**
   - Click **"Settings"** tab in Authentication

2. **Add Authorized Domains**
   - Scroll to **"Authorized domains"**
   - By default includes:
     - `localhost` (for local development)
     - `your-project.firebaseapp.com`
     - `your-project.web.app`

3. **Add Custom Domain** (if applicable)
   - Click **"Add domain"**
   - Enter: `yourdomain.com`
   - Click **"Add"**

### Step 6: Configure User Actions

1. **Email Templates**
   - Click **"Templates"** tab
   - Customize:
     - **Password reset email**
     - **Email address verification**
     - **Email address change**

   For each template:
   - Click **pencil icon** to edit
   - Customize **sender name**: `House Finder Team`
   - Customize **subject** and **body**
   - Click **"Save"**

2. **Sender Email Configuration**
   - Scroll to **"Sender email configuration"**
   - **Display name**: `House Finder`
   - **Reply-to email**: `support@yourdomain.com` (or use Firebase default)
   - Click **"Save"**

---

## Firestore Database Setup

### Step 1: Review Database Structure

Your Firestore will use these collections:

```
/users/{userId}
/workspaces/{workspaceId}
/workspace_members/{memberId}
/invitations/{invitationId}
/properties/{propertyId}
/savedSearches/{searchId}
/favorites/{favoriteId}
/subscriptions/{subscriptionId}
/payment_intents/{intentId}
/payment_methods/{methodId}
/promoted_listings/{promotionId}
/ad_placements/{adId}
/waiting_content_language/{lessonId}
/waiting_content_cultural/{insightId}
/waiting_content_progress/{userId}
/usage_tracking/{workspaceId}
```

### Step 2: Create Composite Indexes

Firestore requires composite indexes for complex queries.

1. **Navigate to Indexes**
   - Click **"Firestore Database"** → **"Indexes"** tab

2. **Create Indexes Manually** or use `firestore.indexes.json`:

Create file: `firestore.indexes.json` in project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "location.city", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "savedSearches",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "favorites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "promoted_listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "promoted_listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "subscriptions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "currentPeriodEnd", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workspace_members",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

3. **Deploy Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Wait for Index Creation**
   - Large indexes can take 5-30 minutes
   - Check progress in Firebase Console → Firestore → Indexes
   - Status will show **"Building"** then **"Enabled"**

### Step 3: Set Up Initial Collections (Optional)

You can create collections via Console for testing:

1. **Create Test User**
   - Click **"Firestore Database"** → **"Data"** tab
   - Click **"Start collection"**
   - **Collection ID**: `users`
   - Click **"Next"**
   - **Document ID**: (auto-generate or use Firebase Auth UID)
   - Add fields:
     ```
     email: "test@example.com"
     role: "user"
     createdAt: (timestamp) now
     ```
   - Click **"Save"**

---

## Firebase Storage Setup

### Step 1: Configure Storage Buckets

1. **Navigate to Storage**
   - Click **"Storage"** in left sidebar

2. **Default Bucket**
   - Already created: `your-project.appspot.com`
   - Used for: Property images, user avatars, documents

3. **Create Additional Buckets** (Optional)
   - Click **"Add bucket"**
   - **Bucket ID**: `house-images-cdn`
   - **Location**: Same as Firestore
   - Click **"Continue"**

### Step 2: Configure CORS for Web Access

Create `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

Deploy CORS configuration:

```bash
# Install Google Cloud SDK first
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project house-finder-production

# Apply CORS
gsutil cors set cors.json gs://house-finder-production.appspot.com
```

### Step 3: Storage Security Rules

Create `storage.rules` file in project root:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // User avatars
    match /avatars/{userId}/{filename} {
      allow read: if true;
      allow write: if isAuthenticated() && isOwner(userId);
    }

    // Property images
    match /properties/{workspaceId}/{propertyId}/{filename} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    // Documents (contracts, etc.)
    match /documents/{workspaceId}/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Uploaded CSV files
    match /imports/{workspaceId}/{filename} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

Deploy storage rules:

```bash
firebase deploy --only storage
```

---

## Firebase Functions Configuration

### Step 1: Initialize Firebase Functions

1. **Initialize Firebase in Project**
   ```bash
   cd /home/user/homesearch

   # Initialize Firebase (if not already done)
   firebase init
   ```

2. **Select Features**
   - Use **spacebar** to select, **enter** to confirm:
     - ✅ Firestore
     - ✅ Functions
     - ✅ Hosting
     - ✅ Storage

3. **Configure Functions**
   - **Language**: TypeScript
   - **ESLint**: Yes
   - **Install dependencies**: Yes

4. **Configure Firestore**
   - **Rules file**: `firestore.rules` (default)
   - **Indexes file**: `firestore.indexes.json` (default)

5. **Configure Hosting**
   - **Public directory**: `dist` (or your build output)
   - **Single-page app**: Yes
   - **Automatic builds**: No (for now)

### Step 2: Update Firebase Functions Package.json

Navigate to: `apps/backend-functions/package.json`

Add payment provider dependencies:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "stripe": "^14.0.0",
    "paypal-rest-sdk": "^1.8.1",
    "zod": "^3.22.0"
  }
}
```

Install dependencies:

```bash
cd apps/backend-functions
npm install
```

### Step 3: Create Firebase Functions Entry Point

Create `apps/backend-functions/src/index.ts`:

```typescript
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { SubscriptionService } from './monetization/subscription-service';
import { PromotionService } from './monetization/promotion-service';
import { WaitingContentService } from './monetization/waiting-content-service';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// HTTPS Callable Functions
// ============================================================================

/**
 * Create a new subscription
 */
export const createSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const subscriptionService = new SubscriptionService(db);

  const subscription = await subscriptionService.createSubscription(
    context.auth.uid,
    data.workspaceId,
    data.plan,
    data.interval,
    data.paymentProvider,
    data.paymentMethodId
  );

  return { subscription };
});

/**
 * Cancel subscription
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const subscriptionService = new SubscriptionService(db);

  await subscriptionService.cancelSubscription(
    data.subscriptionId,
    data.immediately || false
  );

  return { success: true };
});

/**
 * Create promoted listing
 */
export const createPromotedListing = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const promotionService = new PromotionService(db);

  const promotion = await promotionService.createPromotedListing(
    data.propertyId,
    context.auth.uid,
    data.type,
    data.durationDays,
    data.paymentProvider,
    data.paymentMethodId
  );

  return { promotion };
});

/**
 * Get recommended waiting content for user
 */
export const getRecommendedContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const contentService = new WaitingContentService(db);

  const content = await contentService.getRecommendedContent(
    context.auth.uid,
    data.limit || 5
  );

  return { content };
});

/**
 * Complete a lesson/content piece
 */
export const completeLesson = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const contentService = new WaitingContentService(db);

  const progress = await contentService.completeLesson(
    context.auth.uid,
    data.lessonId,
    data.score || 0
  );

  return { progress };
});

// ============================================================================
// Scheduled Functions
// ============================================================================

/**
 * Expire old promotions (runs daily at 2 AM)
 */
export const expirePromotions = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const promotionService = new PromotionService(db);
    const expired = await promotionService.expireOldPromotions();

    console.log(`Expired ${expired} promotions`);
    return null;
  });

/**
 * Process subscription renewals (runs daily at 1 AM)
 */
export const processSubscriptionRenewals = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const subscriptionService = new SubscriptionService(db);

    const today = new Date();
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '<=', today)
      .get();

    let processed = 0;

    for (const doc of subscriptionsSnapshot.docs) {
      try {
        // Process renewal logic here
        // This would charge the payment method and extend the subscription
        processed++;
      } catch (error) {
        console.error(`Failed to renew subscription ${doc.id}:`, error);
      }
    }

    console.log(`Processed ${processed} subscription renewals`);
    return null;
  });

// ============================================================================
// Firestore Triggers
// ============================================================================

/**
 * Update user custom claims when subscription changes
 */
export const onSubscriptionUpdate = functions.firestore
  .document('subscriptions/{subscriptionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const userId = newData.userId;

    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      subscriptionPlan: newData.plan,
      subscriptionStatus: newData.status,
    });

    console.log(`Updated custom claims for user ${userId}`);
  });

/**
 * Send welcome email when user creates account
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Create user document in Firestore
  await db.collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: 'user',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // TODO: Send welcome email via SendGrid/Mailgun
  console.log(`Created user document for ${user.email}`);
});
```

### Step 4: Build Functions

```bash
cd apps/backend-functions
npm run build

# Verify build output
ls -la lib/
# Should see compiled .js files
```

### Step 5: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:createSubscription
```

**Expected Output:**
```
✔  functions[us-central1-createSubscription(us-central1)] Successful update operation.
✔  functions[us-central1-cancelSubscription(us-central1)] Successful update operation.
✔  functions[us-central1-createPromotedListing(us-central1)] Successful update operation.
...
✔  Deploy complete!
```

---

## Payment Provider Integration

### Part 1: Stripe Setup

#### Step 1: Create Stripe Account

1. Navigate to: https://stripe.com
2. Click **"Sign in"** → **"Create account"**
3. Complete registration

#### Step 2: Get API Keys

1. **Navigate to Developers**
   - Dashboard → **"Developers"** → **"API keys"**

2. **Copy Keys**
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)
   - ⚠️ **Never expose secret key in frontend code**

3. **Save to Environment Variables**
   ```bash
   # In Firebase Functions
   firebase functions:config:set stripe.secret_key="sk_test_..."

   # In frontend .env.local
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

#### Step 3: Create Stripe Products

1. **Navigate to Products**
   - Dashboard → **"Products"**

2. **Create Product: Premium Plan**
   - Click **"Add product"**
   - **Name**: `House Finder Premium`
   - **Description**: `Premium subscription with unlimited searches`
   - **Pricing**:
     - **Monthly price**: $14.99 USD
     - **Billing period**: Monthly
     - Click **"Add pricing"**
     - **Yearly price**: $149.99 USD
     - **Billing period**: Yearly
   - Click **"Save product"**

3. **Copy Price IDs**
   - Click on the product
   - Copy **Price ID** for monthly: `price_...`
   - Copy **Price ID** for yearly: `price_...`
   - Save to config:
   ```bash
   firebase functions:config:set stripe.price_premium_monthly="price_..."
   firebase functions:config:set stripe.price_premium_yearly="price_..."
   ```

4. **Repeat for all plans**:
   - Basic ($9.99/month, $99.99/year)
   - Pro ($29.99/month, $299.99/year)
   - Enterprise ($99.99/month, $999.99/year)

#### Step 4: Set Up Webhooks

1. **Navigate to Webhooks**
   - Developers → **"Webhooks"**

2. **Add Endpoint**
   - Click **"Add endpoint"**
   - **Endpoint URL**: `https://us-central1-house-finder-production.cloudfunctions.net/stripeWebhook`
   - **Events to send**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**

3. **Get Webhook Secret**
   - Click on the webhook endpoint
   - Click **"Reveal"** under **Signing secret**
   - Copy: `whsec_...`
   - Save to config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

#### Step 5: Create Stripe Webhook Function

Add to `apps/backend-functions/src/index.ts`:

```typescript
import { Stripe } from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Stripe webhook handler
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send('Webhook Error');
    return;
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Update payment intent in Firestore
      await db.collection('payment_intents').doc(paymentIntent.id).update({
        status: 'succeeded',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      // Update subscription in Firestore
      const subscriptionQuery = await db
        .collection('subscriptions')
        .where('paymentProviderSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!subscriptionQuery.empty) {
        await subscriptionQuery.docs[0].ref.update({
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
```

Deploy webhook function:
```bash
firebase deploy --only functions:stripeWebhook
```

### Part 2: PayPal Setup (Optional)

#### Step 1: Create PayPal App

1. Navigate to: https://developer.paypal.com/dashboard/
2. Click **"Create App"**
3. **App Name**: `House Finder`
4. **App Type**: **Merchant**
5. Click **"Create App"**

#### Step 2: Get API Credentials

1. **Copy Credentials**
   - **Client ID**: `AXX...`
   - **Secret**: `EXX...`

2. **Save to Config**
   ```bash
   firebase functions:config:set paypal.client_id="AXX..."
   firebase functions:config:set paypal.secret="EXX..."
   firebase functions:config:set paypal.mode="sandbox"
   ```

#### Step 3: Update PayPal Provider

In `apps/backend-functions/src/monetization/payment-providers.ts`:

```typescript
import * as paypal from 'paypal-rest-sdk';

export class PayPalProvider implements IPaymentProvider {
  private isInitialized = false;

  constructor() {
    // Initialize PayPal SDK
    const config = functions.config().paypal;
    if (config && config.client_id) {
      paypal.configure({
        mode: config.mode || 'sandbox',
        client_id: config.client_id,
        client_secret: config.secret,
      });
      this.isInitialized = true;
    }
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, unknown>) {
    if (!this.isInitialized) {
      // Return mock response
      return {
        id: `paypal_mock_${Date.now()}`,
        clientSecret: `paypal_mock_secret`,
      };
    }

    return new Promise((resolve, reject) => {
      const payment = {
        intent: 'sale',
        payer: { payment_method: 'paypal' },
        transactions: [{
          amount: { total: amount.toFixed(2), currency },
          description: metadata.description || 'Payment',
        }],
        redirect_urls: {
          return_url: 'https://yourdomain.com/payment/success',
          cancel_url: 'https://yourdomain.com/payment/cancel',
        },
      };

      paypal.payment.create(payment, (error, payment) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            id: payment.id,
            clientSecret: payment.links?.find(l => l.rel === 'approval_url')?.href || '',
          });
        }
      });
    });
  }

  // ... implement other methods
}
```

---

## Environment Variables & Secrets

### Step 1: Set Firebase Functions Config

```bash
# Stripe
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set stripe.price_premium_monthly="price_..."
firebase functions:config:set stripe.price_premium_yearly="price_..."

# PayPal
firebase functions:config:set paypal.client_id="AXX..."
firebase functions:config:set paypal.secret="EXX..."
firebase functions:config:set paypal.mode="sandbox"

# Email (SendGrid example)
firebase functions:config:set sendgrid.api_key="SG..."
firebase functions:config:set email.from="noreply@yourdomain.com"

# Application URLs
firebase functions:config:set app.url="https://yourdomain.com"
firebase functions:config:set app.admin_email="admin@yourdomain.com"
```

View config:
```bash
firebase functions:config:get
```

### Step 2: Frontend Environment Variables

Create `.env.local` in frontend app:

```bash
# Firebase Config
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=house-finder-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=house-finder-production
VITE_FIREBASE_STORAGE_BUCKET=house-finder-production.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEFGH

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
VITE_PAYPAL_CLIENT_ID=AXX...

# Google Maps (if using)
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Environment
VITE_ENV=development
```

Create `.env.production`:

```bash
# Same as above but with production values
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_ENV=production
```

### Step 3: Secure Secrets with Google Secret Manager (Production)

For production, use Secret Manager instead of functions:config:

1. **Enable Secret Manager API**
   ```bash
   gcloud services enable secretmanager.googleapis.com
   ```

2. **Create Secrets**
   ```bash
   echo -n "sk_live_..." | gcloud secrets create stripe-secret-key --data-file=-
   echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=-
   ```

3. **Grant Access to Functions**
   ```bash
   gcloud secrets add-iam-policy-binding stripe-secret-key \
     --member="serviceAccount:house-finder-production@appspot.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

4. **Update Functions to Use Secrets**

In `apps/backend-functions/src/index.ts`:

```typescript
import { defineSecret } from 'firebase-functions/params';

const stripeSecretKey = defineSecret('stripe-secret-key');

export const createSubscription = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(async (data, context) => {
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2024-11-20.acacia',
    });
    // ... rest of function
  });
```

---

## Security Rules Deployment

### Step 1: Review Firestore Rules

Your `firestore.rules` file is already configured. Review key sections:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasPremiumPlan() {
      return isAuthenticated()
        && request.auth.token.subscriptionPlan != null
        && request.auth.token.subscriptionPlan in ['basic', 'premium', 'pro', 'enterprise'];
    }

    // Subscriptions
    match /subscriptions/{subscriptionId} {
      allow read: if isAuthenticated()
        && (resource.data.userId == request.auth.uid || isAdmin());
      allow write: if false; // Only Functions can write
    }

    // Premium content
    match /waiting_content_language/{lessonId} {
      allow read: if isAuthenticated()
        && (hasPremiumPlan() || resource.data.difficulty == 'beginner');
    }

    // ... more rules
  }
}
```

### Step 2: Test Rules Locally

```bash
# Install emulators
firebase init emulators

# Select:
# - Authentication Emulator
# - Firestore Emulator
# - Functions Emulator

# Start emulators
firebase emulators:start

# Access Firestore Emulator UI
# http://localhost:4000
```

### Step 3: Deploy Rules

```bash
# Dry run (validate only)
firebase deploy --only firestore:rules --debug

# Deploy
firebase deploy --only firestore:rules
```

Verify in Console:
- Firebase Console → Firestore → Rules tab
- Should show your deployed rules

### Step 4: Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## Custom Claims Setup

Custom claims allow storing subscription plan in user's JWT token for fast access control.

### Step 1: Create Admin Function for Setting Claims

Add to `apps/backend-functions/src/index.ts`:

```typescript
/**
 * Admin function to set custom claims
 * Only callable by admin users
 */
export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Check if requester is admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user claims'
    );
  }

  const { userId, claims } = data;

  await admin.auth().setCustomUserClaims(userId, claims);

  return { success: true };
});

/**
 * Get current user's custom claims
 */
export const getUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const user = await admin.auth().getUser(context.auth.uid);

  return { claims: user.customClaims || {} };
});
```

Deploy:
```bash
firebase deploy --only functions:setUserClaims,functions:getUserClaims
```

### Step 2: Set Initial Admin User

Create script `scripts/set-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const email = 'admin@yourdomain.com'; // Change this

async function setAdmin() {
  try {
    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      role: 'super_admin',
    });

    console.log(`✅ Set admin claims for ${email}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdmin();
```

Run:
```bash
node scripts/set-admin.js
```

### Step 3: Download Service Account Key

1. **Navigate to Project Settings**
   - Firebase Console → ⚙️ → **Project settings**
   - Click **"Service accounts"** tab

2. **Generate New Private Key**
   - Click **"Generate new private key"**
   - Click **"Generate key"**
   - Save as `serviceAccountKey.json` in project root
   - ⚠️ **Add to .gitignore** immediately

3. **Add to .gitignore**
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   ```

---

## Firebase Extensions

Firebase Extensions provide pre-built functionality.

### Extension 1: Stripe Payments (Official)

1. **Navigate to Extensions**
   - Firebase Console → **Extensions**

2. **Install Stripe Extension**
   - Click **"Explore extensions"**
   - Search: `Run Payments with Stripe`
   - Click **"Install"**

3. **Configure Extension**
   - **Stripe API key**: `sk_test_...`
   - **Products and pricing plans collection**: `products`
   - **Customer details collection**: `customers`
   - **Subscriptions collection**: `subscriptions`
   - **Sync new users to Stripe**: Yes
   - Click **"Install extension"**

4. **Wait for Installation** (~2-3 minutes)

### Extension 2: Delete User Data (Recommended)

When users delete accounts, automatically delete their data:

1. **Install Extension**
   - Search: `Delete User Data`
   - Click **"Install"**

2. **Configure Paths**
   ```
   users/{UID}
   workspaces/{UID}
   favorites/{UID}
   savedSearches/{UID}
   subscriptions/{UID}
   waiting_content_progress/{UID}
   ```

3. **Install**

### Extension 3: Resize Images (Recommended)

Automatically resize uploaded property images:

1. **Install Extension**
   - Search: `Resize Images`
   - Click **"Install"**

2. **Configure**
   - **Cloud Storage bucket**: (default)
   - **Sizes of images**: `200x200,800x600,1920x1080`
   - **Deletion of original**: No
   - **Cache-Control**: `max-age=86400`

3. **Install**

---

## Testing & Verification

### Step 1: Test Authentication

```bash
# Start local emulators
firebase emulators:start

# In another terminal, run frontend
cd apps/frontend
npm run dev
```

Test:
1. Sign up with email/password
2. Sign in with Google
3. Verify user appears in Authentication tab
4. Verify user document created in Firestore

### Step 2: Test Firestore Rules

In Firestore Emulator:

```javascript
// Test authenticated user can read own data
const testSecurity = firebase.firestore();
firebase.auth().signInWithEmailAndPassword('test@example.com', 'password123');

// Should succeed
await testSecurity.collection('users').doc(currentUser.uid).get();

// Should fail
await testSecurity.collection('users').doc('other-user-id').get();
```

### Step 3: Test Functions Locally

```bash
# Deploy to emulator
firebase emulators:start --only functions,firestore

# Call function from frontend or curl
curl -X POST \
  http://localhost:5001/house-finder-production/us-central1/createSubscription \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "workspaceId": "workspace123",
      "plan": "premium",
      "interval": "monthly"
    }
  }'
```

### Step 4: Test Payment Flow

1. **Use Stripe Test Cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`

2. **Create Test Subscription**
   ```javascript
   const result = await firebase.functions().httpsCallable('createSubscription')({
     workspaceId: 'workspace123',
     plan: 'premium',
     interval: 'monthly',
     paymentProvider: 'stripe',
     paymentMethodId: 'pm_card_visa',
   });
   ```

3. **Verify in Stripe Dashboard**
   - Dashboard → Payments
   - Should see test payment

### Step 5: Verify Custom Claims

```javascript
// In frontend after login
const user = firebase.auth().currentUser;
const token = await user.getIdTokenResult();

console.log('Custom claims:', token.claims);
// Should show: { subscriptionPlan: 'premium' }
```

---

## Production Deployment

### Step 1: Switch to Production Keys

1. **Update Stripe Keys**
   ```bash
   firebase functions:config:set stripe.secret_key="sk_live_..."
   firebase functions:config:set stripe.webhook_secret="whsec_live_..."
   ```

2. **Update Frontend .env.production**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_FIREBASE_API_KEY=AIza...  # Production Firebase config
   ```

### Step 2: Build for Production

```bash
# Build frontend
cd apps/frontend
npm run build

# Verify build
ls -la dist/
```

### Step 3: Deploy All Services

```bash
# From project root
firebase deploy

# This deploys:
# - Firestore rules
# - Firestore indexes
# - Storage rules
# - Functions
# - Hosting
```

Expected output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/house-finder-production/overview
Hosting URL: https://house-finder-production.web.app
Functions:
  - createSubscription(us-central1): https://us-central1-house-finder-production.cloudfunctions.net/createSubscription
  - cancelSubscription(us-central1): https://us-central1-house-finder-production.cloudfunctions.net/cancelSubscription
  ...
```

### Step 4: Verify Production Deployment

1. **Visit Hosting URL**
   - https://house-finder-production.web.app
   - Test sign-up flow

2. **Test Payment Flow**
   - Create account
   - Navigate to subscription page
   - Purchase premium plan
   - Verify in Stripe Dashboard (live mode)

3. **Monitor Functions**
   - Firebase Console → Functions → Logs
   - Check for errors

4. **Set Up Monitoring**
   - Firebase Console → Performance
   - Enable performance monitoring

### Step 5: Configure Custom Domain (Optional)

1. **Add Domain in Hosting**
   - Firebase Console → Hosting
   - Click **"Add custom domain"**
   - Enter: `yourdomain.com`
   - Follow DNS verification steps

2. **Update DNS Records**
   - Add `A` records provided by Firebase
   - Add `TXT` record for verification

3. **Wait for SSL Certificate** (~24 hours)

4. **Update Authorized Domains**
   - Authentication → Settings → Authorized domains
   - Add your custom domain

---

## Troubleshooting

### Issue: Functions deployment fails

**Solution:**
```bash
# Check Node.js version in functions
cd apps/backend-functions
cat package.json  # Look for "engines" field

# Should be:
"engines": {
  "node": "18"
}

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
firebase deploy --only functions
```

### Issue: CORS errors in browser

**Solution:**
```bash
# Update CORS for Cloud Storage
gsutil cors set cors.json gs://your-bucket.appspot.com

# Update functions CORS
# Add to function:
res.set('Access-Control-Allow-Origin', '*');
```

### Issue: Custom claims not showing

**Solution:**
```javascript
// Force token refresh
await firebase.auth().currentUser.getIdToken(true);
const token = await firebase.auth().currentUser.getIdTokenResult();
console.log(token.claims);
```

### Issue: Stripe webhook not receiving events

**Solution:**
1. Verify webhook URL in Stripe Dashboard
2. Check function logs: `firebase functions:log`
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-function-url.cloudfunctions.net/stripeWebhook
   ```

---

## Security Checklist

Before going to production:

- [ ] Enable App Check for Firestore, Storage, and Functions
- [ ] Set up budget alerts in Google Cloud Console
- [ ] Review and test all Firestore security rules
- [ ] Enable multi-factor authentication for admin accounts
- [ ] Set up Cloud Monitoring alerts
- [ ] Review IAM permissions
- [ ] Enable audit logs
- [ ] Set up backup schedule for Firestore
- [ ] Test disaster recovery procedures
- [ ] Document incident response plan
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure CSP headers in hosting
- [ ] Enable HTTPS-only mode
- [ ] Review all API keys and rotate if needed
- [ ] Set up log aggregation (Cloud Logging)

---

## Next Steps

After completing this setup:

1. **Seed Initial Data**
   - Create waiting content (language lessons, cultural insights)
   - Add sample properties for testing
   - Create test workspaces

2. **Set Up CI/CD**
   - GitHub Actions for automated testing
   - Automated deployment on merge to main
   - Preview channels for pull requests

3. **Configure Monitoring**
   - Set up error tracking (Sentry, Rollbar)
   - Configure performance monitoring
   - Set up analytics dashboards

4. **Documentation**
   - Create user guides
   - Document API endpoints
   - Create admin documentation

---

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Stripe Documentation**: https://stripe.com/docs
- **Firebase Console**: https://console.firebase.google.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/firebase

**Questions?** Open an issue in the repository or contact the development team.

---

**Configuration complete!** 🎉

Your House Finder Engine is now fully configured and ready for production use.
