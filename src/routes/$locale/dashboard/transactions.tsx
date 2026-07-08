import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "#/components/dashboard/transactions/TransactionsPage";
import {
	ACCOUNTS_CACHE_TTL_MS,
	getTransactions,
	type DashboardTransactionsPayload,
} from "#/server/plaid";

export const Route = createFileRoute("/$locale/dashboard/transactions")({
	loader: async (): Promise<DashboardTransactionsPayload> => getTransactions(),
	staleTime: ACCOUNTS_CACHE_TTL_MS,
	component: TransactionsRoute,
});

function TransactionsRoute() {
	const data = Route.useLoaderData();

	return <TransactionsPage data={data} />;
}
