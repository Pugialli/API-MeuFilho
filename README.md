# MeuFilho API

API backend para acompanhamento de **gestação e desenvolvimento do bebê**, compartilhada entre dois responsáveis.

📋 **[Acessar documentação das rotas](https://meu-filho-api.vercel.app/documentation)**

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
| GET | `/children/:childId` | Buscar filho por ID |
| PATCH | `/children/:childId` | Editar filho (`name`, `dueDate`, `sex`) — apenas membros |

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

