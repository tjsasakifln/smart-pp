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

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL service
3. Connect GitHub repository
4. Set environment variables:
   - `DATABASE_URL` (auto-set by Railway PostgreSQL)
5. Railway will auto-detect Next.js and deploy

### Railway Configuration

The project includes `railway.toml` with:
- Build command: `npm run build`
- Start command: `npm run start`
- Health check: `/api/health`

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
