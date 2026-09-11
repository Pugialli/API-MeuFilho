# Changelog

## [1.3.1] - 2026-09-11

### Fixed
- `.vercelignore` criado — exclui `src/app.ts` e `src/server.ts` da detecção de funções serverless da Vercel (erro "Invalid export found in module /var/task/src/app.js")
- `prisma.config.ts`: campo `earlyAccess` removido — não existe mais no tipo `PrismaConfig` do Prisma 7 estável

### Changed
- Swagger UI: título da aba do browser alterado para **MeuFilho API** via `theme.title`

---

## [1.3.0] - 2026-09-11

### Added
- `POST /auth/logout` — invalida o refresh token no banco (`RefreshToken.deleteMany`) sem exigir autenticação via JWT

### Improved
- Error handler de 500 agora loga o erro original via `console.error` — visível nos Runtime Logs da Vercel

---

## [1.2.1] - 2026-09-11

### Fixed
- `authenticate` decorator agora retorna corretamente após enviar 401, evitando erro "Reply already sent" no Fastify

### Improved
- Handler serverless (`api/index.ts`) captura crashes internos, reseta a instância do app para forçar reinicialização e retorna headers CORS corretos mesmo em resposta de erro 500

### Chore
- Seed atualizado com dados reais: usuários Amanda e João, filho Leonardo (previsão 17/12/2026), medições de BPM de setembro/2026

---

## [1.2.0] - 2026-09-10

### Added
- Campo `sex` adicionado ao modelo `Child` — enum `MALE | FEMALE | UNKNOWN` com default `UNKNOWN`; incluído no retorno de todos os endpoints de filhos
- `GET /children/:childId` — busca filho por ID, restrito a membros
- `PATCH /children/:childId` — edita `name`, `dueDate` e/ou `sex` do filho; restrito a membros
- Múltiplos filhos por usuário já era suportado (sem restrição de limite)

---

## [1.1.1] - 2026-09-09

### Fixed
- `api/index.ts` refatorado para não importar `src/app.ts` — o Vercel validava o módulo importado como se fosse um handler e reclamava da ausência de default export; agora o handler é autossuficiente com todas as importações diretas
- Logger desabilitado no handler serverless (Vercel captura stdout/stderr diretamente)

### Chore
- Adicionadas env vars na Vercel: `NODE_ENV`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`

---

## [1.1.0] - 2026-09-08

### Added
- `src/app.ts` criado — extrai a configuração do Fastify (`buildApp()`) separado do `listen()`
- `src/server.ts` simplificado — apenas chama `buildApp().listen()` para desenvolvimento local
- `api/index.ts` criado — handler serverless para Vercel; reutiliza a instância Fastify entre warm starts
- `vercel.json` criado — roteia todas as requisições para `api/index.ts`, roda `prisma generate` no build

### Changed
- `tsconfig.json` — `rootDir: "."` e `include` expandido para cobrir `api/`

---

## [1.0.5] - 2026-09-07

### Added
- `@fastify/cors` — necessário para o Swagger UI conseguir fazer requests ao servidor a partir do browser

---

## [1.0.4] - 2026-09-06

### Fixed
- `prisma/seed.ts`: `PrismaClient` instanciado com `PrismaNeon` adapter — Prisma 7 exige adapter explícito em todos os pontos de uso, inclusive no seed

---

## [1.0.3] - 2026-09-05

### Added
- `@fastify/swagger` e `@fastify/swagger-ui` com documentação disponível em `/documentation`
- Rotas agrupadas por tags: **Auth**, **Filhos** e **Medições**
- Rotas autenticadas marcadas com `bearerAuth` — campo de token disponível diretamente na UI
- Integração com `jsonSchemaTransform` do `fastify-type-provider-zod` para geração automática de schemas a partir do Zod

---

## [1.0.2] - 2026-09-04

### Fixed
- `prisma.config.ts`: substituído `migrate.adapter` (driver serverless WebSocket) por `datasource.url` com `DATABASE_URL_UNPOOLED` — migrations precisam de conexão TCP direta, não do driver serverless

---

## [1.0.1] - 2026-09-03

### Changed
- Migração do package manager de npm para **pnpm@10.30.2**
- Adicionado campo `packageManager` no `package.json` (Corepack bloqueia `npm install` acidental)
- Adicionado `pnpm.onlyBuiltDependencies` para aprovar builds nativos de `argon2`, `@prisma/engines`, `esbuild` e `prisma`
- `package-lock.json` removido e substituído por `pnpm-lock.yaml`

---

## [1.0.0] - 2026-09-02

### Added
- Setup do projeto com Fastify 5, Prisma 7 e TypeScript
- Schema: `User`, `Child`, `ChildMembership`, `Measurement`, `RefreshToken`
- Autenticação com JWT (access token 15min + refresh token 7 dias), senha com Argon2
- Endpoints de signup, login e refresh de token
- CRUD de filhos com geração de `inviteCode` via nanoid
- Sistema de convite: segundo responsável entra com código e obtém acesso completo
- Medições independentes por tipo (WEIGHT, HEIGHT, BPM) com filtro por tipo e intervalo de datas
- Controle de acesso via `ChildMembership` em todas as rotas de filhos e medições
- Validação de payloads com Zod em todas as rotas
- Error handler global com respostas JSON padronizadas
- Seed com dois usuários e um filho de exemplo
- Configuração do Prisma 7 com adapter Neon (`prisma.config.ts`)
