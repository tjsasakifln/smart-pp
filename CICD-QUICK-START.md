# CI/CD Quick Start Guide

## For Developers

### What happens when I push code?

**On Pull Request:**
1. Tests run automatically (lint, typecheck, build)
2. PR shows check status (green = pass, red = fail)
3. No deployment happens

**On Merge to master/main:**
1. Tests run automatically
2. If tests pass, auto-deploys to Railway
3. Production site updates in ~5-10 minutes

### Before Pushing

```bash
cd app
npm run lint        # Check code style
npm run typecheck   # Check TypeScript
npm run test        # Run unit tests
npm run build       # Verify build works
```

### If CI Fails

1. Check the Actions tab on GitHub
2. Click on the failed run
3. Read the error message
4. Fix the error locally
5. Push again

## For DevOps

### Required Secrets

**GitHub (Repository Settings → Secrets):**
- RAILWAY_TOKEN

**Railway (Dashboard → Service → Variables):**
- DATABASE_URL (auto)
- NEXT_PUBLIC_APP_URL
- NODE_ENV=production

### Manual Deployment

```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### View Logs

```bash
railway logs --follow
```

### Check Pipeline Status

```bash
gh run list
gh run view
```

## Health Check

URL: https://your-app.railway.app/api/health

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

## Current Issues

1. Fix TypeScript errors in:
   - src/app/api/export/excel/route.ts
   - src/test/setup.ts

2. Verify RAILWAY_TOKEN is set

## Documentation

See docs/ci-cd-pipeline.md for complete details.
