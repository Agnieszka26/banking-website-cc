# Banking App (`banking-cc`)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-full--stack-EF4444)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6E4AFF?logo=vitest&logoColor=white)

A Polish-language banking web application built with **TanStack Start**. It combines a public marketing site, **Better Auth** authentication, and a protected customer dashboard. Linked bank accounts and transactions are loaded through the **Plaid** API after a user connects an account.

---

## Project purpose

This project demonstrates:

- Full-stack React with file-based routing and server functions
- Authentication and session handling with Better Auth + Prisma
- Row Level Security (RLS) on Supabase PostgreSQL for user-scoped data
- Third-party fintech integration via Plaid Link
- A component-driven UI with Tailwind CSS and shadcn-style primitives
- Separation of public pages, auth flows, and protected dashboard areas

---

## Key features

### Public site

- Home page with login prompt, product cards, carousel, and news banner
- News listing and article pages (`/news`, `/news/$newsId`)
- Contact page (`/contact`)
- Responsive navbar with accessibility controls (font size, high contrast, language selector UI)

### Authentication

- Sign in and sign up via Better Auth (`/sign-in`, `/sign-up`) with username-based login
- Protected `/dashboard` routes with `beforeLoad` guard, loading state, and redirect back after sign-in

### Dashboard

- Overview with greeting, linked accounts, recent transactions, and balance summary (from Plaid)
- Plaid Link flow to connect a bank account in sandbox mode
- Sidebar navigation for accounts, payments, cards, deposits, loans, applications, and settings
- Sign out from the dashboard sidebar

