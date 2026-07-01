import { usePostHog } from "@posthog/react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthCheckPending } from "#/components/AuthCheckPending";
import { DashboardSecurityBanner } from "#/components/dashboard/DashboardSecurityBanner";
import { DashboardSidebar } from "#/components/dashboard/DashboardSidebar";
import { requireAuthenticatedUser } from "#/lib/auth-guard";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location }) => {
		const user = await requireAuthenticatedUser(location);
		return { user };
	},
	pendingComponent: AuthCheckPending,
	pendingMs: 0,
	component: RouteComponent,
});

function RouteComponent() {
	const { user } = Route.useRouteContext();
	const posthog = usePostHog();

	useEffect(() => {
		if (user) {
			posthog.identify(user.id, {
				email: user.email,
				name: user.name,
			});
		}
	}, [user, posthog]);

	return (
		<div className="flex flex-1 bg-bank-bg">
			<DashboardSidebar userName={user?.name ?? "Użytkownik"} />
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<Outlet />
				</div>
				<DashboardSecurityBanner />
			</div>
		</div>
	);
}
