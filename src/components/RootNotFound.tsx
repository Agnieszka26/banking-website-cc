import { Link, type NotFoundRouteProps } from "@tanstack/react-router";
import { RootFallbackCard } from "#/components/RootFallbackCard";
import { buttonVariants } from "#/components/ui/button";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import { cn } from "@/lib/utils";

type RootNotFoundProps = Pick<NotFoundRouteProps, "routeId">;

/** Root-level fallback when a route or resource is not found. */
export function RootNotFound({ routeId }: RootNotFoundProps) {
	const t = useTranslation();
	const localize = useLocalizedPath();

	return (
		<RootFallbackCard
			cardClassName="text-center"
			headerClassName="items-center"
			headerPrefix={
				<p className="text-6xl font-bold tracking-tight text-muted-foreground">
					404
				</p>
			}
			title={t("errors.notFoundTitle")}
			description={t("errors.notFoundDescription")}
			details={
				import.meta.env.DEV && routeId ? (
					<p className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
						{routeId}
					</p>
				) : undefined
			}
			footer={
				<Link
					to={localize("/")}
					className={cn(buttonVariants({ variant: "default" }))}
				>
					{t("buttons.backToHome")}
				</Link>
			}
			footerClassName="justify-center"
		/>
	);
}
