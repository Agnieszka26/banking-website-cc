import { createFileRoute } from "@tanstack/react-router";
import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/loans")({
	component: () => <DashboardPlaceholder title="Kredyty" />,
});
