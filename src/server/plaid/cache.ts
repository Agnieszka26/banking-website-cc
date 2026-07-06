import type {
	DashboardAccount,
	DashboardTransaction,
} from "./types";

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

function evictExpired<T>(store: Map<string, CacheEntry<T>>): void {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (now > entry.expiresAt) {
			store.delete(key);
		}
	}
}

/** In-memory TTL cache for short-lived server-side Plaid response reuse. */
export function createTtlCache<T>(ttlMs: number) {
	const store = new Map<string, CacheEntry<T>>();

	return {
		get(key: string): T | undefined {
			evictExpired(store);
			const entry = store.get(key);
			if (!entry) {
				return undefined;
			}

			if (Date.now() > entry.expiresAt) {
				store.delete(key);
				return undefined;
			}

			return entry.value;
		},
		set(key: string, value: T): void {
			evictExpired(store);
			store.set(key, { value, expiresAt: Date.now() + ttlMs });
		},
		delete(key: string): void {
			store.delete(key);
		},
	};
}

export const ACCOUNTS_CACHE_TTL_MS = 60_000;
export const TRANSACTIONS_CACHE_TTL_MS = 120_000;

/**
 * Process-local L1 cache. `invalidatePlaidCache` clears entries for the current
 * instance only; DB sync cache is the cross-request source of truth after link.
 */
export const plaidAccountsCache = createTtlCache<DashboardAccount[]>(
	ACCOUNTS_CACHE_TTL_MS,
);
export const plaidTransactionsCache = createTtlCache<DashboardTransaction[]>(
	TRANSACTIONS_CACHE_TTL_MS,
);

/** Clears cached Plaid API payloads after linking a new account. */
export function invalidatePlaidCache(userId: string): void {
	plaidAccountsCache.delete(userId);
	plaidTransactionsCache.delete(userId);
}
