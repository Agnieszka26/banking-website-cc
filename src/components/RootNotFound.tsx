import { Link, type NotFoundRouteProps } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { cn } from "@/lib/utils";

type RootNotFoundProps = Pick<NotFoundRouteProps, "routeId">;

/** Root-level fallback when a route or resource is not found. */
export function RootNotFound({ routeId }: RootNotFoundProps) {
	return (
		<div className="flex flex-1 items-center justify-center bg-bank-bg px-4 py-24">
			<Card className="w-full max-w-md text-center">
				<CardHeader className="items-center">
					<p className="text-6xl font-bold tracking-tight text-muted-foreground">
						404
					</p>
					<CardTitle>Nie znaleziono strony</CardTitle>
					<CardDescription>
						Adres może być nieprawidłowy lub strona została przeniesiona.
					</CardDescription>
				</CardHeader>
				{import.meta.env.DEV && routeId ? (
					<CardContent>
						<p className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
							{routeId}
						</p>
					</CardContent>
				) : null}
				<CardFooter className="justify-center">
					<Link to="/" className={cn(buttonVariants({ variant: "default" }))}>
						Strona główna
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
