import { createFileRoute } from "@tanstack/react-router";
import { DashboardPlaceholder } from "#/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/$locale/dashboard/cards")({
	component: () => <DashboardPlaceholder title="Karty" />,
});
