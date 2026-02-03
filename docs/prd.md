# Licita Preços - Product Requirements Document (PRD)

**Versão:** 1.0
**Data:** 2026-02-03
**Autor:** Morgan (PM Agent)
**Status:** Draft

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-03 | 1.0 | Documento inicial completo | Morgan (PM) |

---

## 1. Goals and Background Context

### 1.1 Goals (Objetivos)

- **Permitir pesquisa de preços** mediante inserção de termos específicos pelo usuário
- **Retornar preços praticados** para produtos e/ou serviços de interesse
- **Exibir resultados na tela** de forma clara e organizada
- **Exportar para planilha Excel** para uso em documentação oficial
- **Incluir fontes verificáveis** com links para cada preço encontrado
- **Suportar uso oficial** em referências de processos licitatórios

### 1.2 Background Context (Contexto)

Em processos licitatórios, a pesquisa de preços é etapa obrigatória para fundamentar o valor estimado das contratações públicas. A legislação brasileira (Lei 14.133/2021 - Nova Lei de Licitações) exige que os preços de referência sejam obtidos de fontes confiáveis e rastreáveis. Atualmente, esse processo é manual, demorado e sujeito a inconsistências.

Este sistema visa automatizar a coleta de preços de mercado, consolidando informações de múltiplas fontes verificáveis em um formato padronizado para uso em processos de contratação pública.

---

## 2. Requirements (Requisitos)

### 2.1 Functional Requirements (Requisitos Funcionais)

| ID | Requisito |
|----|-----------|
| **FR1** | O sistema deve permitir ao usuário inserir termos de busca (palavras-chave) para pesquisa de preços de produtos e/ou serviços |
| **FR2** | O sistema deve realizar buscas em fontes públicas de preços (ex: Painel de Preços do Governo Federal, Banco de Preços, ComprasNet, atas de registro de preços) |
| **FR3** | O sistema deve exibir os resultados na tela em formato de tabela contendo: descrição do item, preço unitário, fonte, data da cotação e link verificável |
| **FR4** | O sistema deve permitir exportação dos resultados para planilha Excel (.xlsx) mantendo todos os dados e links |
| **FR5** | O sistema deve calcular automaticamente estatísticas de preço (média, mediana, menor e maior valor) para os resultados encontrados |
| **FR6** | O sistema deve permitir filtrar resultados por faixa de preço, data e fonte |
| **FR7** | O sistema deve armazenar histórico de pesquisas realizadas pelo usuário |
| **FR8** | O sistema deve gerar relatório formatado para anexar em processos licitatórios |

### 2.2 Non-Functional Requirements (Requisitos Não Funcionais)

| ID | Requisito |
|----|-----------|
| **NFR1** | O sistema deve estar disponível via navegador web (responsivo) |
| **NFR2** | O tempo de resposta para pesquisas deve ser inferior a 30 segundos |
| **NFR3** | Os links das fontes devem ser validados antes de exibição (verificar se ainda estão ativos) |
| **NFR4** | O sistema deve funcionar sem necessidade de instalação local (SaaS) |
| **NFR5** | Os dados de pesquisa devem ser armazenados de forma segura e em conformidade com a LGPD |
| **NFR6** | O sistema deve suportar múltiplos usuários simultâneos |
| **NFR7** | A interface deve ser intuitiva, permitindo uso sem treinamento extensivo |

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

Interface limpa e objetiva, focada em produtividade. O usuário deve conseguir realizar uma pesquisa de preços e exportar resultados em menos de 2 minutos. Visual profissional adequado ao contexto de uso em órgãos públicos.

### 3.2 Key Interaction Paradigms

- **Search-first:** Barra de pesquisa como elemento central e ponto de entrada principal
- **Progressive disclosure:** Filtros e opções avançadas revelados conforme necessidade
- **One-click export:** Exportação para Excel acessível diretamente da tela de resultados
- **Inline preview:** Visualização rápida de detalhes sem sair da listagem

### 3.3 Core Screens and Views

| Tela | Descrição |
|------|-----------|
| **Home / Pesquisa** | Barra de busca central, histórico recente, acesso rápido |
| **Resultados** | Tabela de preços com fontes, filtros laterais, estatísticas resumidas no topo |
| **Detalhes do Item** | Expansão inline ou modal com informações completas e link da fonte |
| **Exportação/Relatório** | Preview do documento antes de exportar, opções de formato |
| **Histórico** | Lista de pesquisas anteriores com opção de refazer |

