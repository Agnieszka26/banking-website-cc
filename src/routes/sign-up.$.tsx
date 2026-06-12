import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "#/components/AuthLayout";

export const Route = createFileRoute("/sign-up/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AuthLayout id="sign-up">
			<SignUp fallbackRedirectUrl="/dashboard" />
		</AuthLayout>
	);
}
