import type { DashboardTransaction } from "#/server/plaid";
import {formatPlDate} from "#/server/plaid/format";


export type TransactionFlow = "income" | "outcome";

export type TransactionTypeFilter = "all" | TransactionFlow;

export type DateSortOrder = "asc" | "desc";

export type AmountSortOrder = "asc" | "desc" | "none";

export type TypeSortOrder = "income-first" | "outcome-first" | "none";

export const TRANSACTIONS_PAGE_SIZE = 10;

export type TransactionListQuery = {
	search: string;
	typeFilter: TransactionTypeFilter;
	dateSort: DateSortOrder;
	amountSort: AmountSortOrder;
	typeSort: TypeSortOrder;
	page: number;
};

export type ProcessedTransactions = {
	items: DashboardTransaction[];
	total: number;
	totalPages: number;
	page: number;
};

export function getTransactionFlow(amount: number): TransactionFlow {
	return amount < 0 ? "income" : "outcome";
}

function matchesSearch(transaction: DashboardTransaction, search: string): boolean {
	const query = search.trim().toLowerCase();
	if (!query) {
		return true;
	}

	return (
		transaction.name.toLowerCase().includes(query) ||
		transaction.date.includes(query) ||
		formatPlDate(transaction.date).toLowerCase().includes(query) ||
		transaction.currency.toLowerCase().includes(query)
	);
}	


function compareByType(
	a: DashboardTransaction,
	b: DashboardTransaction,
	order: TypeSortOrder,
): number {
	if (order === "none") {
		return 0;
	}

	const aFlow = getTransactionFlow(a.amount);
	const bFlow = getTransactionFlow(b.amount);

	if (aFlow === bFlow) {
		return 0;
	}

	if (order === "income-first") {
		return aFlow === "income" ? -1 : 1;
	}

	return aFlow === "outcome" ? -1 : 1;
}

function compareByAmount(
	a: DashboardTransaction,
	b: DashboardTransaction,
	order: AmountSortOrder,
): number {
	if (order === "none") {
		return 0;
	}

	const diff = Math.abs(a.amount) - Math.abs(b.amount);
	return order === "asc" ? diff : -diff;
}

function compareByDate(
	a: DashboardTransaction,
	b: DashboardTransaction,
	order: DateSortOrder,
): number {
	const diff = a.date.localeCompare(b.date);
	return order === "asc" ? diff : -diff;
}

export function processTransactions(
	transactions: DashboardTransaction[],
	query: TransactionListQuery,
): ProcessedTransactions {
	const filtered = transactions.filter((transaction) => {
		if (
			query.typeFilter !== "all" &&
			getTransactionFlow(transaction.amount) !== query.typeFilter
		) {
			return false;
		}

		return matchesSearch(transaction, query.search);
	});

	const sorted = [...filtered].sort((a, b) => {
		const typeComparison = compareByType(a, b, query.typeSort);
		if (typeComparison !== 0) {
			return typeComparison;
		}

		const amountComparison = compareByAmount(a, b, query.amountSort);
		if (amountComparison !== 0) {
			return amountComparison;
		}

		return compareByDate(a, b, query.dateSort);
	});

	const totalPages = Math.max(
		1,
		Math.ceil(sorted.length / TRANSACTIONS_PAGE_SIZE),
	);
	const page = Math.min(Math.max(query.page, 1), totalPages);
	const start = (page - 1) * TRANSACTIONS_PAGE_SIZE;

	return {
		items: sorted.slice(start, start + TRANSACTIONS_PAGE_SIZE),
		total: sorted.length,
		totalPages,
		page,
	};
}
