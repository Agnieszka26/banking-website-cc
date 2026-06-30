/** Placeholder page for dashboard sections not yet implemented. */
export function DashboardPlaceholder({ title }: { title: string }) {
	return (
		<div className="mx-auto max-w-7xl">
			<h1 className="text-2xl font-bold">{title}</h1>
			<p className="mt-2 text-muted-foreground">Wkrótce dostępne.</p>
		</div>
	);
}
