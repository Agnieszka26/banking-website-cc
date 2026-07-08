import "@tanstack/react-start/server-only";
import type { Transaction } from "plaid";
import { plaidClient } from "#/server/plaid/client";
import { getDateRange } from "#/server/plaid/format";
import {
	mapPlaidAccount,
	mapPlaidTransaction,
} from "#/server/plaid/plaid-mappers";
import type { SyncableTransaction } from "#/server/plaid/sync-types";
import type {
	DashboardAccount,
	DashboardTransaction,
} from "#/server/plaid/types";

/** Plaid max page size for `/transactions/get`. */
const PLAID_TRANSACTIONS_PAGE_SIZE = 500;

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

async function fetchPlaidTransactionPages(
	accessToken: string,
	days = 30,
): Promise<Transaction[]> {
	const { startDate, endDate } = getDateRange(days);
	const transactions: Transaction[] = [];
	let offset = 0;
	let totalTransactions = Number.POSITIVE_INFINITY;

	while (offset < totalTransactions) {
		const response = await plaidClient.transactionsGet({
			access_token: accessToken,
			start_date: startDate,
			end_date: endDate,
			options: {
				count: PLAID_TRANSACTIONS_PAGE_SIZE,
				offset,
			},
		});

		totalTransactions = response.data.total_transactions;
		const page = response.data.transactions;
		transactions.push(...page);
		offset += page.length;

		if (page.length === 0) {
			break;
		}
	}

	return transactions;
}

function sortTransactionsByDateDesc(
	transactions: Transaction[],
): Transaction[] {
	return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

/** Fetches, sorts, and normalizes all transactions in the date window from Plaid. */
export async function fetchPlaidTransactions(
	accessToken: string,
): Promise<DashboardTransaction[]> {
	const transactions = await fetchPlaidTransactionPages(accessToken);
	return sortTransactionsByDateDesc(transactions).map(mapPlaidTransaction);
}

/** Full recent-transaction snapshot for DB sync (includes Plaid account ids). */
export async function fetchPlaidTransactionSnapshot(
	accessToken: string,
): Promise<SyncableTransaction[]> {
	const transactions = await fetchPlaidTransactionPages(accessToken);
	return sortTransactionsByDateDesc(transactions).map(toSyncableTransaction);
}
