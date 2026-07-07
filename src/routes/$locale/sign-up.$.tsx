import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "#/components/AuthLayout";
import SignUpForm from "#/components/SignUpForm";

export const Route = createFileRoute("/$locale/sign-up/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AuthLayout id="sign-up">
			<SignUpForm />
		</AuthLayout>
	);
}
