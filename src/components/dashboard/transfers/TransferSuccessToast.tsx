import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type TransferSuccessToastProps = {
	message: string;
	onDismiss: () => void;
	durationMs?: number;
};

/** Lightweight success notice — replace with a global toast provider when added. */
export function TransferSuccessToast({
	message,
	onDismiss,
	durationMs = 4000,
}: TransferSuccessToastProps) {
	useEffect(() => {
		const timer = window.setTimeout(onDismiss, durationMs);
		return () => window.clearTimeout(timer);
	}, [durationMs, onDismiss]);

	return (
		<div
			aria-live="polite"
			aria-atomic="true"
			className={cn(
				"fixed right-4 bottom-4 z-60 flex max-w-sm items-start gap-3 rounded-xl border border-bank-green/30 bg-card px-4 py-3 shadow-lg",
				"animate-in fade-in-0 slide-in-from-bottom-2",
			)}
		>
			<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-bank-green" />
			<p className="text-sm font-medium text-foreground">{message}</p>
		</div>
	);
}
