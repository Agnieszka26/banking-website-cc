import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "#/components/dashboard/transactions/TransactionsPage";
import { loadTransactionsPageData } from "#/lib/load-transactions-page";
import type { TransactionsPageData } from "#/lib/transaction-list-model";
import { ACCOUNTS_CACHE_TTL_MS } from "#/server/plaid";

export const Route = createFileRoute("/$locale/dashboard/transactions")({
	loader: async (): Promise<TransactionsPageData> => loadTransactionsPageData(),
	staleTime: ACCOUNTS_CACHE_TTL_MS,
	component: TransactionsRoute,
});

function TransactionsRoute() {
	const data = Route.useLoaderData();

	return <TransactionsPage data={data} />;
}
