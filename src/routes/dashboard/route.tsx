import { usePostHog } from "@posthog/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardSecurityBanner } from "#/components/dashboard/DashboardSecurityBanner";
import { DashboardSidebar } from "#/components/dashboard/DashboardSidebar";
import { getSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const session = await getSession();

		if (!session) {
			throw redirect({ to: "/sign-in/$" });
		}

		return {
			user: {
				id: session.user.id,
				name: session.user.name || session.user.username || "Użytkownik",
				email: session.user.email,
			},
		};
	},
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
