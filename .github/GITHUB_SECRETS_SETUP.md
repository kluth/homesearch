# GitHub Secrets Setup Guide

This guide explains how to set up GitHub Secrets for CI/CD workflows in the House Finder project.

## 📋 Required Secrets

### 1. `FIREBASE_TOKEN` (Required for all deployments)

**Purpose:** Authentication token for Firebase CLI to deploy functions and Firestore rules.

**How to obtain:**

```bash
# Login to Firebase CLI
firebase login:ci

# This will open a browser window for authentication
# After successful login, it will output a token

# Copy the token (looks like: 1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
```

**How to add to GitHub:**
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from `firebase login:ci`
6. Click **Add secret**

---

### 2. `FIREBASE_SERVICE_ACCOUNT` (Required for Firebase Hosting and advanced features)

**Purpose:** Service account JSON for Firebase Admin SDK and hosting deployments.

**How to obtain:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`house-finder-production`)
3. Click the **gear icon** ⚙️ → **Project settings**
4. Navigate to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** to download JSON file
7. **⚠️ Keep this file secure - it has admin access to your Firebase project**

**How to add to GitHub:**
1. Open the downloaded JSON file
2. Copy the **entire JSON content**
3. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Paste the entire JSON content
7. Click **Add secret**

**Example JSON structure (do NOT use these values):**
```json
{
  "type": "service_account",
  "project_id": "house-finder-production",
  "private_key_id": "xxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@house-finder-production.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

### 3. `ZILLOW_API_KEY` (Optional - for Zillow integration)

**Purpose:** API key for Zillow property data extraction.

**How to obtain:**
1. Sign up at [Zillow API Portal](https://www.zillow.com/howto/api/APIOverview.htm)
2. Create a new API application
3. Copy the API key

**How to add to GitHub:**
1. GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ZILLOW_API_KEY`
4. Value: Paste your Zillow API key
5. Click **Add secret**

**To use in Cloud Functions:**
```bash
# Set as Firebase function secret
firebase functions:secrets:set ZILLOW_API_KEY
```

---

### 4. `IMMOSCOUT24_API_KEY` (Optional - for ImmouScout24 integration)

**Purpose:** API key for ImmouScout24 property data extraction (Germany).

**How to obtain:**
1. Register at [ImmouScout24 Developer Portal](https://api.immobilienscout24.de/)
2. Create application credentials
3. Copy the API key

**How to add to GitHub:**
1. GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `IMMOSCOUT24_API_KEY`
4. Value: Paste your ImmouScout24 API key
5. Click **Add secret**

---

## 🔒 Environment-Specific Secrets

For different environments (production, staging, development), you can set up **Environment secrets**:

### Setting up Environment Secrets:

1. Go to repository **Settings** → **Environments**
2. Click **New environment**
3. Name it: `production`, `staging`, or `development`
4. Add protection rules (optional):
   - ✅ Required reviewers (for production)
   - ✅ Wait timer before deployment
   - ✅ Deployment branches (e.g., only `main` for production)
5. Click **Add secret** under Environment secrets
6. Add the same secrets as above, but with environment-specific values

**Example environment setup:**

| Environment | Firebase Project | Secrets |
|-------------|------------------|---------|
| `production` | house-finder-production | Production Firebase tokens |
| `staging` | house-finder-staging | Staging Firebase tokens |
| `development` | house-finder-dev | Development Firebase tokens |

---

## ✅ Verification

After adding all secrets, verify they're set up correctly:

### 1. Check Repository Secrets

```bash
# Go to: https://github.com/YOUR_USERNAME/homesearch/settings/secrets/actions
# You should see:
✓ FIREBASE_TOKEN
✓ FIREBASE_SERVICE_ACCOUNT
✓ ZILLOW_API_KEY (optional)
✓ IMMOSCOUT24_API_KEY (optional)
```

### 2. Test Deployment Workflow

```bash
# Trigger manual deployment workflow
# Go to: Actions → Manual Deployment → Run workflow
# Select environment: staging
# Click: Run workflow
```

### 3. Check Workflow Logs

- Navigate to **Actions** tab
- Click on the running workflow
- Expand steps to see if authentication succeeds
- Look for ✅ in deployment steps

---

## 🚨 Security Best Practices

### ✅ DO:
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use environment-specific secrets
- ✅ Enable branch protection for `main`
- ✅ Require PR reviews before merging
- ✅ Use environment protection rules for production
- ✅ Monitor GitHub audit logs

### ❌ DON'T:
- ❌ Commit secrets to code (even in comments)
- ❌ Share secrets via email or chat
- ❌ Use production secrets in development
- ❌ Give secrets to unauthorized team members
- ❌ Log secrets in workflow outputs

---

## 🔄 Updating Secrets

To update an existing secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update secret**
4. Paste new value
5. Click **Update secret**

**Note:** You cannot view existing secret values. You can only update or delete them.

---

## 📝 Using Secrets in Workflows

Secrets are automatically available in GitHub Actions:

```yaml
steps:
  - name: Deploy to Firebase
    run: |
      firebase deploy --token "${{ secrets.FIREBASE_TOKEN }}"

  - name: Setup Firebase credentials
    run: |
      echo "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}" > service-account.json
```

---

## 🆘 Troubleshooting

### Error: "Invalid authentication credentials"

**Solution:** Regenerate Firebase token:
```bash
firebase logout
firebase login:ci
# Copy new token and update GitHub secret
```

### Error: "Permission denied"

**Solution:** Check service account has required permissions:
1. Firebase Console → Settings → Service accounts
2. Verify account has "Firebase Admin" role
3. Generate new key if needed

### Error: "Secret not found"

**Solution:**
1. Verify secret name matches exactly (case-sensitive)
2. Check if secret is in correct environment
3. Re-add the secret if needed

---

## 📞 Support

- **Firebase Docs:** https://firebase.google.com/docs/cli#cli-ci-systems
- **GitHub Actions Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Security Best Practices:** https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions

---

**Last Updated:** 2025-12-30
**Required Secrets:** 2 mandatory, 2 optional
**Setup Time:** ~10 minutes
