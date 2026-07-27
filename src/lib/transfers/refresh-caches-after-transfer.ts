/**
 * Refreshes route-loader caches after a successful ledger transfer.
 *
 * Uses a single `router.invalidate()` so dashboard + transactions loaders
 * that share the same underlying fetches are refreshed once (no duplicate
 * targeted invalidations). Does not mutate balances client-side — the
 * server remains the source of truth.
 *
 * TODO(transfers-list): When `/$locale/dashboard/transfers` gains a loader
 * backed by a list-transfers API, default `router.invalidate()` already
 * covers matched routes. If we later switch to filtered invalidation,
 * include the transfers route id here.
 */
export async function refreshCachesAfterTransfer(router: {
	invalidate: () => Promise<void>;
}): Promise<void> {
	await router.invalidate();
}
