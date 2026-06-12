import { createFileRoute } from "@tanstack/react-router";
import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/accounts")({
	component: () => <DashboardPlaceholder title="Rachunki" />,
});
