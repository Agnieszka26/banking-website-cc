import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section
			id="sign-up"
			className="flex items-center justify-center py-8 sm:py-12 px-4"
		>
			<SignUp fallbackRedirectUrl="/dashboard" />
		</section>
	);
}
