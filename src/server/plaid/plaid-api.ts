import "@tanstack/react-start/server-only";
import type { Transaction } from "plaid";
import { plaidClient } from "#/server/plaid/client";
import { getDateRange } from "#/server/plaid/format";
import {
	mapPlaidAccount,
	mapPlaidTransaction,
} from "#/server/plaid/plaid-mappers";
import type { DashboardAccount, DashboardTransaction } from "#/server/plaid/types";
import type { SyncableTransaction } from "#/server/plaid/sync-types";

function toSyncableTransaction(transaction: Transaction): SyncableTransaction {
	const mapped = mapPlaidTransaction(transaction);
	return {
		...mapped,
		plaidAccountId: transaction.account_id,
	};
}

/** Fetches and normalizes account balances from Plaid. */
export async function fetchPlaidAccounts(
	accessToken: string,
): Promise<DashboardAccount[]> {
	const response = await plaidClient.accountsBalanceGet({
		access_token: accessToken,
	});
	return response.data.accounts.map(mapPlaidAccount);
}

/** Fetches, sorts, and normalizes recent transactions from Plaid. */
export async function fetchPlaidTransactions(
	accessToken: string,
	limit: number,
): Promise<DashboardTransaction[]> {
	const { startDate, endDate } = getDateRange(30);
	const response = await plaidClient.transactionsGet({
		access_token: accessToken,
		start_date: startDate,
		end_date: endDate,
	});

	return response.data.transactions
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, limit)
		.map(mapPlaidTransaction);
}

/** Full recent-transaction snapshot for DB sync (includes Plaid account ids). */
export async function fetchPlaidTransactionSnapshot(
	accessToken: string,
	limit: number,
): Promise<SyncableTransaction[]> {
	const { startDate, endDate } = getDateRange(30);
	const response = await plaidClient.transactionsGet({
		access_token: accessToken,
		start_date: startDate,
		end_date: endDate,
	});

	return response.data.transactions
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, limit)
		.map(toSyncableTransaction);
}
