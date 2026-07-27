import "@tanstack/react-start/server-only";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { plaidLinkRepository, plaidSyncRepository } from "#/data/repositories";
import { requireSession } from "#/lib/session.server";
import { mapLedgerAccountToDashboard } from "#/server/accounts/mappers";
import { provisionInternalAccountForUser } from "#/server/accounts/provision";
import { plaidAccountsCache, plaidTransactionsCache } from "./cache";
import { toDashboardUser } from "./dashboard-mappers";
import { fetchPlaidAccounts, fetchPlaidTransactions } from "./plaid-api";
import { buildAccountSummary } from "./plaid-mappers";
import { syncUserPlaidData } from "./sync.service";
import { PLAID_DASHBOARD_TRANSACTION_LIMIT } from "./sync-config";
import { needsPlaidSync } from "./sync-staleness";
import type {
	DashboardAccount,
	DashboardOverview,
	DashboardTransaction,
	DashboardTransactionsPayload,
} from "./types";

/** DB cache present (may be empty after a successful sync) vs never synced / unreadable. */
type DbHydrateResult<T> = { kind: "data"; value: T } | { kind: "absent" };

type SyncFallbackState = {
	liveFetchAttempted: boolean;
	liveFetchError: unknown | null;
};

const idleSyncFallback: SyncFallbackState = {
	liveFetchAttempted: false,
	liveFetchError: null,
};

async function getAccessTokenForUser(userId: string): Promise<string | null> {
	return plaidLinkRepository.getAccessToken(userId);
}

async function hydrateAccountsFromDb(
	userId: string,
): Promise<DbHydrateResult<DashboardAccount[]>> {
	try {
		const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
		if (!timestamps?.accountsSyncedAt) {
			return { kind: "absent" };
		}

		const dbCached = await plaidSyncRepository.getCachedAccounts(userId);
		plaidAccountsCache.set(userId, dbCached);
		return { kind: "data", value: dbCached };
	} catch (error) {
		console.error("Plaid DB account hydration failed", {
			userId,
			error: error instanceof Error ? error.message : error,
		});
		return { kind: "absent" };
	}
}

async function hydrateTransactionsFromDb(
	userId: string,
): Promise<DbHydrateResult<DashboardTransaction[]>> {
	try {
		const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
		if (!timestamps?.transactionsSyncedAt) {
			return { kind: "absent" };
		}

		const dbCached = await plaidSyncRepository.getCachedTransactions(userId);
		plaidTransactionsCache.set(userId, dbCached);
		return { kind: "data", value: dbCached };
	} catch (error) {
		console.error("Plaid DB transaction hydration failed", {
			userId,
			error: error instanceof Error ? error.message : error,
		});
		return { kind: "absent" };
	}
}

async function ensureAccountsSynced(
	userId: string,
	accessToken: string,
): Promise<SyncFallbackState> {
	const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
	if (!needsPlaidSync(timestamps, "accounts")) {
		return idleSyncFallback;
	}

	try {
		await syncUserPlaidData(userId, "accounts");
		return idleSyncFallback;
	} catch (syncError) {
		console.error("Plaid account sync failed; trying cache and live fallback", {
			userId,
			error: syncError instanceof Error ? syncError.message : syncError,
		});

		const hydrated = await hydrateAccountsFromDb(userId);
		if (hydrated.kind === "data") {
			return idleSyncFallback;
		}

		const fallback: SyncFallbackState = {
			liveFetchAttempted: true,
			liveFetchError: null,
		};

		try {
			const accounts = await fetchPlaidAccounts(accessToken);
			plaidAccountsCache.set(userId, accounts);
		} catch (liveError) {
			fallback.liveFetchError = liveError;
			console.error("Plaid live account fallback failed", {
				userId,
				error: liveError instanceof Error ? liveError.message : liveError,
			});
		}

		return fallback;
	}
}

async function ensureTransactionsSynced(
	userId: string,
	accessToken: string,
): Promise<SyncFallbackState> {
	const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
	if (!needsPlaidSync(timestamps, "transactions")) {
		return idleSyncFallback;
	}

	try {
		await syncUserPlaidData(userId, "transactions");
		return idleSyncFallback;
	} catch (syncError) {
		console.error(
			"Plaid transaction sync failed; trying cache and live fallback",
			{
				userId,
				error: syncError instanceof Error ? syncError.message : syncError,
			},
		);

		const hydrated = await hydrateTransactionsFromDb(userId);
		if (hydrated.kind === "data") {
			return idleSyncFallback;
		}

		const fallback: SyncFallbackState = {
			liveFetchAttempted: true,
			liveFetchError: null,
		};

		try {
			const transactions = await fetchPlaidTransactions(accessToken);
			plaidTransactionsCache.set(userId, transactions);
		} catch (liveError) {
			fallback.liveFetchError = liveError;
			console.error("Plaid live transaction fallback failed", {
				userId,
				error: liveError instanceof Error ? liveError.message : liveError,
			});
		}

		return fallback;
	}
}

