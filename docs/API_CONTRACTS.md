# API Contracts

This document is the **API specification** for application ledger HTTP endpoints.

**Implementation source of truth for shapes:** `src/shared/schemas.ts` (Zod) and inferred types in `src/shared/types.ts`. This document must stay aligned with those modules. Do not introduce alternate field names here.

Base path: `/api`

Content type: `application/json`

---

## Conventions

### Money (minor units)

All monetary values use **integer minor units** (`amountMinor`, `balanceMinor`).

| Rule | Detail |
| --- | --- |
| Field names | `amountMinor`, `balanceMinor` — never `amount` / `balance` as floats |
| Type | JSON number that is an **integer** (Zod: `z.number().int()`) |
| Sign | Transaction amounts are always **positive**; `direction` encodes money in vs out |
| Example | `10.50 PLN` → `amountMinor: 1050` (grosze); `12.50 USD` → `amountMinor: 1250` (cents) |
| Rationale | Avoid floating-point precision errors in ledger math and API payloads |

Clients convert to/from display currency only at the UI edge. The API never accepts or returns fractional major units.

### Account identifiers

| Field | Meaning |
| --- | --- |
| `accountId` | **Internal application ledger account** id (`accounts.id`) |
| `sourceAccountId` / `destinationAccountId` | Same — internal ledger account ids |

External provider identifiers (for example Plaid `plaid_account_id`) are **not** part of this ledger API contract. Plaid linkage is stored separately and is out of scope for these endpoints.

### Response envelope

Every successful response:

```json
{
  "data": {}
}
```

Every error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary of the failure."
  }
}
```

Rules:

- Success responses **must not** include an `error` field.
- Error responses **must not** include a `data` field.
- `error.code` is a stable machine-readable string from the catalog below.
- `error.message` is safe to show or map to i18n; it must not leak secrets, stack traces, or internal SQL.
- Optional future extension (not required yet): `error.details` for field-level validation arrays. Until specified, clients must tolerate its absence.

### Error codes and HTTP status

| Code | HTTP status | When |
| --- | --- | --- |
| `UNAUTHORIZED` | `401` | Missing or invalid Better Auth session |
| `FORBIDDEN` | `403` | Authenticated, but not allowed to act on the target resource |
| `ACCOUNT_NOT_FOUND` | `404` | Referenced internal `accountId` does not exist **for the current user** (same status whether missing or not owned, to avoid enumeration) |
| `VALIDATION_ERROR` | `400` | Body/query fails Zod schema validation (type, format, required fields, ranges) |
| `INSUFFICIENT_FUNDS` | `422` | Request is syntactically valid and authorized, but the debit would exceed **ledger** available balance (`balanceMinor`) |
| `INTERNAL_ERROR` | `500` | Unexpected server failure |

#### Why `INSUFFICIENT_FUNDS` uses `422`

- `400` is reserved for **malformed or schema-invalid** input (`VALIDATION_ERROR`). A valid positive `amountMinor` is not a parse/schema failure.
- `401` / `403` are authn/authz failures, not balance failures.
- `404` would incorrectly imply the transaction or account route does not exist.
- `409 Conflict` can fit some state conflicts, but insufficient funds is a **business-rule / semantic validation** failure on an otherwise well-formed request. **`422 Unprocessable Entity`** is the clearest REST status for “understood the request, rejected it because of domain constraints.”
- `402 Payment Required` is non-standard for this meaning and is avoided.

Clients should treat `422` + `INSUFFICIENT_FUNDS` as a non-retryable user-correctable error (reduce `amountMinor` or choose another account).

Insufficient-funds checks use the **internal ledger** `balanceMinor`, never a Plaid cached balance.

---

## 1. Authentication

| Item | Decision |
| --- | --- |
| Auth system | **Better Auth** |
| Credential | **HTTP session cookie** established by Better Auth (same-origin cookie jar used by the TanStack Start app) |
| Bearer tokens | **Not used** for these routes |
| Client header | No `Authorization` header is required or accepted for the standard web client |

Unauthenticated requests receive `401` with error code `UNAUTHORIZED`.

| Layer | Identifier |
| --- | --- |
| Session | Better Auth `session.user.id` (string) |
| API ownership | Every ledger resource is scoped to that user id |
| Database RLS | `set_config('app.current_user_id', <user.id>, true)` so Postgres `current_app_user_id()` equals Better Auth `user.id` |

Clients **must not** send `userId` in the body or query string. Ownership is derived solely from the session.

Browser clients that mutate state via cookie sessions must follow the application’s existing CSRF rules. Same-origin calls from the app UI are the expected consumer.

---

## 2. Data source (system of record)

| Endpoint family | Data source |
| --- | --- |
| `/api/transactions` | **Internal application ledger only** |
| `/api/transfers` | **Internal application ledger only** (multi-leg posts) |

| Source | Role |
| --- | --- |
| Application ledger | **System of record** for accounts, balances, transactions, and transfers |
| Plaid cache / import pipeline | External adapter — may import into the ledger; **not** exposed as these APIs’ response models |
| Legacy `transactions` / `accounts` tables | **Deprecated** — not part of this contract |

Rationale: create operations and `INSUFFICIENT_FUNDS` require a balance the application owns and can enforce. Provider cache balances are not write-side truth.

Transport may be HTTP routes under `/api/*` and/or TanStack `createServerFn` handlers. In either case, **JSON shapes, Zod schemas, error codes, and status mapping in this document remain binding**.

---

## 3. Shared Zod schemas (canonical)

Canonical definitions live in `src/shared/schemas.ts`. Summary below for the contract reader; if this section and `src/shared` diverge, **`src/shared` wins** and this doc must be updated.

```ts
import { z } from "zod";

/** True when `YYYY-MM-DD` is a real UTC calendar date (rejects Feb 31, month 13, etc.). */
function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine(isValidCalendarDate, { message: "Invalid calendar date" });
const isoDateTimeString = z.string().datetime();
const currencyCode = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Expected ISO 4217 currency code");
const positiveMinorUnits = z.number().int().max(Number.MAX_SAFE_INTEGER).positive();
export const ApiErrorCodeSchema = z.enum([
  "INSUFFICIENT_FUNDS",
  "ACCOUNT_NOT_FOUND",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
]);

