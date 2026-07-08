import { useTranslation } from "#/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TransferAmountFieldProps = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

/** Transfer amount input with validation styling. */
export function TransferAmountField({
	id,
	value,
	onChange,
	error,
}: TransferAmountFieldProps) {
	const t = useTranslation();

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{t("dashboard.transferForms.amount")}</Label>
			<Input
				id={id}
				type="number"
				min="0"
				step="0.01"
				inputMode="decimal"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				aria-invalid={Boolean(error)}
				className={cn("h-10", error && "border-destructive")}
			/>
			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