### 3.4 Accessibility

**WCAG AA**

Justificativa: Órgãos públicos brasileiros devem seguir diretrizes de acessibilidade (eMAG). WCAG AA é o padrão mínimo recomendado.

### 3.5 Branding

Visual neutro e institucional. Cores sóbrias (azul, cinza, branco). Tipografia clara e legível. Sem elementos decorativos excessivos.

### 3.6 Target Platforms

**Web Responsivo**

- Desktop: Uso principal (ambiente de trabalho em órgãos públicos)
- Tablet/Mobile: Suporte secundário para consultas rápidas

---

## 4. Technical Assumptions

### 4.1 Repository Structure

**Monorepo**

Justificativa: Projeto único com frontend e backend acoplados. Monorepo simplifica CI/CD, compartilhamento de tipos e deploy no Railway.

### 4.2 Service Architecture

**Monolito Modular**

```
┌─────────────────────────────────────────┐
│            Frontend (React/Next.js)      │
├─────────────────────────────────────────┤
│            Backend API (Node.js)         │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Search  │ │ Export  │ │ Scraping  │  │
│  │ Module  │ │ Module  │ │  Module   │  │
│  └─────────┘ └─────────┘ └───────────┘  │
├─────────────────────────────────────────┤
│           Database (PostgreSQL)          │
└─────────────────────────────────────────┘
```

### 4.3 Tech Stack

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router) | SSR, ótimo DX, deploy fácil no Railway |
| **UI Components** | shadcn/ui + Tailwind CSS | Componentes acessíveis, estilização rápida |
| **Backend** | Next.js API Routes | Simplicidade, TypeScript end-to-end |
| **Database** | PostgreSQL | Robusto, suportado pelo Railway, bom para queries complexas |
| **ORM** | Prisma | Type-safe, migrations fáceis, boa DX |
| **Export Excel** | ExcelJS ou SheetJS | Geração de .xlsx no servidor |
| **Scraping/API** | Playwright (se necessário) | Para fontes sem API pública |
| **Linguagem** | TypeScript | Type-safety, menos bugs, melhor manutenção |

### 4.4 Deployment & Infrastructure

| Aspecto | Escolha | Notas |
|---------|---------|-------|
| **Plataforma** | Railway | Conforme solicitado |
| **Database Hosting** | Railway PostgreSQL | Incluso na plataforma |
| **CI/CD** | GitHub Actions → Railway | Deploy automático em push |
| **Ambiente** | Staging + Production | Dois ambientes no Railway |

### 4.5 Testing Requirements

| Tipo | Ferramenta | Cobertura |
|------|------------|-----------|
| Unit Tests | Vitest | Lógica de negócio, utilitários |
| Integration Tests | Vitest + Testing Library | Componentes, API routes |
| E2E Tests | Playwright (fase 2) | Fluxos críticos após MVP |

### 4.6 Additional Technical Assumptions

- **Autenticação:** Inicialmente sem login (MVP). Fase 2: autenticação simples se necessário
- **Rate Limiting:** Implementar para evitar bloqueio das fontes de dados
- **Cache:** Redis ou cache em memória para resultados recentes
- **Logging:** Estruturado (Pino) para debugging em produção
- **Monitoramento:** Railway metrics + Sentry para erros
- **Fonte Prioritária:** Painel de Preços do Governo Federal (mais completo)

---

## 5. Epic List

| # | Épico | Objetivo |
|---|-------|----------|
| **1** | **Fundação & Pesquisa Básica** | Estabelecer infraestrutura do projeto e entregar funcionalidade mínima de pesquisa de preços com exibição de resultados |
| **2** | **Resultados Avançados & Exportação** | Adicionar estatísticas de preço, filtros avançados e exportação para Excel |
| **3** | **Histórico & Relatórios Oficiais** | Implementar histórico de pesquisas e geração de relatórios formatados para processos licitatórios |

---

## 6. Epic 1: Fundação & Pesquisa Básica

### Objetivo

