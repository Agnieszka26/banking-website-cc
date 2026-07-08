import { type FormEvent, useState } from "react";
import { TransferAmountField } from "#/components/dashboard/transfers/TransferAmountField";
import { TransferFormActions } from "#/components/dashboard/transfers/TransferFormActions";
import { TransferTitleField } from "#/components/dashboard/transfers/TransferTitleField";
import type { TransferFormProps } from "#/components/dashboard/transfers/types";
import {
	isNonEmpty,
	isValidPolishAccountNumber,
	normalizeAccountNumber,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";
import { useTranslation } from "#/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldErrors = {
	recipientName?: string;
	recipientAccountNumber?: string;
	amount?: string;
	title?: string;
};

export function RecipientTransferForm({
	onCancel,
	onSuccess,
}: TransferFormProps) {
	const t = useTranslation();
	const [recipientName, setRecipientName] = useState("");
	const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
	const [amount, setAmount] = useState("");
	const [title, setTitle] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validate = (): FieldErrors => {
		const nextErrors: FieldErrors = {};

		if (!isNonEmpty(recipientName)) {
			nextErrors.recipientName = t("dashboard.transferForms.errors.required");
		}

		if (!isNonEmpty(recipientAccountNumber)) {
			nextErrors.recipientAccountNumber = t(
				"dashboard.transferForms.errors.required",
			);
		} else if (!isValidPolishAccountNumber(recipientAccountNumber)) {
			nextErrors.recipientAccountNumber = t(
				"dashboard.transferForms.errors.invalidAccountNumber",
			);
		}

		if (parsePositiveAmount(amount) === null) {
			nextErrors.amount = t("dashboard.transferForms.errors.amountPositive");
		}

		if (!isNonEmpty(title)) {
			nextErrors.title = t("dashboard.transferForms.errors.required");
		}

		return nextErrors;
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate();
		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		const parsedAmount = parsePositiveAmount(amount);
		if (parsedAmount === null) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onSuccess({
				type: "recipient",
				recipientName: recipientName.trim(),
				recipientAccountNumber: normalizeAccountNumber(recipientAccountNumber),
				amount: parsedAmount,
				title: title.trim(),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="recipient-transfer-name">
					{t("dashboard.transferForms.recipientName")}
				</Label>
				<Input
					id="recipient-transfer-name"
					type="text"
					value={recipientName}
					onChange={(event) => setRecipientName(event.target.value)}
					aria-invalid={Boolean(errors.recipientName)}
					className={cn("h-10", errors.recipientName && "border-destructive")}
				/>
				{errors.recipientName && (
					<p className="text-xs text-destructive" role="alert">
						{errors.recipientName}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="recipient-transfer-account">
					{t("dashboard.transferForms.recipientAccountNumber")}
				</Label>
				<Input
					id="recipient-transfer-account"
					type="text"
					inputMode="numeric"
					autoComplete="off"
					placeholder="26 1234 5678 9012 3456 7890 1234"
					value={recipientAccountNumber}
					onChange={(event) => setRecipientAccountNumber(event.target.value)}
					aria-invalid={Boolean(errors.recipientAccountNumber)}
					className={cn(
						"h-10",
						errors.recipientAccountNumber && "border-destructive",
					)}
				/>
				{errors.recipientAccountNumber && (
					<p className="text-xs text-destructive" role="alert">
						{errors.recipientAccountNumber}
					</p>
				)}
			</div>

			<TransferAmountField
				id="recipient-transfer-amount"
				value={amount}
				onChange={setAmount}
				error={errors.amount}
			/>

			<TransferTitleField
				id="recipient-transfer-title"
				value={title}
				onChange={setTitle}
				error={errors.title}
			/>

			<TransferFormActions
				onCancel={onCancel}
				isSubmitting={isSubmitting}
				submitLabel={t("dashboard.transferForms.execute")}
			/>
		</form>
	);
}
