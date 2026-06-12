import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section
			id="sign-in"
			className="flex items-center justify-center py-8 sm:py-12 px-4"
		>
			<SignIn fallbackRedirectUrl="/" />
		</section>
	);
}
