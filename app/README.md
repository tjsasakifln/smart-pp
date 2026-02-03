# Licita Precos

Sistema de pesquisa de precos para processos licitatorios, utilizando dados abertos do Governo Federal e PNCP (Portal Nacional de Contratacoes Publicas).

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **UI:** shadcn/ui + Tailwind CSS
- **Deploy:** Railway

## Data Sources

| Source | Description | Status |
|--------|-------------|--------|
| **PNCP** | Portal Nacional de Contratacoes Publicas | Planned (Sprint 2) |
| **Compras.gov.br** | API de Dados Abertos | Planned (Sprint 2) |
| **Mock Data** | Dados simulados para desenvolvimento | Active |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Railway)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   └── search/        # Search API (POST)
│   ├── historico/         # History page
│   ├── resultados/        # Search results page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── search/           # Search bar components
│   └── results/          # Results display components
├── types/                # TypeScript types
│   └── search.ts         # Search-related types
└── lib/                  # Utilities
    ├── prisma.ts         # Prisma client
    └── utils.ts          # Helper functions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with database status |
| POST | `/api/search` | Search for prices by term |

### POST /api/search

**Request:**
```json
{
  "term": "papel A4",
  "page": 1,
  "pageSize": 20
}
```

**Response:**
```json
{
  "id": "search_123",
  "term": "papel A4",
  "results": [
    {
      "id": "1",
      "description": "PAPEL A4, 75G/M2, BRANCO",
      "price": 22.50,
      "unit": "RESMA",
      "source": "PNCP - Pregao Eletronico",
      "sourceUrl": "https://pncp.gov.br/...",
      "quotationDate": "2024-01-15",
      "organ": "Ministerio da Gestao"
    }
  ],
  "stats": {
    "count": 3,
    "average": 22.77,
    "median": 22.50,
    "min": 21.80,
    "max": 24.00
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalResults": 3
  }
}
```

## Features

- [x] Landing page with search bar
- [x] Search API with mock data
- [x] Results table with all columns
- [x] Statistics card (average, median, min, max)
- [x] Loading and error states
- [ ] Real API integration (PNCP + Compras.gov.br)
- [ ] Filters (price, date, source)
- [ ] Excel export
- [ ] PDF report generation
- [ ] Search history

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript compiler
```

## Deploy to Railway

### Prerequisites

- [Railway account](https://railway.app) (free tier available)
- [Railway CLI](https://docs.railway.app/guides/cli) installed (optional, for manual deploys)
- GitHub account connected to Railway

### Option 1: Deploy via GitHub (Recommended)

1. **Create Railway Project**
   ```bash
   # Login to Railway
   railway login

   # Create new project
   railway init
   ```

2. **Add PostgreSQL Database**
   - Go to your Railway project dashboard
   - Click "New" > "Database" > "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

3. **Configure Environment Variables**

   Go to your service settings and add:

   | Variable | Value | Description |
   |----------|-------|-------------|
   | `DATABASE_URL` | (auto-set) | PostgreSQL connection string |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.up.railway.app` | Your app's public URL |
   | `NODE_ENV` | `production` | Node environment |

4. **Connect GitHub Repository**
   - In Railway dashboard, click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Next.js app in `/app` directory
   - Set root directory to `/app` in service settings

5. **Configure GitHub Actions (CI/CD)**

   Add Railway token to GitHub secrets:
   - Go to Railway dashboard > Project Settings > Tokens
   - Generate a new project token
   - Go to GitHub repo > Settings > Secrets and variables > Actions
   - Add new secret: `RAILWAY_TOKEN` with the token value

6. **Deploy**
   - Push to `main` or `master` branch
   - GitHub Actions will run tests and deploy automatically
   - Monitor deployment in Railway dashboard

### Option 2: Deploy via Railway CLI

```bash
# From project root directory
cd app

# Link to Railway project
railway link

# Deploy
railway up
```

### Railway Configuration

The project includes `railway.toml` (in root) with:
- **Builder:** nixpacks (auto-detects Next.js)
- **Start command:** `npm run start`
- **Health check:** `/api/health` endpoint
- **Restart policy:** On failure, max 3 retries

### Post-Deploy: Database Setup

After first deploy, run migrations:

```bash
# Using Railway CLI
railway run npx prisma db push

# Or via Railway dashboard
# Go to service > Settings > Deploy > Add command
# Run: npx prisma db push
```

### Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "version": "1.0.0",
     "checks": {
       "database": "ok"
     }
   }
   ```

2. **Check Logs**
   ```bash
   railway logs
   ```

### Troubleshooting

**Build Fails:**
- Check if `DATABASE_URL` is set (even placeholder is OK for build)
- Verify Node.js version (18+)
- Check Railway build logs

**Health Check Fails:**
- Verify database is running and connected
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check application logs for errors

**Prisma Issues:**
- Ensure `postinstall` script runs: `prisma generate`
- Run database migrations after first deploy
- Check Prisma schema matches database

### Cost Estimation

Railway pricing:
- **Free tier:** $5 credit/month (sufficient for testing)
- **PostgreSQL:** ~$5-10/month (500MB storage)
- **Web service:** $5/month (starter plan)
- **Total:** ~$10-15/month for production

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/deploy.yml`):
1. Runs on push to `main`/`master` or PRs
2. Tests:
   - Installs dependencies
   - Runs ESLint
   - Runs TypeScript type check
   - Builds application
3. Deploys (only on `main`/`master`):
   - Uses Railway CLI
   - Deploys to production environment

### Environment Variables Reference

Complete list of environment variables:

```bash
# Required
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional
NEXT_PUBLIC_APP_URL="https://licita-precos.up.railway.app"
NODE_ENV="production"

# For development
NEXT_TELEMETRY_DISABLED=1
```

### Monitoring

- **Railway Dashboard:** Real-time logs and metrics
- **Health Check:** Automated via `/api/health`
- **Uptime Monitoring:** Consider UptimeRobot or Railway's built-in monitoring

## Documentation

- [PRD (Product Requirements)](../docs/prd.md)
- [Architecture](../docs/architecture.md)
- [PNCP API Analysis](../docs/pncp-api-analysis.md)

## Development Status

**Current Sprint:** 1 - Foundation Completion

| Story | Status |
|-------|--------|
| 1.1 Setup with Landing Page | In Progress |
| 1.2 Search Flow with Mock Data | Complete |
| 1.3 Real API Integration | Planned |
| 1.4 Links and Data Quality | Planned |

## License

MIT
