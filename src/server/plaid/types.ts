/** Canonical banking DTOs for dashboard display (internal ledger + optional Plaid). */
export type DashboardAccount = {
	id: string;
	name: string;
	mask: string;
	balance: number;
	currency: string;
	type: string;
	/** Present for internal ledger accounts (application-domain IBAN). */
	iban?: string;
	source: "internal" | "plaid";
};

export type DashboardTransaction = {
	id: string;
	date: string;
	name: string;
	amount: number;
	currency: string;
};

/** Per-currency dashboard totals — never mix units across currencies. */
export type DashboardCurrencyTotal = {
	currency: string;
	totalAvailable: number;
	savings: number;
};

export type DashboardSummary = {
	byCurrency: DashboardCurrencyTotal[];
};

export type DashboardUser = {
	firstName: string;
	lastName: string;
	fullName: string;
	lastSignIn: string | null;
};

export type DashboardData = {
	linked: boolean;
	user: DashboardUser;
	accounts: DashboardAccount[];
	transactions: DashboardTransaction[];
	summary: DashboardSummary | null;
};

/** Account balances and summary (no transaction fetch). */
export type DashboardOverview = {
	linked: boolean;
	user: DashboardUser;
	accounts: DashboardAccount[];
	summary: DashboardSummary | null;
};

/** Recent transactions payload from a dedicated Plaid query. */
export type DashboardTransactionsPayload = {
	linked: boolean;
	transactions: DashboardTransaction[];
};
