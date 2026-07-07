import { Link, type NotFoundRouteProps } from "@tanstack/react-router";
import { RootFallbackCard } from "#/components/RootFallbackCard";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "@/lib/utils";

type RootNotFoundProps = Pick<NotFoundRouteProps, "routeId">;

/** Root-level fallback when a route or resource is not found. */
export function RootNotFound({ routeId }: RootNotFoundProps) {
	return (
		<RootFallbackCard
			cardClassName="text-center"
			headerClassName="items-center"
			headerPrefix={
				<p className="text-6xl font-bold tracking-tight text-muted-foreground">
					404
				</p>
			}
			title="Nie znaleziono strony"
			description="Adres może być nieprawidłowy lub strona została przeniesiona."
			details={
				import.meta.env.DEV && routeId ? (
					<p className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
						{routeId}
					</p>
				) : undefined
			}
			footer={
				<Link to="/" className={cn(buttonVariants({ variant: "default" }))}>
					Strona główna
				</Link>
			}
			footerClassName="justify-center"
		/>
	);
}
