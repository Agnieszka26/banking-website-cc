import { createFileRoute } from "@tanstack/react-router";
import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/$locale/dashboard/settings")({
	component: () => (
		<DashboardPlaceholder titleKey="dashboard.nav.settings" />
	),
});
