import type { AccountBase, Transaction } from "plaid";
import type {
	DashboardAccount,
	DashboardSummary,
	DashboardTransaction,
} from "./types";

const SAVINGS_ACCOUNT_TYPES = new Set(["savings", "cd", "money market"]);

const CREDIT_OR_LOAN_ACCOUNT_TYPES = new Set([
	"credit card",
	"loan",
	"mortgage",
	"line of credit",
	"student",
	"auto",
	"commercial",
	"construction",
	"consumer",
	"home equity",
	"overdraft",
]);

function isCashLikeAccount(type: string): boolean {
	const normalized = type.toLowerCase();
	if (CREDIT_OR_LOAN_ACCOUNT_TYPES.has(normalized)) {
		return false;
	}

	return !normalized.includes("credit") && !normalized.includes("loan");
}

/** Maps a Plaid account payload to the dashboard DTO. */
export function mapPlaidAccount(account: AccountBase): DashboardAccount {
	return {
		id: account.account_id,
		name: account.name,
		mask: account.mask ?? "****",
		balance: account.balances.current ?? account.balances.available ?? 0,
		currency: account.balances.iso_currency_code ?? "PLN",
		type: account.subtype ?? account.type,
		source: "plaid",
	};
}

/** Maps a Plaid transaction payload to the dashboard DTO. */
export function mapPlaidTransaction(
	transaction: Transaction,
): DashboardTransaction {
	return {
		id: transaction.transaction_id,
		date: transaction.date,
		name: transaction.merchant_name ?? transaction.name,
		amount: transaction.amount,
		currency: transaction.iso_currency_code ?? "PLN",
	};
}

type CachedAccountRecord = {
	plaidAccountId: string;
	name: string;
	mask: string | null;
	balance: { toNumber(): number } | number;
	currency: string;
	type: string;
};

type CachedTransactionRecord = {
	plaidTransactionId: string;
	date: string;
	name: string;
	amount: { toNumber(): number } | number;
	currency: string;
};

function toNumber(value: { toNumber(): number } | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

/** Maps a cached DB account row to the dashboard DTO. */
export function mapCachedAccount(
	account: CachedAccountRecord,
): DashboardAccount {
	return {
		id: account.plaidAccountId,
		name: account.name,
		mask: account.mask ?? "****",
		balance: toNumber(account.balance),
		currency: account.currency,
		type: account.type,
		source: "plaid",
	};
}

/** Maps a cached DB transaction row to the dashboard DTO. */
export function mapCachedTransaction(
	transaction: CachedTransactionRecord,
): DashboardTransaction {
	return {
		id: transaction.plaidTransactionId,
		date: transaction.date,
		name: transaction.name,
		amount: toNumber(transaction.amount),
		currency: transaction.currency,
	};
}

/** Builds dashboard summary totals from account balances. */
export function buildAccountSummary(
	accounts: DashboardAccount[],
): DashboardSummary | null {
	if (accounts.length === 0) {
		return null;
	}

	const cashLikeAccounts = accounts.filter((account) =>
		isCashLikeAccount(account.type),
	);

	const totalAvailable = cashLikeAccounts.reduce(
		(sum, account) => sum + account.balance,
		0,
	);
	const savings = accounts
		.filter((account) => SAVINGS_ACCOUNT_TYPES.has(account.type))
		.reduce((sum, account) => sum + account.balance, 0);

	return {
		totalAvailable,
		savings,
		currency: accounts[0]?.currency ?? "PLN",
	};
}
