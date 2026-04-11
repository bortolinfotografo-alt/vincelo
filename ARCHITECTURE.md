# Vincelo — Arquitetura Técnica

Marketplace + rede social para profissionais audiovisuais (fotógrafos, videomakers, designers).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Node.js, Express 4, express-async-errors |
| Banco | PostgreSQL 16, Prisma 5 ORM |
| Auth | JWT (access token em memória) + httpOnly cookie (refresh token) |
| Pagamentos | Stripe (subscriptions + webhooks) |
| Upload | Multer (local dev) → AWS S3 (produção) |
| Email | Nodemailer (SMTP) |
| Segurança | helmet, compression, rate-limit, Zod, sanitizeBody |
| CI/CD | GitHub Actions → Docker → VPS |

---

## Estrutura de pastas

```
App Freela/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos e índices
│   │   ├── migrations/         # Histórico de migrations
│   │   └── seed.js             # Dados de teste
│   └── src/
│       ├── controllers/        # Parse request → chama service → resposta HTTP
│       ├── middlewares/
│       │   ├── auth.middleware.js        # ensureAuthenticated, ensureRole
│       │   ├── cors.middleware.js        # CORS por ambiente
│       │   ├── rate-limit.middleware.js  # Limites por rota
│       │   ├── rawbody.middleware.js     # Stripe webhook raw body
│       │   ├── sanitize.middleware.js    # Sanitização XSS de inputs
│       │   └── validate.middleware.js    # Validação Zod genérica
│       ├── routes/             # Definição de endpoints + middlewares por rota
│       ├── schemas/            # Schemas Zod de validação
│       │   ├── auth.schema.js
│       │   ├── job.schema.js
│       │   ├── proposal.schema.js
│       │   └── user.schema.js
│       ├── services/
│       │   ├── auth.service.js    # JWT, bcrypt
│       │   ├── db.js              # Prisma singleton
│       │   ├── email.service.js   # Nodemailer
│       │   └── storage.service.js # Multer + magic bytes
│       └── utils/
│           ├── helpers.js         # calculateAvgRating, isAllowedMagicBytes
│           └── logger.js          # Logger JSON estruturado
│
└── frontend/
    └── src/
        ├── app/               # Next.js App Router (páginas)
        │   ├── auth/          # Login, register, forgot-password
        │   ├── feed/          # Feed social
        │   ├── jobs/          # Vagas + [id]
        │   ├── freelancers/   # Listagem de freelancers
        │   ├── profile/       # Perfil próprio + [id]
        │   ├── chat/          # Chat
        │   ├── dashboard/     # Dashboard
        │   └── layout.js      # Root layout + ErrorBoundary
        ├── components/
        │   ├── ui/            # Componentes genéricos reutilizáveis
        │   │   ├── Avatar.jsx
        │   │   ├── Badge.jsx
        │   │   ├── Button.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── ErrorBoundary.jsx
        │   │   └── Spinner.jsx
        │   ├── layout/        # AppShell, Header, Sidebar, Footer
        │   ├── social/        # PostCard, CreatePost, FollowButton...
        │   └── chat/          # FloatingChat
        ├── contexts/          # Estado global (AuthContext, ThemeContext)
        ├── hooks/             # Hooks reutilizáveis
        │   ├── useIsMobile.js
        │   ├── useFeed.js
        │   ├── useJobs.js
        │   ├── useFreelancers.js
        │   └── useProfile.js
        └── lib/
            ├── api.js         # Axios (withCredentials: true)
            └── tokenStore.js  # Access token em memória (não localStorage)
```

---

## Autenticação

