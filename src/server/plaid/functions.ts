import { createServerFn } from "@tanstack/react-start";
import { CountryCode, Products } from "plaid";
import { plaidLinkRepository } from "#/data/repositories";
import { requireUserId } from "#/lib/session";
import { getPostHogClient } from "#/utils/posthog-server";
import { invalidatePlaidCache } from "./cache";
import { plaidClient } from "./client";
import { parsePublicTokenInput } from "./schemas";
import {
	loadDashboardOverview,
	loadDashboardTransactions,
	mergeDashboardData,
} from "./service";
import { syncUserPlaidData } from "./sync.service";
import type { DashboardData } from "./types";

/** Creates a Plaid Link token for the authenticated user. */
export const createLinkToken = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = await requireUserId("unauthorized");

		const response = await plaidClient
			.linkTokenCreate({
				user: { client_user_id: userId },
				client_name: "TanStack Bank App",
				products: [Products.Transactions],
				country_codes: [CountryCode.Pl, CountryCode.Us],
				language: "pl",
			})
			.catch((error) => {
				throw new Error(
					`Failed to create link token: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			});

		return { linkToken: response.data.link_token };
	},
);

/** Exchanges a Plaid public token and stores the access token for the user. */
export const exchangePublicToken = createServerFn({ method: "POST" })
	.validator(parsePublicTokenInput)
	.handler(async ({ data }) => {
		const userId = await requireUserId("unauthorized");

		const response = await plaidClient
			.itemPublicTokenExchange({
				public_token: data.publicToken,
			})
			.catch((error) => {
				throw new Error(
					`Failed to exchange public token: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			});

		await plaidLinkRepository
			.saveAccessToken(
				userId,
				response.data.access_token,
				response.data.item_id,
			)
			.catch((error) => {
				throw new Error(
					`Failed to store access token: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			});

		invalidatePlaidCache(userId);

		try {
			await syncUserPlaidData(userId, "all");
		} catch (error) {
			console.error(
				`Initial Plaid sync failed for user ${userId}:`,
				error instanceof Error ? error.message : error,
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

/** Loads account balances and summary without fetching transactions. */
export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
	async () => loadDashboardOverview(),
);

/** Loads recent transactions without fetching account balances. */
export const getDashboardTransactions = createServerFn({
	method: "GET",
}).handler(async () => loadDashboardTransactions());

/** Loads linked accounts, recent transactions, and summary for the dashboard. */
export const getDashboardData = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardData> => {
		const [overview, transactions] = await Promise.all([
			loadDashboardOverview(),
			loadDashboardTransactions(),
		]);

		return mergeDashboardData(overview, transactions);
	},
);

/** Forces a Plaid → Postgres sync for the authenticated user (cron/webhook-ready entry point). */
export const refreshPlaidSync = createServerFn({ method: "POST" }).handler(
	async () => {
		const userId = await requireUserId("unauthorized");
		invalidatePlaidCache(userId);
		await syncUserPlaidData(userId, "all");
		return { synced: true };
	},
);
