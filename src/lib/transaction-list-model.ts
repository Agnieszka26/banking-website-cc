import type { DashboardTransaction } from "#/server/plaid/types";
import type { TransactionDto } from "#/shared/types";

/**
 * Presentation model for the transactions list.
 * Components consume this — not raw Plaid or ledger API DTOs.
 */
export type TransactionListItemViewModel = {
	id: string;
	/** Booking / posted date as `YYYY-MM-DD`. */
	date: string;
	name: string;
	/**
	 * Signed major units using the existing list convention:
	 * negative = income/credit, positive = outcome/debit.
	 */
	amount: number;
	currency: string;
	/** Set for multi-leg transfer posts; otherwise null. */
	transferId: string | null;
	/** True when the row is an app-ledger transfer leg. */
	isTransfer: boolean;
};

export type TransactionsPageData = {
	/** Whether a Plaid bank link exists (for connect CTA). */
	linked: boolean;
	transactions: TransactionListItemViewModel[];
	/** True when the ledger list call failed (Plaid rows may still be present). */
	ledgerLoadFailed: boolean;
};

/** Maps a Plaid dashboard transaction into the shared list view model. */
export function mapPlaidTransactionToListItem(
	transaction: DashboardTransaction,
): TransactionListItemViewModel {
	return {
		id: transaction.id,
		date: transaction.date,
		name: transaction.name,
		amount: transaction.amount,
		currency: transaction.currency,
		transferId: null,
		isTransfer: false,
	};
}

/**
 * Maps a ledger `TransactionDto` into the shared list view model.
 * Transfer legs (`type: "transfer"` / non-null `transferId`) are flagged for UI.
 */
export function mapLedgerTransactionToListItem(
	transaction: TransactionDto,
): TransactionListItemViewModel {
	const major = transaction.amountMinor / 100;
	const signedAmount =
		transaction.direction === "credit" ? -major : major;

	return {
		id: transaction.id,
		date: transaction.bookingDate,
		name: transaction.title,
		amount: signedAmount,
		currency: transaction.currency,
		transferId: transaction.transferId,
		isTransfer:
			transaction.type === "transfer" || transaction.transferId !== null,
	};
}
