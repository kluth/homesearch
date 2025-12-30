# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the House Finder project.

## 📋 Workflows Overview

### 1. 🚀 **CI/CD Pipeline** (`ci-cd.yml`)

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Lint & Code Quality** - ESLint, console.log checks, TODO/FIXME detection
2. **Test Suite** - Run all unit tests with coverage reporting
3. **Build Packages** - Build domain, extraction-engine, and backend-functions
4. **Security Audit** - pnpm audit and secret scanning
5. **Deploy Production** - Deploy to Firebase (main branch only)
6. **Deploy Staging** - Deploy to staging (develop branch only)
7. **Notify Status** - Report deployment results

**Deployment Strategy:**
- `main` branch → Production environment
- `develop` branch → Staging environment
- Pull requests → No deployment (validation only)

---

### 2. ✅ **Pull Request Validation** (`pr-validation.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Jobs:**
1. **PR Validation** - Lint, test, and build affected projects only
2. **PR Title Check** - Validate conventional commit format
3. **Merge Conflict Check** - Auto-label PRs with conflicts
4. **Bundle Size Analysis** - Report package sizes

**Features:**
- Nx affected commands (only tests/builds what changed)
- Automatic PR comment with validation summary
- Semantic PR title enforcement
- Bundle size tracking

---

### 3. 🎯 **Manual Deployment** (`manual-deploy.yml`)

**Triggers:**
- Manual workflow dispatch from GitHub Actions UI

**Options:**
- **Environment:** production, staging, or development
- **Deploy Firestore:** Toggle Firestore rules/indexes deployment
- **Deploy Functions:** Toggle Cloud Functions deployment
- **Skip Tests:** Bypass validation (not recommended for production)

**Use Cases:**
- Emergency hotfix deployment
- Deploy only Firestore without functions
- Deploy to development environment
- Test deployment process

---

## 🔧 Setup Instructions

### Prerequisites

1. **GitHub Secrets** - Set up required secrets (see [GITHUB_SECRETS_SETUP.md](../GITHUB_SECRETS_SETUP.md))
   - `FIREBASE_TOKEN` (required)
   - `FIREBASE_SERVICE_ACCOUNT` (required)
   - `ZILLOW_API_KEY` (optional)
   - `IMMOSCOUT24_API_KEY` (optional)

2. **GitHub Environments** - Create environments for deployment protection
   - `production` - Requires approval, restricted to `main` branch
   - `staging` - Auto-deploy from `develop` branch
   - `development` - Manual deployment only

### Creating GitHub Environments:

1. Go to repository **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Add protection rules:
   - ✅ Required reviewers: Add team members
   - ✅ Deployment branches: Only `main`
5. Click **Add environment**
6. Repeat for `staging` and `development`

---

## 📊 Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/homesearch/actions/workflows/ci-cd.yml/badge.svg)
![PR Validation](https://github.com/YOUR_USERNAME/homesearch/actions/workflows/pr-validation.yml/badge.svg)
```

---

## 🎯 Common Workflows

### Deploy to Production

```bash
# Method 1: Push to main branch (automatic)
git checkout main
git merge develop
git push origin main

# Method 2: Manual deployment (via GitHub UI)
# Go to Actions → Manual Deployment → Run workflow
# Select: production, deploy_functions: true
```

### Deploy to Staging

```bash
# Automatic on push to develop
git checkout develop
git push origin develop
```

### Test Changes Without Deployment

```bash
# Create a pull request
git checkout -b feature/my-feature
git push origin feature/my-feature
# Then create PR on GitHub
```

### Emergency Hotfix

```bash
# Use manual deployment with skip_tests
# Go to Actions → Manual Deployment → Run workflow
# Select: production, skip_tests: true (⚠️ use with caution)
```

---

## 🔍 Monitoring Workflows

### View Workflow Runs

1. Go to repository **Actions** tab
2. Click on a workflow to see all runs
3. Click on a specific run to see job details
4. Expand steps to view logs

### Download Build Artifacts

1. Go to successful workflow run
2. Scroll to **Artifacts** section at bottom
3. Click **build-artifacts** to download

### View Deployment Status

1. Go to repository main page
2. Click **Environments** on right sidebar
3. View deployment history and status

---

## 🛠️ Troubleshooting

### Workflow Fails on Dependency Installation

**Error:** `pnpm install failed`

**Solution:**
```yaml
# Clear cache and retry
# Go to Actions → Caches → Delete all caches
# Re-run workflow
```

### Authentication Error

**Error:** `Error: HTTP Error: 401, Request had invalid authentication credentials`

**Solution:**
1. Regenerate `FIREBASE_TOKEN`:
   ```bash
   firebase login:ci
   ```
2. Update GitHub secret with new token

### TypeScript Errors in Workflow

**Error:** `Found X TypeScript errors`

**Solution:**
1. Run locally to reproduce:
   ```bash
   pnpm build:all
   ```
2. Fix errors locally
3. Push fixes

### Deployment Hangs

**Issue:** Deployment step runs for >30 minutes

**Solution:**
1. Cancel workflow
2. Check Firebase Console for index building status
3. Wait for indexes to complete
4. Re-run deployment

---

## 📈 Performance Optimization

### Cache Optimization

The workflows use pnpm cache to speed up builds:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'  # Caches pnpm store
```

**Cache hit ratio:** ~90% for unchanged dependencies

### Parallel Execution

Multiple jobs run in parallel:
- Lint, Test, Security → Run simultaneously
- Build → Runs after lint/test complete
- Deploy → Runs only after all checks pass

**Total workflow time:**
- PR validation: ~3-5 minutes
- Full deployment: ~8-12 minutes

---

## 🔒 Security Features

### Automated Security Checks

✅ **Dependency Audit** - `pnpm audit` on every build
✅ **Secret Scanning** - Detects hardcoded secrets
✅ **Code Quality** - ESLint rules enforcement
✅ **TypeScript Strict Mode** - No `any` types allowed

### Deployment Protection

✅ **Branch Protection** - Main branch requires PR reviews
✅ **Environment Secrets** - Separate credentials per environment
✅ **Manual Approval** - Production deploys require approval
✅ **Deployment History** - Full audit trail

---

## 📝 Workflow Customization

### Adding New Jobs

Edit `.github/workflows/ci-cd.yml`:

```yaml
jobs:
  # Add new job
  my-custom-job:
    name: My Custom Job
    runs-on: ubuntu-latest
    needs: [build]  # Run after build completes

    steps:
      - name: My Step
        run: echo "Hello World"
```

### Modifying Deployment

To deploy additional resources:

```yaml
- name: Deploy Storage Rules
  run: |
    firebase deploy --only storage --token "${{ secrets.FIREBASE_TOKEN }}"
```

### Adding Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {"text": "Deployment completed!"}
```

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI CI/CD](https://firebase.google.com/docs/cli#cli-ci-systems)
- [Nx Cloud](https://nx.app/) - Distributed task execution
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

---

## 🆘 Getting Help

**Workflow fails?**
1. Check logs in GitHub Actions tab
2. Review [GITHUB_SECRETS_SETUP.md](../GITHUB_SECRETS_SETUP.md)
3. See [DEPLOYMENT.md](../../DEPLOYMENT.md) for deployment guide

**Questions?**
- Open an issue in the repository
- Check GitHub Actions documentation
- Review Firebase deployment logs

---

**Last Updated:** 2025-12-30
**Workflows:** 3
**Total Jobs:** 15+
**Average Run Time:** 5-10 minutes