async function loadAccountsForUser(
	userId: string,
	accessToken: string,
): Promise<DashboardAccount[]> {
	const memoryCached = plaidAccountsCache.get(userId);
	if (memoryCached) {
		return memoryCached;
	}

	const { liveFetchAttempted, liveFetchError } = await ensureAccountsSynced(
		userId,
		accessToken,
	);

	const afterSyncMemory = plaidAccountsCache.get(userId);
	if (afterSyncMemory) {
		return afterSyncMemory;
	}

	const dbCached = await hydrateAccountsFromDb(userId);
	if (dbCached.kind === "data") {
		return dbCached.value;
	}

	if (liveFetchAttempted) {
		const staleDbCached = await hydrateAccountsFromDb(userId);
		if (staleDbCached.kind === "data") {
			return staleDbCached.value;
		}
		if (liveFetchError) {
			throw liveFetchError;
		}
		return [];
	}

	try {
		const live = await fetchPlaidAccounts(accessToken);
		plaidAccountsCache.set(userId, live);
		return live;
	} catch (liveError) {
		console.error("Plaid live account fetch failed", {
			userId,
			error: liveError instanceof Error ? liveError.message : liveError,
		});

		const staleDbCached = await hydrateAccountsFromDb(userId);
		if (staleDbCached.kind === "data") {
			return staleDbCached.value;
		}

		throw liveError;
	}
}

async function loadTransactionsForUser(
	userId: string,
	accessToken: string,
): Promise<DashboardTransaction[]> {
	const memoryCached = plaidTransactionsCache.get(userId);
	if (memoryCached) {
		return memoryCached;
	}

	const { liveFetchAttempted, liveFetchError } = await ensureTransactionsSynced(
		userId,
		accessToken,
	);

	const afterSyncMemory = plaidTransactionsCache.get(userId);
	if (afterSyncMemory) {
		return afterSyncMemory;
	}

	const dbCached = await hydrateTransactionsFromDb(userId);
	if (dbCached.kind === "data") {
		return dbCached.value;
	}

	if (liveFetchAttempted) {
		const staleDbCached = await hydrateTransactionsFromDb(userId);
		if (staleDbCached.kind === "data") {
			return staleDbCached.value;
		}
		if (liveFetchError) {
			throw liveFetchError;
		}
		return [];
	}

	try {
		const live = await fetchPlaidTransactions(accessToken);
		plaidTransactionsCache.set(userId, live);
		return live;
	} catch (liveError) {
		console.error("Plaid live transaction fetch failed", {
			userId,
			error: liveError instanceof Error ? liveError.message : liveError,
		});

		const staleDbCached = await hydrateTransactionsFromDb(userId);
		if (staleDbCached.kind === "data") {
			return staleDbCached.value;
		}

		throw liveError;
	}
}

/** Loads account balances and summary for the dashboard. */
export async function loadDashboardOverview(): Promise<DashboardOverview> {
	const session = await requireSession("unauthorized");
	const userId = session.user.id;
	const user = toDashboardUser(session);

	await provisionInternalAccountForUser(userId);
	const ledgerRows = await ledgerAccountRepository.listOwned(userId);
	const internalAccounts = ledgerRows.map(mapLedgerAccountToDashboard);

	const accessToken = await getAccessTokenForUser(userId);

	if (!accessToken) {
		return {
			linked: false,
			user,
			accounts: internalAccounts,
			summary: buildAccountSummary(internalAccounts),
		};
	}

	try {
		const plaidAccounts = await loadAccountsForUser(userId, accessToken);
		const accounts = [...internalAccounts, ...plaidAccounts];

		return {
			linked: true,
			user,
			accounts,
			summary: buildAccountSummary(accounts),
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch dashboard accounts from Plaid: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/** Loads recent transactions for the dashboard. */
export async function loadDashboardTransactions(): Promise<DashboardTransactionsPayload> {
	const session = await requireSession("unauthorized");
	const userId = session.user.id;
	const accessToken = await getAccessTokenForUser(userId);

	if (!accessToken) {
		return {
			linked: false,
			transactions: [],
		};
	}

	try {
		const transactions = await loadTransactionsForUser(userId, accessToken);

		return {
			linked: true,
			transactions: transactions.slice(0, PLAID_DASHBOARD_TRANSACTION_LIMIT),
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch dashboard transactions from Plaid: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/** Loads the full synced transaction list for the transactions page. */
export async function loadAllTransactions(): Promise<DashboardTransactionsPayload> {
	const session = await requireSession("unauthorized");
	const userId = session.user.id;
	const accessToken = await getAccessTokenForUser(userId);

	if (!accessToken) {
		return {
			linked: false,
			transactions: [],
		};
	}

	try {
		const transactions = await loadTransactionsForUser(userId, accessToken);

		return {
			linked: true,
			transactions,
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch transactions from Plaid: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