Estabelecer toda a infraestrutura técnica do projeto (Next.js, PostgreSQL, deploy no Railway) enquanto entrega a primeira fatia funcional de valor: o usuário pode inserir um termo de busca e visualizar preços reais de pelo menos uma fonte governamental. Ao final deste épico, teremos um sistema deployado e utilizável, mesmo que com funcionalidades limitadas.

### Stories

#### Story 1.1: Setup do Projeto com Landing Page

> Como **desenvolvedor**,
> Eu quero **ter o projeto configurado e deployado com uma landing page funcional**,
> Para que **tenhamos a base técnica pronta e algo visível no ar desde o início**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Projeto Next.js 14+ inicializado com TypeScript, Tailwind CSS e shadcn/ui |
| AC2 | Prisma configurado com schema inicial e conectado ao PostgreSQL |
| AC3 | Projeto deployado no Railway com variáveis de ambiente configuradas |
| AC4 | Landing page exibindo barra de pesquisa centralizada (UI apenas, sem funcionalidade) |
| AC5 | Endpoint `/api/health` retornando status 200 com timestamp |
| AC6 | README com instruções de setup local e deploy |

---

#### Story 1.2: Fluxo de Pesquisa com Dados Mock

> Como **usuário**,
> Eu quero **digitar um termo e ver resultados de preços na tela**,
> Para que **eu possa validar o fluxo de busca antes da integração com fontes reais**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Barra de pesquisa funcional que submete o termo para a API |
| AC2 | Endpoint `POST /api/search` recebe termo e retorna array de resultados |
| AC3 | Resultados mock retornados contendo: descrição, preço, fonte, data, link |
| AC4 | Tabela de resultados exibida na tela com todas as colunas |
| AC5 | Estado de loading exibido durante a busca |
| AC6 | Estado de "nenhum resultado" tratado adequadamente |

---

#### Story 1.3: Integração com Fonte de Preços Real

> Como **usuário**,
> Eu quero **ver preços reais de fontes governamentais**,
> Para que **eu possa usar os dados em processos licitatórios**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Integração funcional com Painel de Preços do Governo Federal |
| AC2 | Dados retornados contêm: descrição do item, preço unitário, unidade de medida, órgão/fonte, data da cotação |
| AC3 | Tratamento de erros da fonte externa com mensagem amigável ao usuário |
| AC4 | Rate limiting implementado para evitar bloqueio da fonte |
| AC5 | Cache básico de resultados (5-15 min) para reduzir requisições |
| AC6 | Logs estruturados das requisições para debugging |

---

#### Story 1.4: Links Verificáveis e Qualidade dos Dados

> Como **usuário de órgão público**,
> Eu quero **que cada preço tenha um link verificável para a fonte original**,
> Para que **eu possa comprovar a origem dos dados em processos oficiais**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Cada resultado exibe link clicável que abre a fonte original em nova aba |
| AC2 | Links são validados (verificação básica de URL válida) antes de exibição |
| AC3 | Indicador visual para links que não puderam ser verificados |
| AC4 | Coluna "Fonte" exibe nome legível da origem (não apenas URL) |
| AC5 | Data da cotação formatada no padrão brasileiro (DD/MM/AAAA) |
| AC6 | Preços formatados em Real brasileiro (R$ X.XXX,XX) |

---

## 7. Epic 2: Resultados Avançados & Exportação

### Objetivo

Transformar os resultados básicos em uma ferramenta de análise completa. O usuário poderá visualizar estatísticas de preço (média, mediana, menor e maior valor) conforme exigido pela IN 65/2021, aplicar filtros para refinar os dados, e exportar tudo para Excel pronto para anexar em processos licitatórios.

### Stories

#### Story 2.1: Cálculo e Exibição de Estatísticas de Preço

> Como **servidor público responsável por licitações**,
> Eu quero **ver estatísticas calculadas automaticamente (média, mediana, mínimo, máximo)**,
> Para que **eu possa formar o preço de referência conforme exigido pela legislação**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Card de resumo estatístico exibido acima da tabela de resultados |
| AC2 | Estatísticas calculadas: Média aritmética, Mediana, Menor valor, Maior valor |
| AC3 | Quantidade total de resultados exibida |
| AC4 | Valores formatados em Real (R$ X.XXX,XX) |
| AC5 | Estatísticas recalculadas automaticamente ao aplicar filtros |
| AC6 | Tooltip explicando cada métrica |

