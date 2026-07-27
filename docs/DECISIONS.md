# Banking Account Model Decision

## Context

The application is a banking simulation platform. The goal is to model core banking functionality without requiring real bank integrations.

Previously, Plaid was used as the main source of banking data. However, Plaid represents external bank connections and should not define the core account model of the application.

The application needs its own internal banking domain with accounts, balances, transactions, and transfers.

---

## Decision

### 1. Every user gets an internal bank account during account creation

When a user signs up, the system automatically creates an internal account.

The account includes:

- unique account identifier
- generated IBAN/account number
- currency
- balance managed through the ledger

Example:


User created
|
v
Create internal account
|
v
Generate IBAN
|
v
Create initial balance transaction


The IBAN belongs to the application's internal banking system and is not provided by Plaid.

---

### 2. New accounts receive an initial demo balance

Every newly created account starts with:


1000 PLN


This is a simulated initial deposit.

The initial balance must be represented as a ledger transaction, not as a direct database balance update.

Example:


Ledger transaction:

type: deposit
amount: +1000 PLN
description: Initial account balance


The ledger remains the source of truth.

---

### 3. Internal transfers are handled inside the application

Users can transfer money between accounts created within the application.

Transfer flow:


Sender account
|
| - amount
|
v
Transfer workflow
|
| + amount
|
v
Recipient account


A transfer must create corresponding ledger entries:


Sender:
-100 PLN

Recipient:
+100 PLN


Transfers should not depend on Plaid.

---

### 4. Ledger is the source of truth

Account balances are derived from ledger transactions.

The system should avoid directly modifying balances when performing financial operations.

Financial actions should create immutable ledger records:

- initial deposits
- transfers
- refunds
- other account movements

---

### 5. Plaid remains an optional feature

Plaid is kept as an external banking integration simulation.

Purpose:

- simulate connecting an external bank
- import external transactions
- display external account data

Plaid is NOT responsible for:

- creating application accounts
- generating IBANs
- managing internal balances
- processing internal transfers

The application should work fully without a Plaid connection.

---

## Resulting Domain Model


User
|
└── Account
|
├── IBAN
├── Currency
└── Ledger Transactions

Optional:

Account
|
└── Plaid Connection
|
└── External Bank Data


---

## Implementation notes (2026-07-27)

- Signup (`better-auth` `databaseHooks.user.create.after`) provisions one internal `ledger_accounts` row with a generated Polish IBAN and a ledger `deposit` of **1000 PLN** (`Initial account balance`).
- Dashboard loads internal ledger accounts first; Plaid remains an optional external import.
- Internal transfers support own-account (`destinationAccountId`) and recipient-by-IBAN (`destinationIban`). Cross-user credits use the owner DB role after service-layer source ownership checks (RLS cannot credit another user’s account).
- `balance_minor` remains a denormalized cache updated atomically with ledger posts (ledger posts are the audit source of truth).

---

## Benefits

- Clear separation between internal banking logic and external integrations.
- More realistic banking architecture.
- Easier testing without external dependencies.
- Plaid becomes an optional enhancement instead of a core requirement.
- Internal transfers follow proper accounting principles.