import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "#/lib/i18n";
import { cn } from "@/lib/utils";

type DashboardPanelProps = {
	title: string;
	children: ReactNode;
	className?: string;
	showAllLink?: boolean;
	showAllTo?: string;
};

/** Card-style panel used on dashboard home sections. */
export function DashboardPanel({
	title,
	children,
	className,
	showAllLink = false,
	showAllTo,
}: DashboardPanelProps) {
	const t = useTranslation();

	const showAllClassName =
		"flex items-center gap-0.5 text-sm font-medium text-bank-green hover:underline";

	return (
		<section
			className={cn(
				"flex flex-col rounded-xl border border-border bg-card shadow-sm",
				className,
			)}
		>
			<div className="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				{showAllLink &&
					(showAllTo ? (
						<Link to={showAllTo} className={showAllClassName}>
							{t("dashboard.panels.showAll")}
							<ChevronRight className="size-4" />
						</Link>
					) : (
						<button type="button" className={showAllClassName}>
							{t("dashboard.panels.showAll")}
							<ChevronRight className="size-4" />
						</button>
					))}
			</div>
			<div className="flex flex-1 flex-col p-5">{children}</div>
		</section>
	);
}
