import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "#/components/AuthLayout";

export const Route = createFileRoute("/sign-in/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AuthLayout id="sign-in">
			<SignIn fallbackRedirectUrl="/dashboard" />
		</AuthLayout>
	);
}
