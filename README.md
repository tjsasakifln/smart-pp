# Licita Preços

Sistema de pesquisa de preços para processos licitatórios, utilizando dados abertos do Governo Federal e PNCP (Portal Nacional de Contratações Públicas).

## Estrutura do Projeto

```
Licita Preços/
├── app/                        # Aplicação Next.js
│   ├── src/                   # Código fonte
│   ├── prisma/                # Schema e migrations
│   ├── public/                # Assets estáticos
│   └── package.json           # Dependências
├── docs/                      # Documentação
│   ├── architecture.md        # Arquitetura do sistema
│   ├── prd.md                 # Product Requirements
│   └── stories/               # User stories
├── .github/                   # GitHub Actions CI/CD
│   └── workflows/
│       └── deploy.yml         # Workflow de deploy
├── railway.toml               # Configuração Railway
├── DEPLOY_CHECKLIST.md        # Checklist completo de deploy
└── RAILWAY_QUICK_START.md     # Guia rápido de deploy
```

## Quick Start

### Desenvolvimento Local

```bash
cd app
npm install
cp .env.example .env
# Edite .env com sua DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev
```

Acesse http://localhost:3000

### Deploy no Railway

**Opção 1: Guia Rápido (10 min)**
Veja [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)

**Opção 2: Checklist Completo**
Veja [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

**Documentação Detalhada**
Veja [app/README.md](./app/README.md)

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **UI:** Tailwind CSS
- **Deploy:** Railway
- **CI/CD:** GitHub Actions

## Data Sources

| Source | Status |
|--------|--------|
| PNCP API | Integrado |
| Compras.gov.br | Planejado |
| Mock Data | Disponível |

## Features

- Landing page com busca
- API de busca (POST /api/search)
- Tabela de resultados
- Estatísticas (média, mediana, min, max)
- Health check endpoint
- Integração PNCP real
- Exportação Excel

**Em desenvolvimento:**
- Filtros avançados
- Histórico de buscas
- Geração de PDF

## Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento
npm run build      # Build para produção
npm run start      # Start produção
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## Arquitetura

Veja documentação completa em [docs/architecture.md](./docs/architecture.md)

**Componentes Principais:**
- **Frontend:** React 19 com Next.js 14 App Router
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Data Layer:** Adapters para PNCP e Compras.gov.br
- **Deploy:** Railway com CI/CD via GitHub Actions

## Configuração de Deploy

### Railway Configuration (railway.toml)

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### GitHub Actions Workflow

O projeto inclui CI/CD automatizado:
- **Tests:** Lint + TypeCheck + Build
- **Deploy:** Automático para Railway em push para `main`/`master`

Configuração: `.github/workflows/deploy.yml`

### Environment Variables

Variáveis necessárias no Railway:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (auto-set) |
| `NEXT_PUBLIC_APP_URL` | App public URL |
| `NODE_ENV` | `production` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + DB status |
| POST | `/api/search` | Search prices by term |

### Example: POST /api/search

```bash
curl -X POST https://seu-app.railway.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"term": "papel A4", "page": 1, "pageSize": 20}'
```

## Development Status

**Current Sprint:** 1 - Foundation

| Story | Status |
|-------|--------|
| 1.1 Setup + Landing | Complete |
| 1.2 Search with Mock | Complete |
| 1.3 PNCP Integration | Complete |
| 1.4 Data Quality | In Progress |
| 2.x Epic 2 | Planned |

## Documentation

- [Product Requirements](./docs/prd.md)
- [Architecture](./docs/architecture.md)
- [PNCP API Analysis](./docs/pncp-api-analysis.md)
- [Application README](./app/README.md)

## Support

- Railway: https://docs.railway.app
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- PNCP API: https://pncp.gov.br/api

## License

MIT

---
**Squad:** Licita Preços Team