export const ApiErrorSchema = z.object({
  code: ApiErrorCodeSchema,
  message: z.string().min(1),
});

export const ApiErrorResponseSchema = z.object({
  error: ApiErrorSchema,
});

export const TransactionDirectionSchema = z.enum(["debit", "credit"]);

export const TransactionTypeSchema = z.enum([
  "transfer",
  "payment",
  "deposit",
  "income",
  "refund",
  "adjustment",
  "import",
]);

export const AccountDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currency: currencyCode,
  balanceMinor: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

export const TransactionDtoSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().min(1), // internal ledger account id
  amountMinor: positiveMinorUnits,
  currency: currencyCode,
  direction: TransactionDirectionSchema,
  type: TransactionTypeSchema,
  title: z.string().min(1).max(140),
  counterpartyName: z.string().min(1).max(120).nullable(),
  counterpartyAccountNumber: z.string().min(1).max(34).nullable(),
  transferId: z.string().uuid().nullable(),
  createdAt: isoDateTimeString,
  bookingDate: isoDateString,
});

export const CreateTransactionRequestSchema = z.object({
  accountId: z.string().min(1),
  amountMinor: positiveMinorUnits,
  currency: currencyCode.default("PLN"),
  direction: TransactionDirectionSchema,
  type: TransactionTypeSchema,
  title: z.string().min(1).max(140),
  counterpartyName: z.string().min(1).max(120).optional(),
  counterpartyAccountNumber: z.string().min(1).max(34).optional(),
});

export const ListTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    accountId: z.string().min(1).optional(),
    /** Filter by ledger direction (`debit` | `credit`). */
    type: TransactionDirectionSchema.optional(),
    dateFrom: isoDateString.optional(),
    dateTo: isoDateString.optional(),
  })
  .superRefine((query, ctx) => {
    if (
      query.dateFrom !== undefined &&
      query.dateTo !== undefined &&
      query.dateFrom > query.dateTo
    ) {
      ctx.addIssue({
        code: "custom",
        message: "dateFrom must be on or before dateTo",
        path: ["dateFrom"],
      });
    }
  });

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const CreateTransferRequestSchema = z
  .object({
    sourceAccountId: z.string().min(1),
    destinationAccountId: z.string().min(1),
    amountMinor: positiveMinorUnits,
    currency: currencyCode.default("PLN"),
    title: z.string().min(1).max(140),
  })
  .refine((value) => value.sourceAccountId !== value.destinationAccountId, {
    message: "sourceAccountId and destinationAccountId must differ",
    path: ["destinationAccountId"],
  });

