import {
	PLAID_DB_ACCOUNTS_MAX_AGE_MS,
	PLAID_DB_TRANSACTIONS_MAX_AGE_MS,
	type PlaidSyncTimestamps,
} from "./sync-config";

/** Returns true when account cache is missing or older than the configured TTL. */
export function isAccountsCacheStale(
	syncedAt: Date | null | undefined,
	now = Date.now(),
): boolean {
	if (!syncedAt) {
		return true;
	}

	return now - syncedAt.getTime() > PLAID_DB_ACCOUNTS_MAX_AGE_MS;
}

/** Returns true when transaction cache is missing or older than the configured TTL. */
export function isTransactionsCacheStale(
	syncedAt: Date | null | undefined,
	now = Date.now(),
): boolean {
	if (!syncedAt) {
		return true;
	}

	return now - syncedAt.getTime() > PLAID_DB_TRANSACTIONS_MAX_AGE_MS;
}

/** Evaluates whether a sync run is needed for the given scope. */
export function needsPlaidSync(
	timestamps: PlaidSyncTimestamps | null,
	scope: "accounts" | "transactions",
	now = Date.now(),
): boolean {
	if (!timestamps) {
		return true;
	}

	if (scope === "accounts") {
		return isAccountsCacheStale(timestamps.accountsSyncedAt, now);
	}

	return isTransactionsCacheStale(timestamps.transactionsSyncedAt, now);
}
