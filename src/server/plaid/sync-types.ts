import type { DashboardTransaction } from "./types";

/** Transaction row enriched with Plaid account id for cache persistence. */
export type SyncableTransaction = DashboardTransaction & {
	plaidAccountId: string;
};
