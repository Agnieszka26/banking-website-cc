import { createServerFn } from "@tanstack/react-start";
import { CountryCode, Products } from "plaid";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { plaidLinkRepository } from "#/data/repositories";
import { requireSession, requireUserId } from "#/lib/session.server";
import { mapLedgerAccountToDashboard } from "#/server/accounts/mappers";
import { getPostHogClient } from "#/utils/posthog-server";
import { invalidatePlaidCache } from "./cache";
import { plaidClient } from "./client";
import { mergeDashboardData, toDashboardUser } from "./dashboard-mappers";
import { buildAccountSummary } from "./plaid-mappers";
import { parsePublicTokenInput } from "./schemas";
import {
	loadAllTransactions,
	loadDashboardOverview,
	loadDashboardTransactions,
} from "./service";
import { syncUserPlaidData } from "./sync.service";
import type {
	DashboardData,
	DashboardOverview,
	DashboardTransactionsPayload,
} from "./types";

async function buildFallbackOverview(): Promise<DashboardOverview> {
	const session = await requireSession("unauthorized");
	const userId = session.user.id;

	const accounts = (await ledgerAccountRepository.listOwned(userId)).map(
		mapLedgerAccountToDashboard,
	);

	return {
		linked: false,
		user: toDashboardUser(session),
		accounts,
		summary: buildAccountSummary(accounts),
	};
}

function buildFallbackTransactions(
	overview: DashboardOverview,
): DashboardTransactionsPayload {
	return {
		linked: overview.linked,
		transactions: [],
	};
}

async function loadDashboardDataResilient(): Promise<DashboardData> {
	const [overviewResult, transactionsResult] = await Promise.allSettled([
		loadDashboardOverview(),
		loadDashboardTransactions(),
	]);

	if (
		overviewResult.status === "rejected" &&
		transactionsResult.status === "rejected"
	) {
		throw overviewResult.reason;
	}

	const overview =
		overviewResult.status === "fulfilled"
			? overviewResult.value
			: await buildFallbackOverview();

	const transactions =
		transactionsResult.status === "fulfilled"
			? transactionsResult.value
			: buildFallbackTransactions(overview);

	return mergeDashboardData(overview, transactions);
}

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

/** Loads linked accounts, recent transactions, and summary for the dashboard. */
export const getDashboardData = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardData> => loadDashboardDataResilient(),
);

/** Loads the full transaction list for the transactions page. */
export const getTransactions = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardTransactionsPayload> => loadAllTransactions(),
);
