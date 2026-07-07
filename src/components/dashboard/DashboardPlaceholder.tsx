import { useTranslation } from "#/lib/i18n";

type DashboardPlaceholderProps = {
	titleKey: string;
};

/** Placeholder page for dashboard sections not yet implemented. */
export function DashboardPlaceholder({ titleKey }: DashboardPlaceholderProps) {
	const t = useTranslation();

	return (
		<div className="mx-auto max-w-7xl">
			<h1 className="text-2xl font-bold">{t(titleKey)}</h1>
			<p className="mt-2 text-muted-foreground">
				{t("dashboard.empty.comingSoon")}
			</p>
		</div>
	);
}
