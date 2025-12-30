#!/bin/bash

# Pre-Deployment Check Script for House Finder
# Run this script before deploying to Firebase to ensure everything is ready

set -e  # Exit on any error

echo "🚀 House Finder - Pre-Deployment Checks"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        FAILED=1
        return 1
    fi
}

check_version() {
    echo ""
    echo "1️⃣  Checking System Requirements"
    echo "--------------------------------"

    # Node.js version
    if check_command node; then
        NODE_VERSION=$(node --version)
        echo "   Node version: $NODE_VERSION"
        if [[ ! $NODE_VERSION =~ ^v20 ]]; then
            echo -e "   ${YELLOW}⚠${NC}  Warning: Node.js 20.x recommended"
        fi
    fi

    # Firebase CLI
    if check_command firebase; then
        FB_VERSION=$(firebase --version)
        echo "   Firebase CLI version: $FB_VERSION"
    fi

    # pnpm
    if check_command pnpm; then
        PNPM_VERSION=$(pnpm --version)
        echo "   pnpm version: $PNPM_VERSION"
    fi
}

check_firebase_auth() {
    echo ""
    echo "2️⃣  Checking Firebase Authentication"
    echo "------------------------------------"

    if firebase projects:list &> /dev/null; then
        echo -e "${GREEN}✓${NC} Authenticated with Firebase"

        # Check current project
        CURRENT_PROJECT=$(firebase use 2>&1 | grep "Active" | awk '{print $3}')
        if [ -n "$CURRENT_PROJECT" ]; then
            echo "   Current project: $CURRENT_PROJECT"
        else
            echo -e "${YELLOW}⚠${NC}  No Firebase project selected"
            echo "   Run: firebase use house-finder-production"
        fi
    else
        echo -e "${RED}✗${NC} Not authenticated with Firebase"
        echo "   Run: firebase login"
        FAILED=1
    fi
}

check_dependencies() {
    echo ""
    echo "3️⃣  Checking Dependencies"
    echo "------------------------"

    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} node_modules exists"
    else
        echo -e "${RED}✗${NC} node_modules not found"
        echo "   Run: pnpm install"
        FAILED=1
    fi

    # Check workspace symlinks
    if [ -L "packages/extraction-engine/node_modules/@house-finder/domain" ]; then
        echo -e "${GREEN}✓${NC} extraction-engine → domain symlink exists"
    else
        echo -e "${YELLOW}⚠${NC}  extraction-engine → domain symlink missing"
        echo "   This will be created during build"
    fi

    if [ -L "apps/backend-functions/node_modules/@house-finder/domain" ]; then
        echo -e "${GREEN}✓${NC} backend-functions → domain symlink exists"
    else
        echo -e "${YELLOW}⚠${NC}  backend-functions → domain symlink missing"
        echo "   This will be created during build"
    fi
}

check_builds() {
    echo ""
    echo "4️⃣  Building Packages"
    echo "--------------------"

    echo "   Building @house-finder/domain..."
    if npx nx build @house-finder/domain --skip-nx-cache &> /tmp/build-domain.log; then
        echo -e "   ${GREEN}✓${NC} domain built successfully"
    else
        echo -e "   ${RED}✗${NC} domain build failed"
        cat /tmp/build-domain.log | tail -20
        FAILED=1
        return
    fi

    echo "   Building @house-finder/extraction-engine..."
    if npx nx build @house-finder/extraction-engine --skip-nx-cache &> /tmp/build-extraction.log; then
        echo -e "   ${GREEN}✓${NC} extraction-engine built successfully"

        # Check for TypeScript errors
        ERROR_COUNT=$(grep -c "error TS" /tmp/build-extraction.log || true)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "   ${RED}✗${NC} Found $ERROR_COUNT TypeScript errors"
            grep "error TS" /tmp/build-extraction.log | head -10
            FAILED=1
        fi
    else
        echo -e "   ${RED}✗${NC} extraction-engine build failed"
        cat /tmp/build-extraction.log | tail -20
        FAILED=1
        return
    fi

    echo "   Building backend-functions..."
    if npx nx build backend-functions --skip-nx-cache &> /tmp/build-functions.log; then
        echo -e "   ${GREEN}✓${NC} backend-functions built successfully"

        # Check for TypeScript errors
        ERROR_COUNT=$(grep -c "error TS" /tmp/build-functions.log || true)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "   ${RED}✗${NC} Found $ERROR_COUNT TypeScript errors"
            grep "error TS" /tmp/build-functions.log | head -10
            FAILED=1
        fi
    else
        echo -e "   ${RED}✗${NC} backend-functions build failed"
        cat /tmp/build-functions.log | tail -20
        FAILED=1
    fi
}

check_firebase_config() {
    echo ""
    echo "5️⃣  Checking Firebase Configuration"
    echo "-----------------------------------"

    if [ -f "firebase.json" ]; then
        echo -e "${GREEN}✓${NC} firebase.json exists"
    else
        echo -e "${RED}✗${NC} firebase.json not found"
        FAILED=1
    fi

    if [ -f ".firebaserc" ]; then
        echo -e "${GREEN}✓${NC} .firebaserc exists"
    else
        echo -e "${RED}✗${NC} .firebaserc not found"
        FAILED=1
    fi

    if [ -f "firestore.rules" ]; then
        echo -e "${GREEN}✓${NC} firestore.rules exists"
    else
        echo -e "${RED}✗${NC} firestore.rules not found"
        FAILED=1
    fi

    if [ -f "firestore.indexes.json" ]; then
        echo -e "${GREEN}✓${NC} firestore.indexes.json exists"
    else
        echo -e "${RED}✗${NC} firestore.indexes.json not found"
        FAILED=1
    fi
}

check_code_quality() {
    echo ""
    echo "6️⃣  Code Quality Checks"
    echo "----------------------"

    # Check for console.log in backend-functions
    CONSOLE_COUNT=$(grep -r "console\.log" apps/backend-functions/src/ | grep -v "console.error" | wc -l || true)
    if [ "$CONSOLE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Found $CONSOLE_COUNT console.log statements in backend-functions"
        echo "   Consider using proper logging instead"
    else
        echo -e "${GREEN}✓${NC} No console.log statements found"
    fi

    # Check for TODOs
    TODO_COUNT=$(grep -r "TODO\|FIXME" apps/backend-functions/src/ packages/extraction-engine/src/ | wc -l || true)
    if [ "$TODO_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Found $TODO_COUNT TODO/FIXME comments"
        echo "   Review before deploying to production"
    else
        echo -e "${GREEN}✓${NC} No TODO/FIXME comments found"
    fi
}

# Run all checks
check_version
check_firebase_auth
check_dependencies
check_builds
check_firebase_config
check_code_quality

# Summary
echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All pre-deployment checks passed!${NC}"
    echo ""
    echo "You can now deploy with:"
    echo "  firebase deploy --only firestore  # Deploy rules & indexes first"
    echo "  firebase deploy --only functions  # Then deploy functions"
    echo ""
    echo "Or deploy everything:"
    echo "  firebase deploy"
else
    echo -e "${RED}❌ Pre-deployment checks failed!${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi
