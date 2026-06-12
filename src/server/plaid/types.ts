export type DashboardAccount = {
	id: string;
	name: string;
	mask: string;
	balance: number;
	currency: string;
	type: string;
};

export type DashboardTransaction = {
	id: string;
	date: string;
	name: string;
	amount: number;
	currency: string;
};

export type DashboardSummary = {
	totalAvailable: number;
	savings: number;
	currency: string;
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
