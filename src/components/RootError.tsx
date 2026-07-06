import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { cn } from "@/lib/utils";

type RootErrorProps = {
	error: Error;
	reset: () => void;
};

/** Root-level fallback when a route throws during render or data loading. */
export function RootError({ error, reset }: RootErrorProps) {
	return (
		<div className="flex flex-1 items-center justify-center bg-bank-bg px-4 py-24">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Coś poszło nie tak</CardTitle>
					<CardDescription>
						Nie udało się załadować strony. Spróbuj ponownie lub wróć na
						stronę główną.
					</CardDescription>
				</CardHeader>
				{import.meta.env.DEV && error.message ? (
					<CardContent>
						<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
							{error.message}
						</p>
					</CardContent>
				) : null}
				<CardFooter className="flex flex-wrap gap-2">
					<Button type="button" onClick={reset}>
						Spróbuj ponownie
					</Button>
					<Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
						Strona główna
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
