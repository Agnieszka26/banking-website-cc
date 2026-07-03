type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

/** In-memory TTL cache for short-lived server-side Plaid response reuse. */
export function createTtlCache<T>(ttlMs: number) {
	const store = new Map<string, CacheEntry<T>>();

	return {
		get(key: string): T | undefined {
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
			store.set(key, { value, expiresAt: Date.now() + ttlMs });
		},
		delete(key: string): void {
			store.delete(key);
		},
	};
}

export const ACCOUNTS_CACHE_TTL_MS = 60_000;
export const TRANSACTIONS_CACHE_TTL_MS = 120_000;

export const plaidAccountsCache = createTtlCache<unknown[]>(
	ACCOUNTS_CACHE_TTL_MS,
);
export const plaidTransactionsCache = createTtlCache<unknown[]>(
	TRANSACTIONS_CACHE_TTL_MS,
);

/** Clears cached Plaid API payloads after linking a new account. */
export function invalidatePlaidCache(userId: string): void {
	plaidAccountsCache.delete(userId);
	plaidTransactionsCache.delete(userId);
}
