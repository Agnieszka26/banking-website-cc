import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/loans")({
	component: () => (
		<div className="mx-auto max-w-7xl">
			<h1 className="text-2xl font-bold">Kredyty</h1>
			<p className="mt-2 text-muted-foreground">Wkrótce dostępne.</p>
		</div>
	),
});
