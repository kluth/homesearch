# House Finder - Firebase Deployment Guide

## 🚀 Pre-Deployment Checklist

Complete ALL items in this checklist before deploying to production.

### ✅ 1. Environment Setup

- [ ] **Node.js Version**: Ensure Node.js 20.x is installed
  ```bash
  node --version  # Should show v20.x.x
  ```

- [ ] **Firebase CLI**: Install/Update Firebase CLI
  ```bash
  npm install -g firebase-tools
  firebase --version  # Should be latest version
  ```

- [ ] **Firebase Login**: Authenticate with Firebase
  ```bash
  firebase login
  firebase projects:list  # Verify you can see house-finder-production
  ```

- [ ] **Dependencies**: Install all project dependencies
  ```bash
  pnpm install
  ```

### ✅ 2. Build Verification

Run these commands to ensure everything compiles without errors:

```bash
# Build all packages in dependency order
npx nx run-many --target=build --all --skip-nx-cache

# Verify specific packages
npx nx build @house-finder/domain
npx nx build @house-finder/extraction-engine
npx nx build backend-functions
```

**Expected Output**: All builds should complete successfully with "✓" checkmarks.

**⚠️ STOP**: If any build fails, fix the errors before proceeding!

### ✅ 3. TypeScript Validation

Ensure zero TypeScript errors:

```bash
# Check extraction-engine package
npx nx build @house-finder/extraction-engine 2>&1 | grep "error TS" | wc -l
# Expected output: 0

# Check backend-functions
npx nx build backend-functions 2>&1 | grep "error TS" | wc -l
# Expected output: 0
```

### ✅ 4. Firebase Configuration

- [ ] **Firebase Project**: Verify correct project is selected
  ```bash
  firebase use
  # Should show: house-finder-production
  ```

- [ ] **Firebase Config Files**: Verify these files exist and are valid
  - [ ] `firebase.json` - Main Firebase configuration
  - [ ] `.firebaserc` - Project aliases
  - [ ] `firestore.rules` - Security rules
  - [ ] `firestore.indexes.json` - Database indexes

- [ ] **Functions Configuration**: Check `firebase.json` functions settings
  ```json
  {
    "functions": [{
      "source": "apps/backend-functions",
      "runtime": "nodejs20",
      "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
    }]
  }
  ```

### ✅ 5. Environment Variables & Secrets

- [ ] **Firebase Functions Config**: Set required environment variables
  ```bash
  # Example: Set API keys (adjust as needed)
  firebase functions:secrets:set ZILLOW_API_KEY
  firebase functions:secrets:set IMMOSCOUT24_API_KEY

  # Verify secrets are set
  firebase functions:secrets:access ZILLOW_API_KEY
  ```

- [ ] **Service Account**: Ensure Firebase Admin SDK has proper permissions
  - Firestore read/write
  - Cloud Tasks management
  - Cloud Functions invocation

### ✅ 6. Authentication Setup

**IMPORTANT:** Authentication must be properly configured before deployment.

- [ ] **Enable Firebase Authentication**
  ```bash
  # In Firebase Console:
  # 1. Go to Authentication → Sign-in method
  # 2. Enable "Email/Password" provider
  # 3. (Optional) Enable OAuth providers: Google, Facebook, Apple
  ```

- [ ] **Configure Email Templates**
  ```bash
  # In Firebase Console:
  # Authentication → Templates
  # Customize:
  # - Email verification
  # - Password reset
  # - Email address change
  ```

- [ ] **Verify Auth Triggers Are Deployed**
  ```bash
  # Ensure these triggers are in backend-functions/src/index.ts:
  # - beforeUserCreate (sets initial custom claims)
  # - beforeUserSignIn (checks user status)
  # - onUserCreated (creates user profile)
  ```

- [ ] **Test Authentication Flow**
  ```bash
  # Create test user
  firebase auth:import test-users.json --hash-algo=STANDARD_SCRYPT

  # Or manually test in emulator:
  firebase emulators:start --only auth,firestore,functions
  # Then test sign-up and sign-in
  ```

- [ ] **Verify Security Rules Include Auth Checks**
  ```bash
  # firestore.rules should include:
  # - isAuthenticated() checks
  # - Role-based access controls
  # - Workspace isolation rules

  # Test rules locally:
  firebase emulators:start --only firestore
  ```

- [ ] **Review User Roles**
  - USER (default) - Basic access
  - PREMIUM - Advanced features
  - AGENT - Can create listings
  - ADMIN - Manage users
  - SUPER_ADMIN - Full system access

**📚 See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete auth setup guide**

### ✅ 7. Firestore Security Rules

Review and validate security rules:

```bash
# Test Firestore rules locally
firebase emulators:start --only firestore

# In another terminal, run your tests
# (Add your test command here if you have Firestore rules tests)
```

**Key Security Checks:**
- [ ] Properties collection: Read public, write only by functions
- [ ] User data: Read/write only by authenticated owners
- [ ] No unintended public write access

### ✅ 8. Firestore Indexes

- [ ] **Deploy Indexes First**: Always deploy indexes before functions
  ```bash
  firebase deploy --only firestore:indexes
  ```

- [ ] **Wait for Index Building**: Check Firebase Console
  - Go to Firestore → Indexes
  - Wait until all indexes show "Enabled" status
  - ⚠️ Large datasets may take 10-30 minutes

### ✅ 9. Package Dependencies

