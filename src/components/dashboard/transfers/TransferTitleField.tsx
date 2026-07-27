import { useTranslation } from "#/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TransferTitleFieldProps = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
};

/** Transfer title input with validation styling. */
export function TransferTitleField({
	id,
	value,
	onChange,
	error,
	disabled = false,
}: TransferTitleFieldProps) {
	const t = useTranslation();

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{t("dashboard.transferForms.transferTitle")}</Label>
			<Input
				id={id}
				type="text"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
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