export const TransferDtoSchema = z.object({
  id: z.string().uuid(),
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
  amountMinor: positiveMinorUnits,
  currency: currencyCode,
  title: z.string().min(1).max(140),
  transactionIds: z.array(z.string().uuid()).min(2),
  createdAt: isoDateTimeString,
});
```

Transfer create writes (`CreateTransferRequest` → `TransferDto`) are **atomic** (one DB transaction for the transfer + every ledger leg; full rollback on failure) and support **retry via server-side dedup** without idempotency keys — see §6.1. The same rules apply to shared `createServerFn` transfer handlers.

### Field notes

| Field | Meaning |
| --- | --- |
| `accountId` | Internal ledger account id |
| `amountMinor` | Positive integer minor units (grosze/cents); never signed |
| `balanceMinor` | Positive minor units on `AccountDto` (safe-integer bounded; same numeric style as `amountMinor`) |
| `direction: "debit"` | Funds leave the account |
| `direction: "credit"` | Funds enter the account |
| `type` (body / DTO) | Business classification (`TransactionType`) |
| `type` (list query) | Filter by **direction** (`debit` \| `credit`) — naming inherited for the query string; not `TransactionType` |
| `transferId` | Set when the post is one leg of a multi-leg transfer; otherwise `null` |
| `dateFrom` / `dateTo` | Inclusive filters on `bookingDate` (`YYYY-MM-DD` calendar dates); when both are set, `dateFrom` must be ≤ `dateTo` (`ListTransactionsQuerySchema` `superRefine`) |
| `sourceAccountId` / `destinationAccountId` | Must differ (`CreateTransferRequestSchema` `refine`) |

Credits on `POST /api/transactions` are only accepted through **allowed business flows** (for example deposit, income, refund, transfer receive). The backend enforces this; clients must not treat arbitrary credit as a general balance increase API.

---

## 4. Account DTO

Public account shape for ledger-facing APIs and UI (not a Plaid model):

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Konto bieżące",
  "currency": "PLN",
  "balanceMinor": 125050
}
```

`id` is the internal application account identifier used as `accountId` on transactions and transfers.

---

## 5. Transactions API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/transactions` | Create one ledger transaction |
| `GET` | `/api/transactions` | List ledger transactions for the current user |

These endpoints operate on the **internal application ledger** only. They do **not** create or mutate Plaid-synced cache rows.

### 5.1 `POST /api/transactions`

Creates one ledger transaction for the authenticated user after ownership and balance checks.

#### Request

```http
POST /api/transactions
Content-Type: application/json
Cookie: <better-auth-session>
```

```json
{
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amountMinor": 25050,
  "currency": "PLN",
  "direction": "debit",
  "type": "payment",
  "title": "Czynsz za lipiec",
  "counterpartyName": "Jan Kowalski",
  "counterpartyAccountNumber": "PL61109010140000071219812874"
}
```

(`25050` = 250.50 PLN in grosze.)

#### Success — `201 Created`

```json
{
  "data": {
    "id": "8f3c1a2e-4b5d-6e7f-8091-a2b3c4d5e6f7",
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amountMinor": 25050,
    "currency": "PLN",
    "direction": "debit",
    "type": "payment",
    "title": "Czynsz za lipiec",
    "counterpartyName": "Jan Kowalski",
    "counterpartyAccountNumber": "PL61109010140000071219812874",
    "transferId": null,
    "createdAt": "2026-07-25T16:05:12.345Z",
    "bookingDate": "2026-07-25"
  }
}
```

#### Errors

**Validation — `400`**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body failed validation."
  }
}
```

**Unauthorized — `401`**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

**Account not found / not owned — `404`**

```json
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "Account was not found."
  }
}
```

**Insufficient funds — `422`**

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account balance is insufficient for this debit."
  }
}
```

(`INSUFFICIENT_FUNDS` applies to `direction: "debit"` when ledger `balanceMinor` &lt; `amountMinor`. Credits do not use this code.)

