import { useTranslation } from "#/lib/i18n";
import { Button } from "@/components/ui/button";

type TransferFormActionsProps = {
	onCancel: () => void;
	isSubmitting: boolean;
	submitLabel: string;
};

/** Cancel and submit buttons shared by transfer forms. */
export function TransferFormActions({
	onCancel,
	isSubmitting,
	submitLabel,
}: TransferFormActionsProps) {
	const t = useTranslation();

	return (
		<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onClick={onCancel}>
				{t("dashboard.transferForms.cancel")}
			</Button>
			<Button
				type="submit"
				disabled={isSubmitting}
				className="bg-bank-green text-white hover:bg-bank-green/90"
			>
				{submitLabel}
			</Button>
		</div>
	);
}
