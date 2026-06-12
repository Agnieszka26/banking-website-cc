import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/cards")({
	component: () => (
		<div className="mx-auto max-w-7xl">
			<h1 className="text-2xl font-bold">Karty</h1>
			<p className="mt-2 text-muted-foreground">Wkrótce dostępne.</p>
		</div>
	),
});
