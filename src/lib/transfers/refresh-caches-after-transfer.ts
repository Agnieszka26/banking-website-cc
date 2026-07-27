/**
 * Refreshes route-loader caches after a successful ledger transfer.
 *
 * Uses a single `router.invalidate()` so dashboard + transactions loaders
 * that share the same underlying fetches are refreshed once (no duplicate
 * targeted invalidations). Does not mutate balances client-side — the
 * server remains the source of truth.
 *
 * Transfer legs appear on the transactions page via GET ledger transactions
 * (no dedicated GET transfers endpoint in the API contract).
 */
export async function refreshCachesAfterTransfer(router: {
	invalidate: () => Promise<void>;
}): Promise<void> {
	await router.invalidate();
}
