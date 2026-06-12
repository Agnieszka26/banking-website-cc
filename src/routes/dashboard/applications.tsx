import { createFileRoute } from "@tanstack/react-router";
import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/applications")({
	component: () => (
		<DashboardPlaceholder title="Wnioski i dyspozycje" />
	),
});
