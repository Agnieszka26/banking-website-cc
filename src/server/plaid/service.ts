import "@tanstack/react-start/server-only";
import { plaidLinkRepository, plaidSyncRepository } from "#/data/repositories";
import { requireSession } from "#/lib/session";
import { plaidAccountsCache, plaidTransactionsCache } from "./cache";
import { toDashboardUser } from "./dashboard-mappers";
import { buildAccountSummary } from "./plaid-mappers";
import {
	fetchPlaidAccounts,
	fetchPlaidTransactions,
} from "./plaid-api";
import { needsPlaidSync } from "./sync-staleness";
import { syncUserPlaidData } from "./sync.service";
import type {
	DashboardAccount,
	DashboardOverview,
	DashboardTransaction,
	DashboardTransactionsPayload,
} from "./types";
import { PLAID_DASHBOARD_TRANSACTION_LIMIT } from "./sync-config";

export { mergeDashboardData, toDashboardUser } from "./dashboard-mappers";

async function getAccessTokenForUser(userId: string): Promise<string | null> {
	return plaidLinkRepository.getAccessToken(userId);
}

async function ensureAccountsSynced(userId: string, accessToken: string): Promise<void> {
	const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
	if (!needsPlaidSync(timestamps, "accounts")) {
		return;
	}

	try {
		await syncUserPlaidData(userId, "accounts");
	} catch (syncError) {
		console.error("Plaid account sync failed; trying live fallback", {
			userId,
			error: syncError instanceof Error ? syncError.message : syncError,
		});

		try {
			const accounts = await fetchPlaidAccounts(accessToken);
			plaidAccountsCache.set(userId, accounts);
		} catch (liveError) {
			console.error("Plaid live account fallback failed", {
				userId,
				error: liveError instanceof Error ? liveError.message : liveError,
			});
		}
	}
}

async function ensureTransactionsSynced(
	userId: string,
	accessToken: string,
): Promise<void> {
	const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
	if (!needsPlaidSync(timestamps, "transactions")) {
		return;
	}

	try {
		await syncUserPlaidData(userId, "transactions");
	} catch (syncError) {
		console.error("Plaid transaction sync failed; trying live fallback", {
			userId,
			error: syncError instanceof Error ? syncError.message : syncError,
		});

		try {
			const transactions = await fetchPlaidTransactions(
				accessToken,
				PLAID_DASHBOARD_TRANSACTION_LIMIT,
			);
			plaidTransactionsCache.set(userId, transactions);
		} catch (liveError) {
			console.error("Plaid live transaction fallback failed", {
				userId,
				error: liveError instanceof Error ? liveError.message : liveError,
			});
		}
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

	await ensureAccountsSynced(userId, accessToken);

	const afterSyncMemory = plaidAccountsCache.get(userId);
	if (afterSyncMemory) {
		return afterSyncMemory;
	}

	const dbCached = await plaidSyncRepository.getCachedAccounts(userId);
	if (dbCached.length > 0) {
		plaidAccountsCache.set(userId, dbCached);
		return dbCached;
	}

	const live = await fetchPlaidAccounts(accessToken);
	plaidAccountsCache.set(userId, live);
	return live;
}

async function loadTransactionsForUser(
	userId: string,
	accessToken: string,
): Promise<DashboardTransaction[]> {
	const memoryCached = plaidTransactionsCache.get(userId);
	if (memoryCached) {
		return memoryCached;
	}

	await ensureTransactionsSynced(userId, accessToken);

	const afterSyncMemory = plaidTransactionsCache.get(userId);
	if (afterSyncMemory) {
		return afterSyncMemory;
	}

	const dbCached = await plaidSyncRepository.getCachedTransactions(userId);
	if (dbCached.length > 0) {
		plaidTransactionsCache.set(userId, dbCached);
		return dbCached;
	}

	const live = await fetchPlaidTransactions(
		accessToken,
		PLAID_DASHBOARD_TRANSACTION_LIMIT,
	);
	plaidTransactionsCache.set(userId, live);
	return live;
}

/** Loads account balances and summary for the dashboard. */
export async function loadDashboardOverview(): Promise<DashboardOverview> {
	const session = await requireSession("unauthorized");
	const userId = session.user.id;
	const user = toDashboardUser(session);
	const accessToken = await getAccessTokenForUser(userId);

	if (!accessToken) {
		return {
			linked: false,
			user,
			accounts: [],
			summary: null,
		};
	}

	try {
		const accounts = await loadAccountsForUser(userId, accessToken);

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
			transactions,
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch dashboard transactions from Plaid: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
