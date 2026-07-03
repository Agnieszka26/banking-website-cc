import "@tanstack/react-start/server-only";
import { plaidLinkRepository, plaidSyncRepository } from "#/data/repositories";
import { requireSession } from "#/lib/session";
import { plaidAccountsCache, plaidTransactionsCache } from "./cache";
import { plaidClient } from "./client";
import { toDashboardUser } from "./dashboard-mappers";
import { getDateRange } from "./format";
import {
	buildAccountSummary,
	mapPlaidAccount,
	mapPlaidTransaction,
} from "./plaid-mappers";
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

async function fetchAccountsLive(accessToken: string): Promise<DashboardAccount[]> {
	const response = await plaidClient.accountsBalanceGet({
		access_token: accessToken,
	});
	return response.data.accounts.map(mapPlaidAccount);
}

async function fetchTransactionsLive(
	accessToken: string,
): Promise<DashboardTransaction[]> {
	const { startDate, endDate } = getDateRange(30);
	const response = await plaidClient.transactionsGet({
		access_token: accessToken,
		start_date: startDate,
		end_date: endDate,
	});

	return response.data.transactions
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, PLAID_DASHBOARD_TRANSACTION_LIMIT)
		.map(mapPlaidTransaction);
}

async function ensureAccountsSynced(userId: string, accessToken: string): Promise<void> {
	const timestamps = await plaidSyncRepository.getSyncTimestamps(userId);
	if (!needsPlaidSync(timestamps, "accounts")) {
		return;
	}

	try {
		await syncUserPlaidData(userId, "accounts");
	} catch {
		// Fallback to live Plaid fetch below when sync fails.
		const accounts = await fetchAccountsLive(accessToken);
		plaidAccountsCache.set(userId, accounts);
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
	} catch {
		const transactions = await fetchTransactionsLive(accessToken);
		plaidTransactionsCache.set(userId, transactions);
	}
}

async function loadAccountsForUser(
	userId: string,
	accessToken: string,
): Promise<DashboardAccount[]> {
	const memoryCached = plaidAccountsCache.get(userId) as
		| DashboardAccount[]
		| undefined;
	if (memoryCached) {
		return memoryCached;
	}

	await ensureAccountsSynced(userId, accessToken);

	const dbCached = await plaidSyncRepository.getCachedAccounts(userId);
	if (dbCached.length > 0) {
		plaidAccountsCache.set(userId, dbCached);
		return dbCached;
	}

	const live = await fetchAccountsLive(accessToken);
	plaidAccountsCache.set(userId, live);
	return live;
}

async function loadTransactionsForUser(
	userId: string,
	accessToken: string,
): Promise<DashboardTransaction[]> {
	const memoryCached = plaidTransactionsCache.get(userId) as
		| DashboardTransaction[]
		| undefined;
	if (memoryCached) {
		return memoryCached;
	}

	await ensureTransactionsSynced(userId, accessToken);

	const dbCached = await plaidSyncRepository.getCachedTransactions(userId);
	if (dbCached.length > 0) {
		plaidTransactionsCache.set(userId, dbCached);
		return dbCached;
	}

	const live = await fetchTransactionsLive(accessToken);
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
