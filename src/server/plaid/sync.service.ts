import "@tanstack/react-start/server-only";
import type { Transaction } from "plaid";
import { plaidLinkRepository, plaidSyncRepository } from "#/data/repositories";
import { plaidClient } from "#/server/plaid/client";
import { getDateRange } from "#/server/plaid/format";
import {
	mapPlaidAccount,
	mapPlaidTransaction,
} from "#/server/plaid/plaid-mappers";
import type { PlaidSyncScope } from "#/server/plaid/sync-config";
import type { SyncableTransaction } from "#/server/plaid/sync-types";

function toSyncableTransaction(transaction: Transaction): SyncableTransaction {
	const mapped = mapPlaidTransaction(transaction);
	return {
		...mapped,
		plaidAccountId: transaction.account_id,
	};
}

async function fetchAccountsFromPlaid(accessToken: string) {
	const response = await plaidClient.accountsBalanceGet({
		access_token: accessToken,
	});
	return response.data.accounts.map(mapPlaidAccount);
}

async function fetchTransactionsFromPlaid(accessToken: string) {
	const { startDate, endDate } = getDateRange(30);
	const response = await plaidClient.transactionsGet({
		access_token: accessToken,
		start_date: startDate,
		end_date: endDate,
	});

	return response.data.transactions
		.sort((a, b) => b.date.localeCompare(a.date))
		.map(toSyncableTransaction);
}

/**
 * Pulls normalized Plaid data into Postgres cache tables for a user.
 * Intended for sync-on-link, stale refresh, and future cron/webhook workers.
 */
export async function syncUserPlaidData(
	userId: string,
	scope: PlaidSyncScope = "all",
): Promise<void> {
	const accessToken = await plaidLinkRepository.getAccessToken(userId);
	if (!accessToken) {
		return;
	}

	try {
		if (scope === "all" || scope === "accounts") {
			const accounts = await fetchAccountsFromPlaid(accessToken);
			await plaidSyncRepository.replaceAccounts(userId, accounts);
		}

		if (scope === "all" || scope === "transactions") {
			const transactions = await fetchTransactionsFromPlaid(accessToken);
			await plaidSyncRepository.replaceTransactions(userId, transactions);
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown Plaid sync error";
		await plaidSyncRepository.recordSyncError(userId, message);
		throw error;
	}
}

/** Clears cached Plaid rows after unlinking or token rotation. */
export async function clearUserPlaidCache(userId: string): Promise<void> {
	await plaidSyncRepository.clearCachedData(userId);
}