**Forbidden — `403`**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not allowed to perform this action."
  }
}
```

**Internal — `500`**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

#### Server behavior (contract-level)

1. Resolve user from Better Auth session → `user.id`.
2. Validate body with `CreateTransactionRequestSchema`.
3. Verify `accountId` is an internal ledger account owned by that user; otherwise `ACCOUNT_NOT_FOUND`.
4. Require request `currency` to match the owned account’s `currency`; on mismatch return the standard domain-error envelope with `VALIDATION_ERROR` (same conventions as other semantic request/account consistency failures). This check runs **before** balance validation or persistence.
5. For `debit`, enforce ledger `balanceMinor`; otherwise `INSUFFICIENT_FUNDS`.
6. Persist an append-only ledger row; return `TransactionDto` in `{ "data": ... }`.
7. Emit basic application logging for create attempts (success and domain failures); do not log full counterparty account numbers unmasked.

### 5.2 `GET /api/transactions`

Returns a paginated list of **application ledger** transactions for the current user.

#### Query parameters

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | integer ≥ 1 | `1` | Page number |
| `limit` | integer 1–100 | `20` | Page size |
| `accountId` | string | — | Filter by internal ledger account id |
| `type` | `debit` \| `credit` | — | Filter by **direction** (not `TransactionType`) |
| `dateFrom` | `YYYY-MM-DD` | — | Inclusive lower bound on `bookingDate` |
| `dateTo` | `YYYY-MM-DD` | — | Inclusive upper bound on `bookingDate` |

Invalid query values → `400` / `VALIDATION_ERROR`.  
If `dateFrom` &gt; `dateTo` → `400` / `VALIDATION_ERROR`.

Default sort: `bookingDate` descending, then `createdAt` descending.

#### Example request

```http
GET /api/transactions?page=1&limit=20&accountId=3fa85f64-5717-4562-b3fc-2c963f66afa6&type=debit&dateFrom=2026-07-01&dateTo=2026-07-25
Cookie: <better-auth-session>
```

#### Success — `200 OK`

```json
{
  "data": {
    "items": [
      {
        "id": "8f3c1a2e-4b5d-6e7f-8091-a2b3c4d5e6f7",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "amountMinor": 25050,
        "currency": "PLN",
        "direction": "debit",
        "type": "payment",
        "title": "Czynsz za lipiec",
        "counterpartyName": "Jan Kowalski",
        "counterpartyAccountNumber": "PL61109010140000071219812874",
        "transferId": null,
        "createdAt": "2026-07-25T16:05:12.345Z",
        "bookingDate": "2026-07-25"
      },
      {
        "id": "1a2b3c4d-5e6f-7081-9293-a4b5c6d7e8f9",
        "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "amountMinor": 120000,
        "currency": "PLN",
        "direction": "credit",
        "type": "deposit",
        "title": "Wpłata własna",
        "counterpartyName": null,
        "counterpartyAccountNumber": null,
        "transferId": null,
        "createdAt": "2026-07-20T09:11:00.000Z",
        "bookingDate": "2026-07-20"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

#### Empty page — `200 OK`

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

#### Errors

**Unauthorized — `401`**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

**Invalid filters — `400`**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Query parameters failed validation."
  }
}
```

**Unknown account filter for user — `404`**

When `accountId` is provided and is not an internal ledger account owned by the current user:

```json
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "Account was not found."
  }
}
```

**Internal — `500`**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

---

## 6. Transfers API

Own-account (and other multi-leg) money movement is a **separate business operation**. A transfer creates multiple ledger transactions that share a `transferId`.

The atomicity and retry rules in §6.1 apply to **`POST /api/transfers`** and to any other multi-leg transfer write path that uses `CreateTransferRequest` / `TransferDto` (including TanStack `createServerFn` handlers that share those symbols).

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/transfers` | Create a transfer (debit source + credit destination) |

Shapes: `CreateTransferRequest`, `TransferDto` in `src/shared` (see JSDoc on those symbols for persistence/retry invariants).

### 6.1 `POST /api/transfers`

#### Request

```http
POST /api/transfers
Content-Type: application/json
Cookie: <better-auth-session>
```

```json
{
  "sourceAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "destinationAccountId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "amountMinor": 10000,
  "currency": "PLN",
  "title": "Przelew na oszczędności"
}
```

(`10000` = 100.00 PLN.)

