import { type FormEvent, useState } from "react";
import type { TransferFormProps } from "#/components/dashboard/transfers/types";
import {
	isNonEmpty,
	isValidPolishAccountNumber,
	normalizeAccountNumber,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";
import { useTranslation } from "#/lib/i18n";
import { Button } from "@/components/ui/button";
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

			<div className="space-y-2">
				<Label htmlFor="recipient-transfer-amount">
					{t("dashboard.transferForms.amount")}
				</Label>
				<Input
					id="recipient-transfer-amount"
					type="number"
					min="0"
					step="0.01"
					inputMode="decimal"
					value={amount}
					onChange={(event) => setAmount(event.target.value)}
					aria-invalid={Boolean(errors.amount)}
					className={cn("h-10", errors.amount && "border-destructive")}
				/>
				{errors.amount && (
					<p className="text-xs text-destructive" role="alert">
						{errors.amount}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="recipient-transfer-title">
					{t("dashboard.transferForms.transferTitle")}
				</Label>
				<Input
					id="recipient-transfer-title"
					type="text"
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					aria-invalid={Boolean(errors.title)}
					className={cn("h-10", errors.title && "border-destructive")}
				/>
				{errors.title && (
					<p className="text-xs text-destructive" role="alert">
						{errors.title}
					</p>
				)}
			</div>

			<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={onCancel}>
					{t("dashboard.transferForms.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					className="bg-bank-green text-white hover:bg-bank-green/90"
				>
					{t("dashboard.transferForms.execute")}
				</Button>
			</div>
		</form>
	);
}
