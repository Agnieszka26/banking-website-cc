# Transactions server boundary

**Status:** Accepted  
**Date:** 2026-07-26

## Chosen transport

TanStack Start **`createServerFn`** (`listLedgerTransactions`, `createLedgerTransaction` in `src/server/transactions/functions.ts`).

This matches the existing Plaid/news/auth server-function pattern. JSON shapes, Zod schemas, and error codes remain those in `docs/API_CONTRACTS.md` / `src/shared`. An HTTP `/api/transactions` route can be added later as a thin adapter over the same service layer without changing DTOs.

## Authentication flow

```
createServerFn
  → Zod validator
  → transaction service
  → requireUserId()   // Better Auth session from request cookies
  → repository (RLS)
```

- `requireUserId()` lives in `src/lib/session.server.ts` (server-only).
- Default mode throws typed `AppError` with code `UNAUTHORIZED`.
- Clients never send `userId`; ownership comes only from the session.

## Ownership model

- Ledger resources belong to the authenticated Better Auth `user.id`.
- Client-supplied `accountId` is never trusted alone.
- List/create always resolve the account under the session user (`ledger_accounts.user_id`).
- Missing or foreign accounts return `ACCOUNT_NOT_FOUND` (same status whether missing or not owned).

## RLS strategy

1. Repositories call `withUserRlsContext(userId, …)` (`src/lib/prisma-rls.ts`).
2. That sets `SET LOCAL ROLE authenticated` and `app.current_user_id`.
3. Postgres policies on `ledger_accounts` / `ledger_transactions` filter by `current_app_user_id()`.
4. Repository queries also include explicit `userId` joins/filters as defense-in-depth.

No unrestricted admin client is used for user-facing ledger reads/writes. Owner/`DATABASE_URL` Prisma is reserved for auth admin and test seeding.

## Repository responsibility

| Module | Role |
| --- | --- |
| `transactionRepository` | DB access for ledger posts + balance update |
| `ledgerAccountRepository` | Owned-account lookup |
| `transaction` service | Auth, validation, business rules, DTO mapping, logging |
| `createServerFn` handlers | Transport + error envelope |

Repositories contain **no** auth, HTTP, or UI logic.

## Why legacy / Plaid tables are not reused

| Store | Role |
| --- | --- |
| Legacy `accounts` / `transactions` | Deprecated float/`user_UID` schema; not the application ledger |
| `plaid_cached_*` | External import cache — adapter data, not write-side truth |
| `ledger_accounts` / `ledger_transactions` | New system of record (`amountMinor`, ownership, append-only posts) |

Architecture decision: the application ledger is the source of truth; Plaid is an import adapter. Extending legacy tables would couple business rules to a deprecated shape and block `INSUFFICIENT_FUNDS` enforcement on ledger `balanceMinor`.

## Cross-user internal transfers

Own-account transfers run under `withUserRlsContext` (both accounts owned by the session user).

Recipient transfers resolve `destinationIban` via owner Prisma, then settle with owner Prisma when the destination belongs to another user. The service always verifies source ownership under RLS first. Clients never supply ledger posts or balances.

## Logging

Structured events via `src/lib/logger.ts` (no full payloads, secrets, or unmasked account numbers):

- Success: `transaction.list.success`, `transaction.create.success`
- Failure: `transaction.unauthorized`, `transaction.forbidden`, `transaction.validation_failed`, `transaction.create_failed`