#### Success — `201 Created`

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "sourceAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "destinationAccountId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "amountMinor": 10000,
    "currency": "PLN",
    "title": "Przelew na oszczędności",
    "transactionIds": [
      "8f3c1a2e-4b5d-6e7f-8091-a2b3c4d5e6f7",
      "9e8d7c6b-5a49-3827-1605-f4e3d2c1b0a9"
    ],
    "createdAt": "2026-07-25T16:10:00.000Z"
  }
}
```

The two (or more) ledger posts referenced by `transactionIds` use the same `transferId` equal to this transfer’s `id`, with `type: "transfer"`, opposite `direction` values, and matching `amountMinor`.

This contract does **not** define FX conversion. Request `currency` must match **both** the source and destination accounts’ `currency` (accounts must therefore share a currency).

#### Atomicity

Creating a transfer and **every** ledger leg (and related balance updates) **must** run inside **one** database transaction. On any failure after writes begin, the server **rolls back all** of those writes — clients never observe a partial multi-leg transfer.

#### Retry and deduplication (no idempotency keys)

Idempotency-Key headers are **out of scope** (see §8). Safe retry for this operation is defined as follows:

| Client situation | Expected behavior |
| --- | --- |
| Domain / auth failure (`VALIDATION_ERROR`, `ACCOUNT_NOT_FOUND`, `INSUFFICIENT_FUNDS`, `UNAUTHORIZED`, `FORBIDDEN`) | **Do not retry** the same request unchanged |
| Unknown outcome (network drop, timeout, `5xx` / `INTERNAL_ERROR`) | Client **may retry** the same `CreateTransferRequest` |
| Retry after a prior success (same user + equivalent body within the server dedup window) | Server **must not** create a second transfer; return the existing `TransferDto` in `{ "data": ... }` |

Server-side deduplication fingerprint (per authenticated user): `sourceAccountId`, `destinationAccountId`, `amountMinor`, `currency`, and `title`. The dedup window length is implementation-defined but must be long enough to cover typical client retries after an unknown outcome. After the window, an identical body is treated as a new intentional transfer.

#### Server behavior (contract-level)

1. Resolve user from Better Auth session → `user.id`.
2. Validate body with `CreateTransferRequestSchema`.
3. Verify `sourceAccountId` and `destinationAccountId` are internal ledger accounts owned by that user; otherwise `ACCOUNT_NOT_FOUND`.
4. Require request `currency` to match both accounts’ `currency`; on mismatch return the standard domain-error envelope with `VALIDATION_ERROR` (same conventions as transaction currency consistency). This check runs **before** balance validation or persistence.
5. Enforce source ledger `balanceMinor` for the debit leg; otherwise `INSUFFICIENT_FUNDS`.
6. If a completed transfer matches the dedup fingerprint within the window, return that existing `TransferDto` (no new writes).
7. Otherwise, in **one** database transaction, persist the transfer and every ledger leg (and balance updates); on any failure, roll back all writes. Return `TransferDto` in `{ "data": ... }`.

#### Errors

Same envelope and codes as transactions, including:

- `VALIDATION_ERROR` — e.g. same source and destination account, or currency mismatch (request vs source/destination account; no FX)
- `ACCOUNT_NOT_FOUND` — source or destination not found for user
- `INSUFFICIENT_FUNDS` — source ledger balance too low for the debit leg
- `UNAUTHORIZED` / `FORBIDDEN` / `INTERNAL_ERROR`

Example — insufficient funds:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account balance is insufficient for this debit."
  }
}
```

---

## 7. Finalized architecture (ledger API)

These decisions are **accepted** (see `.cursor/docs/ARCHITECTURE_DECISIONS.md`):

| Topic | Decision |
| --- | --- |
| System of record | Application ledger |
| Account ids | Internal ledger `accounts.id` only; Plaid ids are not ledger API fields |
| Money | Integer minor units (`amountMinor` / `balanceMinor`) |
| Balance checks | Ledger `balanceMinor` |
| Transaction mutability | Append-only; corrections via compensating posts |
| Transfers | Separate `/api/transfers` multi-leg operation |
| Credits | Allowed only through permitted business flows (backend-enforced) |
| Storage | New ledger model; legacy tables deprecated for this API |
| Transport | HTTP and/or `createServerFn` with the **same** Zod DTOs |

---

## 8. Non-goals (this contract)

- Plaid Link, token exchange, or Plaid sync HTTP APIs
- Exposing Plaid account/transaction ids on ledger DTOs
- News CMS endpoints
- Better Auth sign-in/sign-up payloads (`/api/auth/*`)
- Idempotency keys (may be added in a future revision; transfer create uses server-side dedup in §6.1 instead)
- Async settlement states (`pending` / `posted`) — posts in this version are created as posted ledger entries
- Merged Plaid + ledger list endpoints (UI may compose later via application DTOs only)

---

## 9. Revision history

| Version | Date | Notes |
| --- | --- | --- |
| `2026-07-25` | 2026-07-25 | Initial Transactions API contract (`POST`/`GET`), envelope, error codes, ledger-only data source |
| `2026-07-25.1` | 2026-07-25 | Align with ledger architecture + `src/shared`: `amountMinor`, internal `accountId`, `type` / `transferId`, transfers API; remove float money and pending account-id TBD |