---

#### Story 2.2: Filtros de Resultados

> Como **usuário**,
> Eu quero **filtrar os resultados por faixa de preço, data e fonte**,
> Para que **eu possa refinar a análise e excluir valores atípicos**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Painel de filtros lateral ou colapsável na página de resultados |
| AC2 | Filtro por faixa de preço (valor mínimo e máximo) com inputs numéricos |
| AC3 | Filtro por período (data inicial e final) com date picker |
| AC4 | Filtro por fonte (checkbox múltiplo se houver mais de uma fonte) |
| AC5 | Botão "Limpar filtros" para resetar todos os filtros |
| AC6 | Filtros aplicados em tempo real (sem necessidade de botão "aplicar") |
| AC7 | URL atualizada com parâmetros de filtro (permite compartilhar busca filtrada) |

---

#### Story 2.3: Ordenação de Resultados

> Como **usuário**,
> Eu quero **ordenar os resultados por diferentes colunas**,
> Para que **eu possa analisar os dados de diferentes perspectivas**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Cabeçalhos de coluna clicáveis para ordenação |
| AC2 | Ordenação por: Preço, Data, Descrição, Fonte |
| AC3 | Toggle entre ordem ascendente e descendente |
| AC4 | Indicador visual da coluna e direção de ordenação ativa |
| AC5 | Ordenação padrão: por data (mais recente primeiro) |

---

#### Story 2.4: Exportação para Excel

> Como **servidor público**,
> Eu quero **exportar os resultados para uma planilha Excel**,
> Para que **eu possa anexar a pesquisa de preços no processo licitatório**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Botão "Exportar Excel" visível na página de resultados |
| AC2 | Arquivo .xlsx gerado contendo todas as colunas da tabela |
| AC3 | Links das fontes incluídos como hyperlinks clicáveis no Excel |
| AC4 | Cabeçalho do arquivo contendo: termo pesquisado, data/hora da exportação |
| AC5 | Seção de estatísticas incluída no topo da planilha |
| AC6 | Se filtros aplicados, exportar apenas dados filtrados |
| AC7 | Nome do arquivo: `pesquisa-precos-{termo}-{data}.xlsx` |
| AC8 | Download inicia automaticamente após geração |

---

#### Story 2.5: Paginação de Resultados

> Como **usuário**,
> Eu quero **navegar por resultados extensos com paginação**,
> Para que **o sistema permaneça performático mesmo com muitos resultados**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Resultados paginados com 20 itens por página (padrão) |
| AC2 | Seletor para alterar itens por página (10, 20, 50, 100) |
| AC3 | Navegação: primeira, anterior, próxima, última página |
| AC4 | Indicador de página atual e total (ex: "Página 2 de 15") |
| AC5 | Indicador de total de resultados (ex: "298 resultados encontrados") |
| AC6 | Exportação Excel exporta TODOS os resultados, não apenas página atual |

---

## 8. Epic 3: Histórico & Relatórios Oficiais

### Objetivo

Completar a experiência do usuário com funcionalidades que suportam o uso contínuo e oficial do sistema. O usuário poderá acessar pesquisas realizadas anteriormente sem precisar refazê-las, e gerar relatórios formatados prontos para anexar em processos licitatórios, cumprindo os requisitos formais de documentação de pesquisa de preços.

### Stories

#### Story 3.1: Persistência do Histórico de Pesquisas

> Como **usuário**,
> Eu quero **que minhas pesquisas sejam salvas automaticamente**,
> Para que **eu possa acessá-las posteriormente sem refazer o trabalho**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Cada pesquisa realizada é salva no banco de dados automaticamente |
| AC2 | Dados salvos: termo pesquisado, data/hora, quantidade de resultados, filtros aplicados |
| AC3 | Resultados da pesquisa são armazenados (snapshot) para consulta futura |
| AC4 | Limite de armazenamento: últimas 100 pesquisas (FIFO) |
| AC5 | Modelo de dados Prisma criado para histórico |

---

#### Story 3.2: Interface de Histórico de Pesquisas

