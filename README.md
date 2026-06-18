# Banking App (`banking-cc`)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-full--stack-EF4444)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-not_configured-lightgrey)

A Polish-language banking web application built with **TanStack Start**. It combines a public marketing site, Clerk authentication, and a protected customer dashboard. Bank accounts and transactions are loaded through the **Plaid** sandbox API after a user links an account.

---

## Project purpose

This project demonstrates:

- Full-stack React with file-based routing and server functions
- Authentication and session handling with Clerk
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

- Sign in and sign up via Clerk (`/sign-in`, `/sign-up`)
- Protected `/dashboard` routes with automatic redirect for unauthenticated users

### Dashboard

- Overview with greeting, linked accounts, recent transactions, and balance summary
- Plaid Link flow to connect a bank account in sandbox mode
- Sidebar navigation for accounts, payments, cards, deposits, loans, applications, and settings
- Clerk `UserButton` for account management

Several dashboard sub-pages are still placeholders and show stub content until implemented.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base UI) |
| Language | TypeScript |
| Auth | [Clerk](https://clerk.com/) (`@clerk/tanstack-react-start`) |
| Banking data | [Plaid](https://plaid.com/) (`plaid`, `react-plaid-link`) |
| Build tool | Vite 8 |
| Lint / format | Biome |
| Tests | Vitest (configured, no test files yet) |

---

## Requirements

- **Node.js** `>= 22.12.0`
- Clerk application (publishable + secret keys)
- Plaid sandbox credentials (`client_id` + `secret`)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up

# Plaid (sandbox)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Optional public contact overrides
VITE_CONTACT_PHONE=801 000 000
VITE_CONTACT_EMAIL=kontakt@bank.pl
```

Never commit real credentials to version control.

### 3. Run the dev server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### 4. Build for production

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
| `npm run test` | Run Vitest |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run check` | Run Biome lint + format checks |

---

## Project structure

```text
banking-cc/
├── public/                 # Static assets (logo, manifest)
├── src/
│   ├── components/         # Shared UI (Navbar, Footer, dashboard widgets, shadcn/ui)
│   ├── config/             # App configuration (contact details)
│   ├── lib/                # Utilities (e.g. cn())
│   ├── routes/             # File-based routes (pages + layouts)
│   │   ├── dashboard/      # Protected dashboard routes
│   │   ├── news/           # News pages
│   │   ├── sign-in.$.tsx   # Clerk sign-in
│   │   └── sign-up.$.tsx   # Clerk sign-up
│   ├── server/
│   │   └── plaid/          # Plaid client, server functions, auth helpers, storage
│   ├── router.tsx          # Router setup
│   ├── routeTree.gen.ts    # Generated route tree (do not edit manually)
│   ├── start.ts            # TanStack Start middleware (Clerk, CSRF)
│   └── styles.css          # Global styles + Tailwind theme
├── vite.config.ts
├── tsr.config.json         # TanStack Router CLI config
└── biome.json
```

### Routing overview

| Path | Description |
| --- | --- |
| `/` | Public home page |
| `/news`, `/news/$newsId` | News section |
| `/contact` | Contact page |
| `/sign-in`, `/sign-up` | Clerk authentication |
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

Server logic lives in TanStack Start **server functions** under `src/server/plaid/`:

- `getAuthUserId` — returns the current Clerk user ID
- `createLinkToken` / `exchangePublicToken` — Plaid Link onboarding
- `getDashboardData` — accounts, transactions, and summary for the dashboard

Plaid access tokens are stored in Clerk user `privateMetadata` per user. Dashboard routes call `getAuthUserId` in `beforeLoad` and redirect to sign-in when no session exists.

---

## Development notes

- Regenerate routes after adding or renaming route files: `npm run generate-routes`
- Plaid runs in **sandbox** by default (`PLAID_ENV=sandbox`). Use Plaid's test credentials in the Link modal.
- TanStack Devtools are enabled in development via `@tanstack/devtools-vite`.
- Avoid wrapping TanStack Router `redirect()` in broad `try/catch` blocks with `console.error` — redirects are thrown and enhanced devtools logging can create noisy server/client console loops.

---

## License

Private project. No license file is included in this repository.
