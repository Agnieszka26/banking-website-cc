import { createFileRoute, useLocation } from "@tanstack/react-router";
import { AuthLayout } from "#/components/AuthLayout";
import LoginForm from "#/components/LoginForm";

export const Route = createFileRoute("/$locale/sign-in/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const location = useLocation();
	const redirectTo =
		typeof (location.search as Record<string, unknown>).redirect === "string"
			? ((location.search as Record<string, unknown>).redirect as string)
			: undefined;

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
