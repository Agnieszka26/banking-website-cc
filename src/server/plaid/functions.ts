import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { CountryCode, Products } from "plaid";
import { getPostHogClient } from "#/utils/posthog-server";
import { requireUserId } from "./auth";
import { plaidClient } from "./client";
import { getDateRange } from "./format";
import { getPlaidAccessToken, setPlaidAccessToken } from "./storage";
import type { DashboardData } from "./types";

async function getDashboardUser(userId: string) {
	const user = await clerkClient().users.getUser(userId);
	const firstName = user.firstName ?? "";
	const lastName = user.lastName ?? "";

	return {
		firstName,
		lastName,
		fullName: [firstName, lastName].filter(Boolean).join(" ") || "Użytkowniku",
		lastSignIn: user.lastSignInAt
			? new Date(user.lastSignInAt).toLocaleString("pl-PL", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})
			: null,
	};
}

export const getAuthUserId = createServerFn({ method: "GET" }).handler(
	async () => {
		const { userId } = await auth();
		return userId;
	},
);

export const createLinkToken = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = await requireUserId();

		let response;
		try {
			response = await plaidClient.linkTokenCreate({
				user: { client_user_id: userId },
				client_name: "TanStack Bank App",
				products: [Products.Transactions],
				country_codes: [CountryCode.Pl, CountryCode.Us],
				language: "pl",
			});
		} catch (error) {
			throw new Error(
				`Failed to create link token: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return { linkToken: response.data.link_token };
	},
);

export const exchangePublicToken = createServerFn({ method: "POST" })
	.validator((data: { publicToken: string }) => {
		if (
			!data.publicToken ||
			typeof data.publicToken !== "string" ||
			data.publicToken.trim().length === 0
		) {
			throw new Error("Invalid public token");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const userId = await requireUserId();

		let response;
		try {
			response = await plaidClient.itemPublicTokenExchange({
				public_token: data.publicToken,
			});
		} catch (error) {
			throw new Error(
				`Failed to exchange public token: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		try {
			await setPlaidAccessToken(userId, response.data.access_token);
		} catch (error) {
			throw new Error(
				`Failed to store access token: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: userId,
			event: "bank_account_token_exchanged",
			properties: {
				source: "server",
			},
		});

		return { linked: true };
	});

export const getDashboardData = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardData> => {
		const userId = await requireUserId();
		const user = await getDashboardUser(userId);
		const accessToken = await getPlaidAccessToken(userId);

		if (!accessToken) {
			return {
				linked: false,
				user,
				accounts: [],
				transactions: [],
				summary: null,
			};
		}

		const { startDate, endDate } = getDateRange(30);

		let accountsResponse, transactionsResponse;
		try {
			[accountsResponse, transactionsResponse] = await Promise.all([
				plaidClient.accountsBalanceGet({ access_token: accessToken }),
				plaidClient.transactionsGet({
					access_token: accessToken,
					start_date: startDate,
					end_date: endDate,
				}),
			]);
		} catch (error) {
			throw new Error(
				`Failed to fetch dashboard data from Plaid: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		const accounts = accountsResponse.data.accounts.map((account) => ({
			id: account.account_id,
			name: account.name,
			mask: account.mask ?? "****",
			balance: account.balances.current ?? account.balances.available ?? 0,
			currency: account.balances.iso_currency_code ?? "PLN",
			type: account.subtype ?? account.type,
		}));
		const MAX_RECENT_TRANSACTIONS = 8;
		const transactions = transactionsResponse.data.transactions
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, MAX_RECENT_TRANSACTIONS)
			.map((transaction) => ({
				id: transaction.transaction_id,
				date: transaction.date,
				name: transaction.merchant_name ?? transaction.name,
				amount: transaction.amount,
				currency: transaction.iso_currency_code ?? "PLN",
			}));

		const primaryCurrency = accounts[0]?.currency ?? "PLN";
		const totalAvailable = accounts.reduce(
			(sum, account) => sum + account.balance,
			0,
		);
		const savings = accounts
			.filter((account) =>
				["savings", "cd", "money market"].includes(account.type),
			)
			.reduce((sum, account) => sum + account.balance, 0);

		return {
			linked: true,
			user,
			accounts,
			transactions,
			summary: {
				totalAvailable,
				savings,
				currency: primaryCurrency,
			},
		};
	},
);