> Como **usuário**,
> Eu quero **visualizar e acessar minhas pesquisas anteriores**,
> Para que **eu possa retomar trabalhos ou comparar resultados**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/historico` listando pesquisas anteriores |
| AC2 | Lista exibe: termo, data/hora, quantidade de resultados |
| AC3 | Ordenação por data (mais recente primeiro) |
| AC4 | Busca/filtro dentro do histórico por termo |
| AC5 | Clique em item do histórico abre os resultados salvos |
| AC6 | Botão "Refazer pesquisa" para executar novamente com dados atualizados |
| AC7 | Botão "Excluir" para remover item do histórico |
| AC8 | Link para histórico acessível no header/navegação principal |

---

#### Story 3.3: Geração de Relatório Oficial

> Como **servidor responsável por licitação**,
> Eu quero **gerar um relatório formatado da pesquisa de preços**,
> Para que **eu possa anexar diretamente no processo licitatório**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Botão "Gerar Relatório" na página de resultados |
| AC2 | Relatório gerado em formato PDF |
| AC3 | Cabeçalho contendo: título "Pesquisa de Preços", data de geração, termo pesquisado |
| AC4 | Seção de metodologia explicando as fontes consultadas |
| AC5 | Tabela com todos os resultados (ou filtrados, se aplicável) |
| AC6 | Seção de estatísticas: média, mediana, menor, maior, quantidade |
| AC7 | Rodapé com: "Gerado pelo sistema Licita Preços em {data/hora}" |
| AC8 | Links das fontes incluídos como texto |

---

#### Story 3.4: Personalização do Relatório

> Como **servidor público**,
> Eu quero **personalizar o relatório antes de gerar**,
> Para que **eu possa adequá-lo às necessidades específicas do processo**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Modal/página de configuração antes de gerar relatório |
| AC2 | Campo para inserir nome do órgão/entidade |
| AC3 | Campo para número do processo (opcional) |
| AC4 | Campo para observações/justificativas adicionais |
| AC5 | Opção de selecionar qual estatística usar como preço de referência |
| AC6 | Checkbox para incluir/excluir seção de metodologia |
| AC7 | Preview do relatório antes de download final |

---

#### Story 3.5: Comparação de Pesquisas

> Como **usuário**,
> Eu quero **comparar resultados de pesquisas diferentes**,
> Para que **eu possa analisar variações de preço ao longo do tempo**.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Seleção de 2-3 pesquisas do histórico para comparação |
| AC2 | Tela de comparação lado a lado |
| AC3 | Exibição das estatísticas de cada pesquisa em colunas |
| AC4 | Cálculo de variação percentual entre pesquisas |
| AC5 | Destaque visual para aumentos/reduções significativas |
| AC6 | Opção de exportar comparação para Excel |

---

## 9. Out of Scope (Fora do Escopo MVP)

Os seguintes itens estão **fora do escopo** do MVP e poderão ser considerados em versões futuras:

- Autenticação e controle de acesso por usuário
- Integração com múltiplas fontes de preços além do Painel de Preços
- Aplicativo mobile nativo
- API pública para integrações externas
- Dashboard administrativo
- Notificações por email
- Integração com sistemas de licitação (ex: ComprasNet)

---

## 10. Success Metrics

| Métrica | Meta MVP |
|---------|----------|
| Tempo médio de pesquisa | < 30 segundos |
| Taxa de sucesso de exportação | > 95% |
| Uptime do sistema | > 99% |
| Satisfação do usuário (se medida) | > 4/5 |

---

## 11. Risks and Mitigations

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| API do Painel de Preços indisponível | Média | Alto | Implementar cache agressivo; fallback para dados em cache |
| Bloqueio por rate limiting | Média | Médio | Implementar rate limiting próprio; cache de resultados |
| Mudanças na estrutura da API/fonte | Baixa | Alto | Monitoramento de erros; abstração da camada de integração |
| Dados desatualizados | Média | Médio | Exibir data da cotação claramente; permitir refazer pesquisa |

---

## 12. Glossary

| Termo | Definição |
|-------|-----------|
| **Painel de Preços** | Sistema do Governo Federal que consolida preços praticados em contratações públicas |
| **IN 65/2021** | Instrução Normativa que regulamenta pesquisa de preços para contratações públicas |
| **Lei 14.133/2021** | Nova Lei de Licitações e Contratos Administrativos |
| **Preço de Referência** | Valor estimado utilizado como base para contratações públicas |
| **LGPD** | Lei Geral de Proteção de Dados |