Several dashboard sub-pages are still placeholders and show stub content until implemented.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base UI) |
| Language | TypeScript |
| Auth | [Better Auth](https://www.better-auth.com/) + `username` plugin |
| Database | [Prisma 7](https://www.prisma.io/) on [Supabase](https://supabase.com/) PostgreSQL |
| Banking data | [Plaid](https://plaid.com/) (`plaid`, `react-plaid-link`) |
| Analytics | [PostHog](https://posthog.com/) |
| Build tool | Vite 8 |
| Lint / format | Biome |
| Tests | Vitest (RLS integration tests) |

---

## Requirements

- **Node.js** `>= 22.12.0`
- Supabase project (PostgreSQL + publishable key for news reads)
- Better Auth secret and base URL
- Plaid sandbox credentials (`client_id` + `secret`)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. Example:

```env
# Better Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Database (Supabase pooler)
DATABASE_URL=postgresql://postgres.your-ref:password@...pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.your-ref:password@...pooler.supabase.com:5432/postgres

# Plaid (sandbox)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# PostHog (optional)
VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Optional public contact overrides
VITE_CONTACT_PHONE=801 000 000
VITE_CONTACT_EMAIL=kontakt@bank.pl
```

Never commit real credentials to version control.

### 3. Set up the database and RLS

```bash
npm run db:push          # sync Prisma schema
npm run db:rls           # apply RLS policies
npm run db:rls-user      # create RLS runtime user; adds DATABASE_URL_RLS to .env
```

### 4. Run the dev server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run generate-routes` | Regenerate TanStack Router route tree |
| `npm run test` | Run Vitest (RLS integration tests) |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run check` | Run Biome lint + format checks |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:rls` | Apply RLS migration SQL |
| `npm run db:rls-user` | Create RLS runtime DB user |

---

## Project structure

```text
banking-cc/
├── prisma/
│   ├── schema.prisma       # Better Auth + app models
│   └── migrations/         # RLS policies
├── scripts/                # DB/RLS setup helpers
├── public/                 # Static assets
├── src/
│   ├── components/         # Shared UI (Navbar, Footer, dashboard widgets, shadcn/ui)
│   ├── config/             # App configuration (contact details)
│   ├── data/
│   │   └── repositories/   # RLS-enforced data access (only layer using prisma-rls)
│   ├── lib/                # Auth, Prisma, guards, RLS infrastructure
│   ├── routes/             # File-based routes (pages + layouts)
│   │   ├── api/auth/       # Better Auth HTTP handler
│   │   ├── dashboard/      # Protected dashboard routes
│   │   └── news/           # News pages
│   ├── server/
│   │   ├── news/           # News server functions (Supabase)
│   │   ├── plaid/          # Plaid client, server functions, token storage
│   │   └── supabase/       # Supabase JS client
│   ├── router.tsx
│   ├── routeTree.gen.ts    # Generated route tree (do not edit manually)
│   ├── start.ts            # TanStack Start middleware (CSRF)
│   └── styles.css
├── vite.config.ts
├── tsr.config.json
└── biome.json
```

Domain types live next to their modules (for example `src/server/plaid/types.ts`, `src/server/news/types.ts`).

### Routing overview

| Path | Description |
| --- | --- |
| `/` | Public home page |
| `/news`, `/news/$newsId` | News section |
| `/contact` | Contact page |
| `/sign-in`, `/sign-up` | Better Auth sign-in and registration |
| `/dashboard` | Dashboard home (Plaid data, accounts, transactions) |
| `/dashboard/accounts` | Accounts list (placeholder) |
| `/dashboard/accounts/$accountId` | Single account detail (live when Plaid is linked) |
| `/dashboard/payments` | Payments (stub) |
| `/dashboard/cards` | Cards (placeholder) |
| `/dashboard/deposits` | Deposits (placeholder) |
| `/dashboard/loans` | Loans (placeholder) |
| `/dashboard/applications` | Applications (placeholder) |
| `/dashboard/settings` | Settings (stub) |

---

## Server architecture

Server logic uses TanStack Start **server functions** and one HTTP auth route:

| Area | Location | Responsibility |
| --- | --- | --- |
| Auth API | `src/routes/api/auth/$.ts` | Better Auth handler (`/api/auth/*`) |
| Session | `src/lib/session.ts` | `resolveSession`, `requireSession`, `requireUserId` |
| Session (RPC) | `src/lib/auth.functions.ts` | `getSession`, `ensureSession` server functions |
| Route guard | `src/lib/auth-guard.ts` | Dashboard `beforeLoad` protection + safe redirects |
| Plaid | `src/server/plaid/functions.ts` | Link token, token exchange, dashboard data, manual sync refresh |
| Plaid sync | `src/server/plaid/sync.service.ts` | Plaid → Postgres cache pipeline (sync-on-link + stale refresh) |
| Plaid tokens | `src/data/repositories/plaid-link.repository.ts` | RLS-enforced `plaid_link` access |
| Plaid cache | `src/data/repositories/plaid-sync.repository.ts` | RLS-enforced `plaid_cached_*` reads/writes |
| News | `src/server/news/functions.ts` | Public news reads via Supabase client |

**Data access:**

- `DATABASE_URL` — Prisma client for Better Auth and admin operations
- `DATABASE_URL_RLS` — RLS-enforced Prisma client; accessed only via `src/data/repositories/*`
- Supabase publishable key — public news reads subject to RLS

Dashboard accounts and transactions are served from a **Postgres sync cache** (`plaid_cached_accounts`, `plaid_cached_transactions`). Plaid API is called on link, when cache is stale, or as a fallback — not on every page load.

### Plaid sync pipeline (scale path)

```
Link / stale refresh / refreshPlaidSync
        ↓
 sync.service.ts  →  Plaid API
        ↓
 plaid-sync.repository  →  plaid_cached_* (RLS)
        ↓
 service.ts loaders  →  dashboard UI
```

| Trigger | When |
| --- | --- |
| Sync-on-link | `exchangePublicToken` runs a full sync after storing the token |
| Stale refresh | Dashboard read re-syncs accounts after 5 min / transactions after 10 min |
| Manual refresh | `refreshPlaidSync` server fn (future: cron / webhooks call the same service) |

In-memory TTL cache (`src/server/plaid/cache.ts`) remains as a hot L1 layer on top of the DB cache.

---

## Data model

| Layer | Source | Used by app |
| --- | --- | --- |
| Auth | Better Auth tables (`user`, `session`, `account`, `verification`) | Yes |
| Plaid link | `plaid_link` via `plaidLinkRepository` | Yes — access tokens + sync timestamps |
| Banking UI | `plaid_cached_*` → `DashboardAccount` / `DashboardTransaction` DTOs | Yes — DB cache with Plaid fallback |
| Legacy banking | `profiles`, `accounts`, `transactions` (`Legacy*` in Prisma schema) | **No** — introspected Supabase tables, kept so `db push` does not drop them |
| News | `news` table via Supabase client | Yes — public reads |

**Decision:** Plaid-first with DB sync cache. Legacy tables remain in Postgres with RLS until fully removed. Do not add app queries against `LegacyProfile`, `LegacyBankAccount`, or `LegacyTransaction`.

---

## Development notes

- Regenerate routes after adding or renaming route files: `npm run generate-routes`
- Plaid runs in **sandbox** by default (`PLAID_ENV=sandbox`). Use Plaid's test credentials in the Link modal.
- After pulling Plaid sync changes, run `npm run db:push` then `npm run db:rls` to create cache tables and policies.
- Prisma CLI uses `DIRECT_URL` (session pooler, port 5432); app runtime uses `DATABASE_URL` (transaction pooler, port 6543).
- TanStack Devtools are enabled in development via `@tanstack/devtools-vite`.
- Avoid wrapping TanStack Router `redirect()` in broad `try/catch` blocks — redirects are thrown intentionally.

---

## License

Private project. No license file is included in this repository.
