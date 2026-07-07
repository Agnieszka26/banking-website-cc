import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TransferModalProps = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	className?: string;
};

/** Accessible modal shell for transfer forms. */
export function TransferModal({
	open,
	title,
	onClose,
	children,
	className,
}: TransferModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}

		if (open && !dialog.open) {
			dialog.showModal();
			return;
		}

		if (!open && dialog.open) {
			dialog.close();
		}
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className={cn(
				"fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/50 open:animate-in open:fade-in-0 open:zoom-in-95",
				className,
			)}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClose={onClose}
		>
			<div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
				<h2 className="text-lg font-semibold leading-tight">{title}</h2>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="size-4" />
				</Button>
			</div>
			<div className="px-5 py-5">{children}</div>
		</dialog>
	);
}
