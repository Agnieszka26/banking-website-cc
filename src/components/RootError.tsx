import { Link } from "@tanstack/react-router";
import { RootFallbackCard } from "#/components/RootFallbackCard";
import { Button, buttonVariants } from "#/components/ui/button";
import { cn } from "@/lib/utils";

type RootErrorProps = {
	error: Error;
	reset: () => void;
};

/** Root-level fallback when a route throws during render or data loading. */
export function RootError({ error, reset }: RootErrorProps) {
	return (
		<RootFallbackCard
			announce
			title="Coś poszło nie tak"
			description="Nie udało się załadować strony. Spróbuj ponownie lub wróć na stronę główną."
			details={
				import.meta.env.DEV && error.message ? (
					<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
						{error.message}
					</p>
				) : undefined
			}
			footer={
				<>
					<Button type="button" onClick={reset}>
						Spróbuj ponownie
					</Button>
					<Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
						Strona główna
					</Link>
				</>
			}
			footerClassName="flex flex-wrap gap-2"
		/>
	);
}
