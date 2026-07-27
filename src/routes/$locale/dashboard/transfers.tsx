import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";
import { createFileRoute } from "@tanstack/react-router";

// TODO(transfers-list): Add a loader for the list-transfers API when available.
// `refreshCachesAfterTransfer` uses router.invalidate() so this route will
// refresh automatically once a loader is wired.
export const Route = createFileRoute("/$locale/dashboard/transfers")({
	component: () => (
		<DashboardPlaceholder titleKey="dashboard.nav.transfers" />
	),
});
