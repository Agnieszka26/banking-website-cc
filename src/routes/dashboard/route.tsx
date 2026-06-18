import { useUser } from "@clerk/tanstack-react-start";
import { usePostHog } from "@posthog/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardSecurityBanner } from "#/components/dashboard/DashboardSecurityBanner";
import { DashboardSidebar } from "#/components/dashboard/DashboardSidebar";
import { getAuthUserId } from "#/server/plaid";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const userId = await getAuthUserId();

		if (!userId) {
			throw redirect({ to: "/sign-in/$" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { user } = useUser();
	const posthog = usePostHog();

	useEffect(() => {
		if (user) {
			posthog.identify(user.id, {
				email: user.primaryEmailAddress?.emailAddress,
				name: user.fullName ?? undefined,
			});
		}
	}, [user, posthog]);

	return (
		<div className="flex flex-1 bg-bank-bg">
			<DashboardSidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<Outlet />
				</div>
				<DashboardSecurityBanner />
			</div>
		</div>
	);
}
