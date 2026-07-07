import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/contact")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Contact",
				description: "Contact page",
				keywords: "contact, page",
				author: "Baking App",
			},
		],
	}),
});

function RouteComponent() {
	return <div>Hello "/contact"!</div>;
}
