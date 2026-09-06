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

Crie um arquivo `.env.local` na raiz com as seguintes variáveis:

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