```
1. Login → POST /api/auth/login
   ├── Servidor retorna: { token (access), refreshToken (body) }
   ├── Servidor seta: cookie httpOnly "refreshToken" (30d)
   └── Frontend armazena: token em memória (tokenStore.js)

2. Request autenticada
   └── Header: Authorization: Bearer <token_em_memória>

3. Token expirado (401)
   ├── Interceptor Axios chama: POST /api/auth/refresh
   ├── Cookie httpOnly enviado automaticamente pelo browser
   ├── Servidor retorna novo access token
   └── Interceptor refaz a request original

4. Logout → POST /api/auth/logout
   ├── Servidor limpa cookie httpOnly
   └── Frontend limpa tokenStore
```

**Vantagem de segurança:** access token em memória não é acessível por XSS. Refresh token em httpOnly cookie também não. Sessão sobrevive a recargas de página via refresh automático.

---

## Validação de inputs (Zod)

Todos os endpoints mutantes (POST/PUT) têm validação com Zod aplicada como middleware antes do controller:

```
Route → validate(schema) → sanitizeBody → controller
```

Schemas em `backend/src/schemas/`:
- `auth.schema.js` — register, login, forgot/reset password
- `job.schema.js` — criar e atualizar vagas
- `proposal.schema.js` — candidatura e aprovação
- `user.schema.js` — atualização de perfil

---

## Segurança aplicada

| Medida | Implementação |
|---|---|
| Headers HTTP | `helmet` no Express |
| CORS | Allowlist por ambiente |
| Rate limiting | `express-rate-limit` (auth: 10/15min, geral: 100/15min) |
| XSS armazenado | `sanitizeBody` middleware remove tags HTML de req.body |
| Upload malicioso | Magic bytes validation (verifica tipo real do arquivo) |
| Força bruta | Rate limiter estrito em `/auth/login`, `/forgot-password` |
| Tokens | access em memória, refresh em httpOnly cookie |
| SQL injection | Prisma ORM com queries parametrizadas |
| Tamanho de payload | `express.json({ limit: '10mb' })` |

---

## Performance

| Área | Medida |
|---|---|
| Banco | Índices em: role+isActive (users), available+location (freelancers), status+jobDate (jobs), authorId+createdAt (posts), freelancerId+status (proposals) |
| Rede | Compressão gzip via `compression` |
| Imagens | `next/image` com formatos avif/webp |
| Frontend | Debounce de 300-350ms em filtros de busca |
| API | Paginação em todas as listagens (limit/offset) |

---

## Docker

```bash
# Desenvolvimento completo
docker compose up -d

# Build de produção
docker compose build
docker compose up -d

# Executar migrations após deploy
docker compose exec backend npx prisma migrate deploy
```

Serviços: `db` (PostgreSQL 16), `backend` (Node 20), `frontend` (Next.js 14)

---

## CI/CD (GitHub Actions)

- **`.github/workflows/ci.yml`** — roda em todo PR para main/master
  - Lint + build do frontend
  - Prisma generate + migrate + startup check do backend
- **`.github/workflows/deploy.yml`** — roda em push para main
  - Build e push de imagens Docker
  - Deploy via SSH no servidor de produção

---

## Variáveis de ambiente obrigatórias (produção)

```
DATABASE_URL            PostgreSQL connection string
JWT_SECRET              Chave de assinatura do access token (min 32 chars)
JWT_REFRESH_SECRET      Chave de assinatura do refresh token (min 32 chars)
CORS_ALLOWED_ORIGINS    Origens permitidas (ex: https://vincelo.com.br)
NEXT_PUBLIC_API_URL     URL da API para o frontend
```

Opcionais: `STRIPE_*`, `AWS_*`, `MAIL_*`

---

## Débitos técnicos conhecidos

| Item | Prioridade | Esforço |
|---|---|---|
| Socket.IO para chat em tempo real | Alta | Alto |
| Testes (Jest + Supertest) | Alta | Alto |
| Rate limiter com Redis (em vez de in-memory) | Alta | Médio |
| Cache de feeds com Redis | Média | Alto |
| Monitoramento com Sentry | Média | Baixo |
| Notificações push (Web Push API) | Baixa | Alto |
