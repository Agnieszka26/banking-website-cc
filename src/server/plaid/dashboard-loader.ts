import "@tanstack/react-start/server-only";
import { requireSession } from "#/lib/session";
import { mergeDashboardData, toDashboardUser } from "#/server/plaid/dashboard-mappers";import {
	loadDashboardOverview,
	loadDashboardTransactions,
} from "#/server/plaid/service";
import type {
	DashboardData,
	DashboardOverview,
	DashboardTransactionsPayload,
} from "#/server/plaid/types";

async function buildFallbackOverview(): Promise<DashboardOverview> {
	const session = await requireSession("unauthorized");
	return {
		linked: false,
		user: toDashboardUser(session),
		accounts: [],
		summary: null,
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

/** Loads dashboard data, returning partial results when one upstream call fails. */
export async function loadDashboardDataResilient(): Promise<DashboardData> {
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
