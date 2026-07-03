import { afterEach, describe, expect, it, vi } from "vitest";
import { createTtlCache, invalidatePlaidCache, plaidAccountsCache, plaidTransactionsCache } from "#/server/plaid/cache";

describe("createTtlCache", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("stores and returns values before ttl expiry", () => {
		const cache = createTtlCache<string>(1_000);
		cache.set("user-1", "payload");

		expect(cache.get("user-1")).toBe("payload");
	});

	it("expires values after ttl", () => {
		vi.useFakeTimers();
		const cache = createTtlCache<string>(1_000);
		cache.set("user-1", "payload");

		vi.advanceTimersByTime(1_001);

		expect(cache.get("user-1")).toBeUndefined();
	});

	it("deletes cached values explicitly", () => {
		const cache = createTtlCache<string>(1_000);
		cache.set("user-1", "payload");
		cache.delete("user-1");

		expect(cache.get("user-1")).toBeUndefined();
	});
});

describe("invalidatePlaidCache", () => {
	it("clears both plaid caches for a user", () => {
		plaidAccountsCache.set("user-1", [{ id: "acc" }]);
		plaidTransactionsCache.set("user-1", [{ id: "tx" }]);

		invalidatePlaidCache("user-1");

		expect(plaidAccountsCache.get("user-1")).toBeUndefined();
		expect(plaidTransactionsCache.get("user-1")).toBeUndefined();
	});
});
