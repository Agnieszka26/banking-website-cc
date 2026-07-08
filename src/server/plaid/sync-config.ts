/** DB cache freshness window before a background sync is triggered. */
export const PLAID_DB_ACCOUNTS_MAX_AGE_MS = 5 * 60_000;

/** DB cache freshness window before transactions are re-synced. */
export const PLAID_DB_TRANSACTIONS_MAX_AGE_MS = 10 * 60_000;

/** Maximum recent transactions stored per user after sync. */
export const PLAID_SYNC_TRANSACTION_LIMIT = 50;

/** Dashboard display limit (subset of synced transactions). */
export const PLAID_DASHBOARD_TRANSACTION_LIMIT = 16;

export type PlaidSyncScope = "all" | "accounts" | "transactions";

export type PlaidSyncTimestamps = {
	accountsSyncedAt: Date | null;
	transactionsSyncedAt: Date | null;
	syncError: string | null;
};
