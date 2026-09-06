# MeuFilho API

API backend para acompanhamento de gestação e bebê, compartilhada entre dois responsáveis.

## Stack

- **Fastify** + TypeScript
- **Prisma ORM** com PostgreSQL (Neon)
- **JWT** (access token 15min + refresh token 7 dias)
- **Argon2** para hash de senha
- **Zod** para validação de payloads

## Pré-requisitos

- Node.js 20+
- Conta no [Neon](https://neon.tech) (PostgreSQL serverless)

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Neon:

```env
# No painel do Neon, vá em Connection Details
# Use a connection string "Pooled" para DATABASE_URL
# e a "Direct" para DATABASE_URL_UNPOOLED
DATABASE_URL="postgresql://user:pass@ep-xxx.pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

JWT_SECRET="gere-com-openssl-rand-base64-32"
JWT_REFRESH_SECRET="outro-segredo-diferente"
```

> **Por que dois URLs?** O Neon usa connection pooling (PgBouncer) — Prisma precisa da URL "Direct" (sem pool) para rodar migrations, e a "Pooled" para queries em produção.

### 3. Rodar migrations

```bash
npm run db:migrate
```

### 4. (Opcional) Popular banco com dados de teste

```bash
npm run db:seed
# Cria: mae@exemplo.com e pai@exemplo.com com senha "senha123"
```

### 5. Iniciar servidor

```bash
npm run dev        # modo desenvolvimento (hot reload)
npm run build && npm start  # modo produção
```

O servidor sobe em `http://localhost:3000`.

---

## Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/signup` | Criar conta |
| POST | `/auth/login` | Login (retorna tokens) |
| POST | `/auth/refresh` | Renovar access token |

**Signup**
```json
POST /auth/signup
{
  "name": "Ana Lima",
  "email": "ana@email.com",
  "password": "minhasenha123",
  "role": "MAE"
}
```

**Login**
```json
POST /auth/login
{ "email": "ana@email.com", "password": "minhasenha123" }

// Resposta:
{ "data": { "accessToken": "...", "refreshToken": "...", "user": { ... } } }
```

**Refresh**
```json
POST /auth/refresh
{ "refreshToken": "..." }
```

---

### Filhos

Todas as rotas requerem `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/children` | Criar filho (gera inviteCode) |
| POST | `/children/join` | Entrar como responsável via código |
| GET | `/children` | Listar filhos do usuário |

**Criar filho**
```json
POST /children
{ "name": "Bebê Lima", "dueDate": "2026-03-15T00:00:00Z" }

// Resposta inclui inviteCode — compartilhe com o parceiro
```

**Entrar com código de convite**
```json
POST /children/join
{ "inviteCode": "XKPQ7MNR" }
```

---

### Medições

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/children/:childId/measurements` | Registrar medição |
| GET | `/children/:childId/measurements` | Listar medições (filtros opcionais) |
| DELETE | `/measurements/:id` | Deletar medição |

**Registrar medição** (campos obrigatórios: `type`, `value`, `date`)
```json
POST /children/clxxx.../measurements
{
  "type": "WEIGHT",
  "value": 3500,
  "date": "2026-01-20"
}
```

Tipos disponíveis: `WEIGHT` (g), `HEIGHT` (cm), `BPM` (bpm).  
Cada medição é independente — pode registrar só o peso, só a altura, etc.

**Listar com filtros**
```
GET /children/:childId/measurements?type=WEIGHT&from=2026-01-01&to=2026-01-31
```

---

## Estrutura do projeto

```
src/
├── plugins/
│   ├── auth.ts        # Plugin JWT + decorator authenticate
│   └── prisma.ts      # Plugin Prisma (singleton conectado ao Fastify)
├── routes/
│   ├── auth.ts        # POST /auth/*
│   ├── children.ts    # CRUD /children
│   └── measurements.ts # CRUD /measurements
├── services/
│   ├── auth.service.ts
│   ├── children.service.ts
│   └── measurements.service.ts
├── schemas/
│   ├── auth.schema.ts
│   ├── children.schema.ts
│   └── measurements.schema.ts
└── server.ts          # Bootstrap Fastify
prisma/
├── schema.prisma
└── seed.ts
```

## Erros padronizados

```json
// Erro de validação (422)
{
  "error": "Validation Error",
  "message": "Dados inválidos",
  "issues": [{ "path": "email", "message": "Email inválido" }]
}

// Erros de negócio (400/401/403/404/409)
{ "error": "...", "message": "Descrição legível" }
```
