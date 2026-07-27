import {
	mapLedgerTransactionToListItem,
	mapPlaidTransactionToListItem,
	type TransactionsPageData,
} from "#/lib/transaction-list-model";
import { getTransactions } from "#/server/plaid";
import { listLedgerTransactions } from "#/server/transactions/functions";

/**
 * Loads the transactions page payload: Plaid rows + app ledger rows
 * (including transfer legs from GET ledger transactions).
 *
 * There is no GET `/api/transfers` in the contract — transfer visibility
 * is via ledger `TransactionDto` (`type: "transfer"`, `transferId`).
 */
export async function loadTransactionsPageData(): Promise<TransactionsPageData> {
	const [plaidResult, ledgerResult] = await Promise.allSettled([
		getTransactions(),
		listLedgerTransactions({ data: { page: 1, limit: 100 } }),
	]);

	const plaid =
		plaidResult.status === "fulfilled"
			? plaidResult.value
			: { linked: false, transactions: [] };

	const ledgerLoadFailed = ledgerResult.status === "rejected";
	const ledgerItems =
		ledgerResult.status === "fulfilled"
			? ledgerResult.value.data.items.map(mapLedgerTransactionToListItem)
			: [];

	return {
		linked: plaid.linked,
		ledgerLoadFailed,
		transactions: [
			...plaid.transactions.map(mapPlaidTransactionToListItem),
			...ledgerItems,
		],
	};
}
