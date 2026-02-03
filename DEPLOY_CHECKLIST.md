# Deploy Checklist - Railway

Siga este checklist para garantir um deploy bem-sucedido no Railway.

## Pre-Deploy

- [ ] Código está na branch `main` ou `master`
- [ ] Todos os testes estão passando localmente
  ```bash
  cd app
  npm run lint
  npm run typecheck
  npm run build
  ```
- [ ] Prisma schema está atualizado
- [ ] README.md está atualizado com instruções corretas

## Railway Setup

### 1. Criar Projeto no Railway
- [ ] Acesse [railway.app](https://railway.app)
- [ ] Clique em "New Project"
- [ ] Selecione "Deploy from GitHub repo"
- [ ] Escolha o repositório `Licita Preços`

### 2. Configurar Serviço PostgreSQL
- [ ] No projeto, clique em "New" > "Database" > "Add PostgreSQL"
- [ ] Aguarde o provisionamento do banco
- [ ] Verifique que a variável `DATABASE_URL` foi criada automaticamente

### 3. Configurar Serviço da Aplicação
- [ ] No serviço da aplicação, vá em "Settings"
- [ ] Configure "Root Directory" como `/app`
- [ ] Verifique que o builder detectado é "Nixpacks"
- [ ] Confirme que o comando de start é `npm run start`

### 4. Adicionar Variáveis de Ambiente
No serviço, vá em "Variables" e adicione:

- [ ] `DATABASE_URL` (já deve estar linkada ao PostgreSQL)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- [ ] `NODE_ENV` = `production`
- [ ] (Opcional) `NEXT_TELEMETRY_DISABLED` = `1`

### 5. Configurar Domínio
- [ ] Vá em "Settings" > "Domains"
- [ ] Clique em "Generate Domain"
- [ ] Copie o domínio gerado (ex: `licita-precos-production.up.railway.app`)
- [ ] Atualize `NEXT_PUBLIC_APP_URL` com o domínio gerado

### 6. Deploy Inicial
- [ ] Clique em "Deploy" ou faça push para `main`/`master`
- [ ] Acompanhe os logs de build
- [ ] Aguarde conclusão do deploy (pode levar 2-5 minutos)

### 7. Executar Migrations
Após o primeiro deploy:

```bash
# Opção 1: Via Railway CLI
railway login
railway link
railway run npx prisma db push

# Opção 2: Via Railway Dashboard
# Settings > Deploy > Run Command
# Comando: npx prisma db push
```

- [ ] Migrations executadas com sucesso
- [ ] Tabelas criadas no banco de dados

## Post-Deploy Verification

### 1. Verificar Health Check
```bash
curl https://seu-dominio.up.railway.app/api/health
```

Resposta esperada:
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

- [ ] Health check retornando status 200
- [ ] Database check retornando "ok"

### 2. Verificar Logs
```bash
railway logs
```

- [ ] Sem erros críticos nos logs
- [ ] Aplicação iniciada corretamente
- [ ] Prisma client gerado com sucesso

### 3. Testar Funcionalidades
- [ ] Página inicial carrega corretamente
- [ ] Busca funciona (pode usar mock data)
- [ ] Resultados são exibidos corretamente
- [ ] Histórico de buscas funciona
- [ ] API `/api/search` responde corretamente

### 4. Verificar Performance
- [ ] Tempo de resposta da página inicial < 2s
- [ ] Health check responde em < 500ms
- [ ] API search responde em < 3s

## GitHub Actions CI/CD

### 1. Configurar Railway Token
- [ ] No Railway, vá em "Project Settings" > "Tokens"
- [ ] Gere um novo token de projeto
- [ ] Copie o token

### 2. Adicionar Secret no GitHub
- [ ] No GitHub, vá em "Settings" > "Secrets and variables" > "Actions"
- [ ] Clique em "New repository secret"
- [ ] Nome: `RAILWAY_TOKEN`
- [ ] Valor: cole o token do Railway
- [ ] Salve

### 3. Verificar Workflow
- [ ] Arquivo `.github/workflows/deploy.yml` existe
- [ ] Workflow configurado para branch `main`/`master`
- [ ] Jobs de test e deploy estão corretos

### 4. Testar CI/CD
- [ ] Faça uma alteração simples no código
- [ ] Commit e push para `main`/`master`
- [ ] Verifique execução do workflow no GitHub Actions
- [ ] Confirme deploy automático no Railway

## Rollback (se necessário)

Se algo der errado:

### Via Railway Dashboard
- [ ] Vá em "Deployments"
- [ ] Selecione um deploy anterior estável
- [ ] Clique em "Redeploy"

### Via Railway CLI
```bash
railway rollback
```

## Monitoring & Maintenance

### Configurar Monitoramento
- [ ] Adicionar Railway ao seu dashboard de monitoramento
- [ ] Configurar alertas para downtime
- [ ] Configurar alertas para uso de recursos (CPU, memória)

### Recursos Recomendados
- [ ] [UptimeRobot](https://uptimerobot.com) - Free tier para monitoring
- [ ] [Railway Analytics](https://railway.app/docs) - Built-in metrics
- [ ] [Sentry](https://sentry.io) - Error tracking (opcional)

## Troubleshooting Common Issues

### Build Falha
- [ ] Verificar se `DATABASE_URL` está definida
- [ ] Confirmar Node.js version 18+
- [ ] Checar logs de build para erros específicos
- [ ] Testar build localmente: `npm run build`

### Health Check Falha
- [ ] Verificar se database está running
- [ ] Confirmar `DATABASE_URL` está correta
- [ ] Checar se Prisma client foi gerado
- [ ] Verificar logs da aplicação

### Database Connection Error
- [ ] Confirmar que PostgreSQL service está running
- [ ] Verificar link entre serviços no Railway
- [ ] Testar connection string localmente
- [ ] Checar se migrations foram executadas

### 404 ou 500 Errors
- [ ] Verificar se build completou com sucesso
- [ ] Checar se rotas estão configuradas corretamente
- [ ] Verificar logs da aplicação para stack traces
- [ ] Confirmar variáveis de ambiente

## Final Checklist

- [ ] Deploy em produção funcionando
- [ ] Health check passing
- [ ] Database conectado
- [ ] CI/CD configurado
- [ ] Monitoring ativo
- [ ] Documentação atualizada
- [ ] Equipe notificada

## Support

- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- GitHub Actions Docs: https://docs.github.com/actions

---
**Última atualização:** 2024-01-15
**Versão:** 1.0.0