Verify workspace dependencies are correctly linked:

```bash
# Check symlinks exist
ls -la packages/extraction-engine/node_modules/@house-finder/domain
ls -la apps/backend-functions/node_modules/@house-finder/domain
ls -la apps/backend-functions/node_modules/@house-finder/extraction-engine

# All should show valid symlinks (-> pointing to correct paths)
```

### ✅ 10. Code Quality

- [ ] **Linting**: Run linter to catch potential issues
  ```bash
  npx nx run-many --target=lint --all
  ```

- [ ] **Unused Code**: Remove any commented-out code or TODOs

- [ ] **Console Logs**: Remove or replace console.log with proper logging
  ```bash
  # Check for console.log statements
  grep -r "console.log" apps/backend-functions/src/
  ```

### ✅ 11. Testing

- [ ] **Unit Tests**: Run all tests
  ```bash
  npx nx run-many --target=test --all
  ```

- [ ] **Integration Tests**: Test critical flows
  - Property extraction
  - Response generation
  - Recommendation engine

- [ ] **Manual Testing**: Test in Firebase Emulators
  ```bash
  firebase emulators:start
  # Then test your functions via HTTP calls
  ```

---

## 📦 Deployment Steps

### Step 1: Final Build

```bash
# Clean build everything
npx nx reset
npx nx run-many --target=build --all
```

### Step 2: Deploy Firestore Rules & Indexes

```bash
# Deploy Firestore configuration (rules + indexes)
firebase deploy --only firestore

# ⏰ Wait for indexes to finish building (check Firebase Console)
```

### Step 3: Deploy Firebase Functions

```bash
# Deploy all functions
firebase deploy --only functions

# OR deploy specific function
firebase deploy --only functions:extractProperty
firebase deploy --only functions:generateResponse
```

### Step 4: Verify Deployment

```bash
# Check function logs
firebase functions:log

# Test a deployed function
curl https://us-central1-house-finder-production.cloudfunctions.net/extractProperty \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/property"}'
```

---

## 🔍 Post-Deployment Verification

### Health Checks

- [ ] **Functions Console**: Verify all functions deployed successfully
  - Visit: https://console.firebase.google.com/project/house-finder-production/functions
  - Check: All functions show "Healthy" status

- [ ] **Firestore Indexes**: Confirm all indexes are "Enabled"
  - Visit: https://console.firebase.google.com/project/house-finder-production/firestore/indexes

- [ ] **Function Logs**: Monitor for errors
  ```bash
  firebase functions:log --limit 50
  ```

- [ ] **Test Key Endpoints**:
  - Extract property
  - Generate response
  - Get recommendations
  - Search properties

### Performance Monitoring

- [ ] Enable Firebase Performance Monitoring
- [ ] Set up alerts for:
  - Function failures
  - High latency
  - Quota exceeded

---

## 🚨 Rollback Procedure

If deployment fails or causes issues:

```bash
# 1. Check recent deployments
firebase functions:log --limit 100

# 2. Rollback to previous version (if needed)
# Note: Firebase doesn't have automatic rollback
# You'll need to redeploy the previous version

# 3. Quick fix: Disable problematic function
# Go to Firebase Console → Functions → Select function → Disable
```

---

## 📝 Environment-Specific Notes

### Development
```bash
firebase use development
firebase deploy --only functions:extractProperty  # Deploy single function for testing
```

### Staging
```bash
firebase use staging
firebase deploy --only functions  # Deploy all functions
```

### Production
```bash
firebase use default  # Uses house-finder-production
firebase deploy --only firestore  # Rules + indexes first
# Wait for indexes...
firebase deploy --only functions  # Then functions
```

---

## 🛠️ Troubleshooting

### Build Fails with "Cannot find module"

```bash
# Recreate workspace symlinks
rm -rf packages/extraction-engine/node_modules/@house-finder
rm -rf apps/backend-functions/node_modules/@house-finder

mkdir -p packages/extraction-engine/node_modules/@house-finder
ln -sf ../../../domain packages/extraction-engine/node_modules/@house-finder/domain

mkdir -p apps/backend-functions/node_modules/@house-finder
ln -sf ../../../../packages/domain apps/backend-functions/node_modules/@house-finder/domain
ln -sf ../../../../packages/extraction-engine apps/backend-functions/node_modules/@house-finder/extraction-engine

# Rebuild
npx nx build backend-functions
```

### "Property 'area' does not exist" Errors

These indicate UnifiedHouseModel property access errors. Use:
- `property.details?.livingArea` instead of `property.area`
- `property.details?.totalRooms` instead of `property.rooms`
- `property.propertyType` instead of `property.type`

### Firestore Index Not Ready

- Wait 10-30 minutes for large indexes
- Check index status in Firebase Console
- Deploy functions AFTER indexes are enabled

### Function Timeout

Increase timeout in `firebase.json`:
```json
{
  "functions": [{
    "timeout": "300s",  // 5 minutes max
    "memory": "512MB"
  }]
}
```

---

## 📞 Support

- **Firebase Status**: https://status.firebase.google.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Stack Overflow**: Tag with `firebase` and `google-cloud-functions`

---

## ✅ Deployment Complete!

Once all checks pass:
1. Monitor logs for 24 hours
2. Set up alerts for errors
3. Document any issues encountered
4. Update this guide with learnings

**Last Updated**: 2025-12-30
**Maintained By**: Development Team
