# CI/CD Pipeline Documentation

**Project:** Licita Preços
**Version:** 1.0
**Date:** 2026-02-03
**Author:** Gage (DevOps Agent)
**Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [GitHub Actions Workflow](#github-actions-workflow)
4. [Railway Deployment](#railway-deployment)
5. [Required Secrets](#required-secrets)
6. [Environment Variables](#environment-variables)
7. [Pipeline Stages](#pipeline-stages)
8. [Health Checks](#health-checks)
9. [Troubleshooting](#troubleshooting)
10. [Future Improvements](#future-improvements)

---

## 1. Overview

The CI/CD pipeline for Licita Preços automates testing, building, and deployment processes.

### Technology Stack

- **CI Platform:** GitHub Actions
- **Deployment Platform:** Railway
- **Trigger Events:** Pull Requests and pushes to master/main branch
- **Runtime:** Node.js 18
- **Package Manager:** npm

---

## 2. Pipeline Architecture

### Current Implementation Status

| Acceptance Criteria | Status | Details |
|-------------------|--------|---------|
| AC1: GitHub Actions workflow created | ✅ COMPLETE | .github/workflows/deploy.yml |
| AC2: Automated tests run on every PR | ⚠️ PARTIAL | Lint and typecheck only |
| AC3: Auto-deploy to Railway on merge | ✅ COMPLETE | Deploys on push to master/main |
| AC4: Proper environment variable handling | ✅ COMPLETE | Railway secrets configured |
| AC5: Build and test stages defined | ✅ COMPLETE | Separate test and deploy jobs |

---

## 3. GitHub Actions Workflow

**File:** .github/workflows/deploy.yml

### Jobs Overview

#### Job 1: Test & Lint

Runs on all PRs and pushes to master/main

**Steps:**
1. Checkout code
2. Setup Node.js 18 with npm cache
3. Install dependencies with npm ci
4. Generate Prisma Client
5. Run ESLint
6. Run TypeScript type check
7. Build application

#### Job 2: Deploy to Railway

Runs only on pushes to master/main after tests pass

**Steps:**
1. Checkout code
2. Install Railway CLI
3. Deploy to Railway service

---

## 4. Railway Deployment

**File:** app/railway.toml

Configuration:
- Builder: nixpacks
- Start Command: npm run start
- Health Check: /api/health
- Health Check Timeout: 30s
- Restart Policy: on_failure
- Max Retries: 3

---

## 5. Required Secrets

### GitHub Secrets

Configure in Repository Settings → Secrets and variables → Actions

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| RAILWAY_TOKEN | Railway API token | Railway Dashboard → Account Settings → Tokens |

### Railway Environment Variables

Configure in Railway Dashboard → Service → Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes (auto) | PostgreSQL connection string |
| NEXT_PUBLIC_APP_URL | Yes | Public application URL |
| NODE_ENV | Yes | Set to production |
| USE_MOCK_DATA | No | Use mock data (false) |

---

## 6. Environment Variables

### Build-time Variables (GitHub Actions)

```yaml
DATABASE_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder"
SKIP_ENV_VALIDATION: true
```

### Runtime Variables (Railway)

All variables from Railway service configuration

---

## 7. Pipeline Stages

### Stage 1: Code Quality

- Duration: 2-4 minutes
- Runs: On all PRs and pushes

Steps:
1. Lint (npm run lint)
2. Type Check (npm run typecheck)
3. Build (npm run build)

### Stage 2: Deployment

- Duration: 3-5 minutes
- Runs: On master/main pushes only

Steps:
1. Install Railway CLI
2. Deploy to Railway

---

## 8. Health Checks

**Endpoint:** /api/health

**File:** app/src/app/api/health/route.ts

Railway calls this endpoint every 30 seconds to verify service health.

Response format:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "database": "connected"
}
```

---

## 9. Troubleshooting

### Common Issues

**Issue: TypeScript errors in CI**

Solution:
```bash
cd app
npm run typecheck
# Fix reported errors
```

**Issue: Deployment fails**

Check:
1. Railway environment variables are set
2. DATABASE_URL is configured
3. Service name matches workflow

**Issue: Health check timeout**

Debug:
```bash
railway logs --follow
```

---

## 10. Future Improvements

### Short-term

1. Add unit tests to pipeline (npm run test:run)
2. Fix TypeScript errors
3. Add test coverage reporting

### Medium-term

1. Staging environment for PRs
2. E2E tests with Playwright
3. Performance testing

### Long-term

1. Multi-region deployment
2. Blue-green deployments
3. Automated rollbacks

---

## Quick Reference Commands

### Check Pipeline Status
```bash
gh run list -R tjsasakifln/smart-pp
gh run view -R tjsasakifln/smart-pp
```

### Manual Deployment
```bash
railway login
railway link
railway up
```

### View Logs
```bash
railway logs --follow
```

### Update Secrets
```bash
gh secret set RAILWAY_TOKEN -R tjsasakifln/smart-pp
```

---

**Last Updated:** 2026-02-03
**Maintained By:** DevOps Team
