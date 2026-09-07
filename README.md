# MeuFilho API

API backend para acompanhamento de **gestação e desenvolvimento do bebê**, compartilhada entre dois responsáveis.

---

## Equipe

| Papel | Nome |
|---|---|
| Desenvolvimento | João Paulo Pugialli da Silva Souza |

---

## Sobre o projeto

API REST para o app MeuFilho, permitindo que dois responsáveis (pai, mãe ou qualquer combinação) acompanhem juntos a gestação e o crescimento do bebê.

- **Autenticação** com JWT (access token + refresh token) e senhas com hash Argon2
- **Filhos compartilhados** via código de convite — o segundo responsável entra com o código e passa a ter acesso completo
- **Medições independentes** — peso, altura e BPM são registros separados, cada um com data própria

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Fastify 5 (TypeScript) |
| ORM | Prisma v7 |
| Banco de dados | PostgreSQL (Neon) |
| Autenticação | JWT (`@fastify/jwt` + `jsonwebtoken`) |
| Hash de senha | Argon2 |
| Validação | Zod + `fastify-type-provider-zod` |
| Runtime | Node.js 20+ |

---

## Requisitos

- Node.js 20+
- pnpm

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com as seguintes variáveis:

```env
# Banco de dados (Neon PostgreSQL)
# Use a URL "Pooled" para queries e "Direct" para migrations
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Servidor
PORT=3000
NODE_ENV=development
```

> **Por que dois DATABASE_URL?** O Neon usa connection pooling (PgBouncer). O Prisma precisa da URL direta (`UNPOOLED`) para rodar migrations e a URL pooled para queries em produção.

---

## Deploy (Vercel)

```bash
# Instalar a CLI da Vercel
npm i -g vercel

# Login e deploy (primeira vez)
vercel

# Deploys seguintes
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel (**Settings → Environment Variables**) com os mesmos valores do `.env`:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

> **Como funciona:** `vercel.json` roteia todas as requisições para `api/index.ts`, que inicializa o app Fastify como uma função serverless. O `buildCommand` executa `prisma generate` antes do deploy.

---

## Instalação e uso

```bash
# Instalar dependências
pnpm install

# Gerar cliente Prisma
pnpm dlx prisma generate

# Rodar migrations
pnpm db:migrate

# Rodar em desenvolvimento (hot reload)
pnpm dev

# Build de produção
pnpm build
pnpm start

# Seed do banco (cria 2 usuários e 1 filho de exemplo)
pnpm db:seed

# Abrir Prisma Studio
pnpm db:studio
```

---

## Endpoints

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/signup` | Criar conta (`name`, `email`, `password`, `role: PAI\|MAE`) |
| POST | `/auth/login` | Login — retorna `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | Renovar access token via `refreshToken` |

### Filhos

Requerem `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/children` | Criar filho — gera `inviteCode` automaticamente |
| POST | `/children/join` | Entrar como responsável usando `inviteCode` |
| GET | `/children` | Listar filhos do usuário autenticado |

### Medições

| Método | Rota | Descrição |
|---|---|---|
| POST | `/children/:childId/measurements` | Registrar medição (`type: WEIGHT\|HEIGHT\|BPM`, `value`, `date`) |
| GET | `/children/:childId/measurements` | Listar medições (filtros: `?type=&from=&to=`) |
| DELETE | `/measurements/:id` | Deletar medição |

---

## Versionamento

Este projeto segue o padrão **Semantic Versioning (semver)**: `MAJOR.MINOR.PATCH`

- **MAJOR** — mudanças que quebram compatibilidade (breaking changes, grandes migrações)
- **MINOR** — novas funcionalidades sem quebrar o que existe
- **PATCH** — correções de bugs e ajustes menores

---

## Changelog

### v1.1.0 — Deploy Vercel
> Setembro 2026

- `src/app.ts` criado — extrai a configuração do Fastify (`buildApp()`) separado do `listen()`
- `src/server.ts` simplificado — apenas chama `buildApp().listen()` para desenvolvimento local
- `api/index.ts` criado — handler serverless para Vercel; reutiliza a instância Fastify entre warm starts
- `vercel.json` criado — roteia todas as requisições para `api/index.ts`, roda `prisma generate` no build
- `tsconfig.json` atualizado — `rootDir: "."` e `include` expandido para cobrir `api/`
- README atualizado com instruções de deploy e variáveis de ambiente na Vercel

---

### v1.0.5 — CORS
> Setembro 2026

- Adicionado `@fastify/cors` — necessário para o Swagger UI conseguir fazer requests ao servidor a partir do browser

---

### v1.0.4 — Fix: adapter Neon no seed
> Setembro 2026

- `prisma/seed.ts`: `PrismaClient` instanciado com `PrismaNeon` adapter — Prisma 7 exige adapter explícito em todos os pontos de uso, inclusive no seed

---

### v1.0.3 — Documentação Swagger
> Setembro 2026

- Adicionados `@fastify/swagger` e `@fastify/swagger-ui`
- Documentação disponível em `/documentation` com interface Swagger UI
- Rotas agrupadas por tags: **Auth**, **Filhos** e **Medições**
- Rotas autenticadas marcadas com `bearerAuth` — campo de token disponível diretamente na UI
- Integração com `jsonSchemaTransform` do `fastify-type-provider-zod` para geração automática de schemas a partir do Zod

---

### v1.0.2 — Fix: conexão para migrations
> Setembro 2026

- `prisma.config.ts`: substituído `migrate.adapter` (driver serverless WebSocket) por `datasource.url` com `DATABASE_URL_UNPOOLED` — migrations precisam de conexão TCP direta, não do driver serverless

---

### v1.0.1 — Migração para pnpm
> Setembro 2026

- Migração do package manager de npm para **pnpm@10.30.2**
- Adicionado campo `packageManager` no `package.json` (Corepack bloqueia `npm install` acidental)
- Adicionado `pnpm.onlyBuiltDependencies` para aprovar builds nativos de `argon2`, `@prisma/engines`, `esbuild` e `prisma` sem prompt interativo
- `package-lock.json` removido e substituído por `pnpm-lock.yaml`
- `.gitignore` atualizado com `package-lock.json`
- README atualizado com comandos `pnpm`

---

### v1.0.0 — Estrutura inicial da API
> Setembro 2026

- Setup do projeto com Fastify 5, Prisma 7 e TypeScript
- Schema: `User`, `Child`, `ChildMembership`, `Measurement`, `RefreshToken`
- Autenticação com JWT (access token 15min + refresh token 7 dias), senha com Argon2
- Endpoint de signup, login e refresh de token
- CRUD de filhos com geração de `inviteCode` via nanoid
- Sistema de convite: segundo responsável entra com código e obtém acesso completo
- Medições independentes por tipo (WEIGHT, HEIGHT, BPM) com filtro por tipo e intervalo de datas
- Controle de acesso via `ChildMembership` em todas as rotas de filhos e medições
- Validação de payloads com Zod em todas as rotas
- Error handler global com respostas JSON padronizadas
- Seed com dois usuários e um filho de exemplo
- Configuração do Prisma 7 com adapter Neon (`prisma.config.ts`)
