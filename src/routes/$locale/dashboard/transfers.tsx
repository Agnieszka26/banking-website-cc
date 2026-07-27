import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";
import { createFileRoute } from "@tanstack/react-router";

/**
 * No GET `/api/transfers` in the API contract — only POST create.
 * App-created transfer legs are listed via GET ledger transactions on
 * `/$locale/dashboard/transactions` (`type: "transfer"`, `transferId`).
 */
export const Route = createFileRoute("/$locale/dashboard/transfers")({
	component: () => (
		<DashboardPlaceholder titleKey="dashboard.nav.transfers" />
	),
});
