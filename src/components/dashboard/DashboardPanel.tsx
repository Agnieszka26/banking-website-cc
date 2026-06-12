import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardPanelProps = {
	title: string;
	children: ReactNode;
	className?: string;
	showAllLink?: boolean;
};

export function DashboardPanel({
	title,
	children,
	className,
	showAllLink = false,
}: DashboardPanelProps) {
	// TODO: Add navigation or onClick handlers to interactive buttons. Add functionality to the "Zobacz wszystkie" link button.
	return (
		<section
			className={cn(
				"flex flex-col rounded-xl border border-border bg-card shadow-sm",
				className,
			)}
		>
			<div className="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				{showAllLink && (
					<button
						type="button"
						className="flex items-center gap-0.5 text-sm font-medium text-bank-green hover:underline"
					>
						Zobacz wszystkie
						<ChevronRight className="size-4" />
					</button>
				)}
			</div>
			<div className="flex flex-1 flex-col p-5">{children}</div>
		</section>
	);
}
