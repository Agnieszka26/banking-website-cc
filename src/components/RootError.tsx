import { Link } from "@tanstack/react-router";
import { RootFallbackCard } from "#/components/RootFallbackCard";
import { Button, buttonVariants } from "#/components/ui/button";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import { cn } from "@/lib/utils";

type RootErrorProps = {
	error: Error;
	reset: () => void;
};

/** Root-level fallback when a route throws during render or data loading. */
export function RootError({ error, reset }: RootErrorProps) {
	const t = useTranslation();
	const localize = useLocalizedPath();

	return (
		<RootFallbackCard
			announce
			title={t("errors.rootErrorTitle")}
			description={t("errors.rootErrorDescription")}
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
						{t("buttons.tryAgain")}
					</Button>
					<Link
						to={localize("/")}
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						{t("buttons.backToHome")}
					</Link>
				</>
			}
			footerClassName="flex flex-wrap gap-2"
		/>
	);
}
