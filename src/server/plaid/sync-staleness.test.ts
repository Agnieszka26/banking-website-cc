import { describe, expect, it } from "vitest";
import {
	PLAID_DB_ACCOUNTS_MAX_AGE_MS,
	PLAID_DB_TRANSACTIONS_MAX_AGE_MS,
} from "#/server/plaid/sync-config";
import {
	isAccountsCacheStale,
	isTransactionsCacheStale,
	needsPlaidSync,
} from "#/server/plaid/sync-staleness";

describe("isAccountsCacheStale", () => {
	it("treats missing timestamps as stale", () => {
		expect(isAccountsCacheStale(null)).toBe(true);
	});

	it("returns false while inside the TTL window", () => {
		const now = Date.now();
		const syncedAt = new Date(now - PLAID_DB_ACCOUNTS_MAX_AGE_MS + 1_000);

		expect(isAccountsCacheStale(syncedAt, now)).toBe(false);
	});

	it("returns true after the TTL window", () => {
		const now = Date.now();
		const syncedAt = new Date(now - PLAID_DB_ACCOUNTS_MAX_AGE_MS - 1);

		expect(isAccountsCacheStale(syncedAt, now)).toBe(true);
	});
});

describe("isTransactionsCacheStale", () => {
	it("uses the transactions TTL", () => {
		const now = Date.now();
		const syncedAt = new Date(now - PLAID_DB_TRANSACTIONS_MAX_AGE_MS - 1);

		expect(isTransactionsCacheStale(syncedAt, now)).toBe(true);
	});
});

describe("needsPlaidSync", () => {
	it("requires sync when timestamps are missing", () => {
		expect(needsPlaidSync(null, "accounts")).toBe(true);
	});

	it("checks only the requested scope", () => {
		const now = Date.now();
		const timestamps = {
			accountsSyncedAt: new Date(now),
			transactionsSyncedAt: new Date(
				now - PLAID_DB_TRANSACTIONS_MAX_AGE_MS - 1,
			),
			syncError: null,
		};

		expect(needsPlaidSync(timestamps, "accounts", now)).toBe(false);
		expect(needsPlaidSync(timestamps, "transactions", now)).toBe(true);
	});
});
