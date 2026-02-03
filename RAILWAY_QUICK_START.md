# Railway Quick Start Guide

Guia rápido para fazer deploy do Licita Preços no Railway em 10 minutos.

## 1. Pré-requisitos (2 min)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login
```

## 2. Criar Projeto (3 min)

### Via Web Dashboard (Recomendado)

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha seu repositório

### Via CLI (Alternativa)

```bash
# Na raiz do projeto
railway init
```

## 3. Adicionar PostgreSQL (1 min)

No Railway Dashboard:
1. Clique em "New"
2. Selecione "Database" > "PostgreSQL"
3. Aguarde provisionamento (30 segundos)

## 4. Configurar Service Settings (2 min)

No serviço da aplicação:

**Settings > General:**
- Root Directory: `/app`

**Settings > Variables:**
```bash
DATABASE_URL=${DATABASE_URL}  # Auto-linked do PostgreSQL
NEXT_PUBLIC_APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

**Settings > Domains:**
- Clique em "Generate Domain"
- Copie o domínio gerado

## 5. Deploy (2 min)

### Deploy Automático
- Push para branch `main` ou `master`
- Railway detecta mudanças e deploya automaticamente

### Deploy Manual via CLI
```bash
cd app
railway up
```

## 6. Setup Database (1 min)

Após primeiro deploy:

```bash
railway run npx prisma db push
```

## 7. Verificar Deploy (1 min)

```bash
# Test health endpoint
curl https://seu-dominio.up.railway.app/api/health

# Ver logs
railway logs
```

## Comandos Úteis

```bash
# Ver status do projeto
railway status

# Abrir dashboard
railway open

# Ver logs em tempo real
railway logs -f

# Executar comando no container
railway run [comando]

# Fazer rollback
railway rollback

# Ver variáveis de ambiente
railway variables
```

## CI/CD com GitHub Actions

1. Gerar token no Railway:
   - Project Settings > Tokens > New Token

2. Adicionar ao GitHub:
   - Repo Settings > Secrets > New secret
   - Nome: `RAILWAY_TOKEN`
   - Valor: [seu-token]

3. Push para `main` - deploy automático!

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Build falha | Verificar `DATABASE_URL` e logs de build |
| Health check falha | Verificar conexão com database |
| 404 error | Confirmar Root Directory é `/app` |
| Slow startup | Normal no cold start (5-10s) |

## Custos

- **Free Tier:** $5 crédito/mês (suficiente para testes)
- **Hobby Plan:** $5/mês (produção pequena)
- **PostgreSQL:** Incluído no plano

## Próximos Passos

- [ ] Configurar domínio customizado (opcional)
- [ ] Adicionar monitoring (UptimeRobot)
- [ ] Configurar backups do database
- [ ] Setup staging environment

## Links Úteis

- Railway Dashboard: https://railway.app
- Docs: https://docs.railway.app
- Status: https://status.railway.app
- Community: https://discord.gg/railway

---
**Deploy bem-sucedido?** Confira o [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) completo!
