import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { cn } from "@/lib/utils";

type RootFallbackCardProps = {
	title: string;
	description: string;
	footer: ReactNode;
	headerPrefix?: ReactNode;
	details?: ReactNode;
	cardClassName?: string;
	headerClassName?: string;
	footerClassName?: string;
	/** Announces the fallback to screen readers when it appears (e.g. errors). */
	announce?: boolean;
};

/** Shared centered card layout for root-level error and not-found fallbacks. */
export function RootFallbackCard({
	title,
	description,
	footer,
	headerPrefix,
	details,
	cardClassName,
	headerClassName,
	footerClassName,
	announce = false,
}: RootFallbackCardProps) {
	return (
		<div
			className="flex flex-1 items-center justify-center bg-bank-bg px-4 py-24"
			{...(announce ? { role: "alert" } : {})}
		>
			<Card className={cn("w-full max-w-md", cardClassName)}>
				<CardHeader className={headerClassName}>
					{headerPrefix}
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				{details ? <CardContent>{details}</CardContent> : null}
				<CardFooter className={footerClassName}>{footer}</CardFooter>
			</Card>
		</div>
	);
}
