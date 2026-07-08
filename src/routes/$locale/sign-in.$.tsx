import { createFileRoute, useLocation } from "@tanstack/react-router";
import { AuthLayout } from "#/components/AuthLayout";
import LoginForm from "#/components/LoginForm";

export const Route = createFileRoute("/$locale/sign-in/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const location = useLocation();
	const search = location.search as Record<string, unknown>;
	const redirectTo = typeof search.redirect === "string" ? search.redirect : undefined;


	return (
		<AuthLayout id="sign-in">
			<LoginForm
				redirectTo={redirectTo}
				source="sign-in"
				idPrefix="sign-in"
				className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm"
				showSignUpLink
			/>
		</AuthLayout>
	);
}
