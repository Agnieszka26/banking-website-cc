import { type FormEvent, useState } from "react";
import { AccountSelectField } from "#/components/dashboard/transfers/AccountSelectField";
import type { TransferFormProps } from "#/components/dashboard/transfers/types";
import {
	isNonEmpty,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";
import { useTranslation } from "#/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldErrors = {
	sourceAccountId?: string;
	destinationAccountId?: string;
	amount?: string;
	title?: string;
	form?: string;
};

export function OwnAccountTransferForm({
	accounts,
	onCancel,
	onSuccess,
}: TransferFormProps) {
	const t = useTranslation();
	const [sourceAccountId, setSourceAccountId] = useState("");
	const [destinationAccountId, setDestinationAccountId] = useState("");
	const [amount, setAmount] = useState("");
	const [title, setTitle] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validate = (): FieldErrors => {
		const nextErrors: FieldErrors = {};

		if (!isNonEmpty(sourceAccountId)) {
			nextErrors.sourceAccountId = t(
				"dashboard.transferForms.errors.required",
			);
		}

		if (!isNonEmpty(destinationAccountId)) {
			nextErrors.destinationAccountId = t(
				"dashboard.transferForms.errors.required",
			);
		}

		if (
			sourceAccountId &&
			destinationAccountId &&
			sourceAccountId === destinationAccountId
		) {
			nextErrors.destinationAccountId = t(
				"dashboard.transferForms.errors.sameAccounts",
			);
		}

		if (parsePositiveAmount(amount) === null) {
			nextErrors.amount = t("dashboard.transferForms.errors.amountPositive");
		}

		if (!isNonEmpty(title)) {
			nextErrors.title = t("dashboard.transferForms.errors.required");
		}

		if (accounts.length < 2) {
			nextErrors.form = t("dashboard.transferForms.errors.needTwoAccounts");
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
				type: "own",
				sourceAccountId,
				destinationAccountId,
				amount: parsedAmount,
				title: title.trim(),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{errors.form && (
				<p className="text-sm text-destructive" role="alert">
					{errors.form}
				</p>
			)}

			<AccountSelectField
				id="own-transfer-source"
				label={t("dashboard.transferForms.sourceAccount")}
				value={sourceAccountId}
				placeholder={t("dashboard.transferForms.selectAccount")}
				accounts={accounts}
				onChange={setSourceAccountId}
				error={errors.sourceAccountId}
			/>

			<AccountSelectField
				id="own-transfer-destination"
				label={t("dashboard.transferForms.destinationAccount")}
				value={destinationAccountId}
				placeholder={t("dashboard.transferForms.selectAccount")}
				accounts={accounts}
				onChange={setDestinationAccountId}
				error={errors.destinationAccountId}
			/>

			<div className="space-y-2">
				<Label htmlFor="own-transfer-amount">
					{t("dashboard.transferForms.amount")}
				</Label>
				<Input
					id="own-transfer-amount"
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
				<Label htmlFor="own-transfer-title">
					{t("dashboard.transferForms.transferTitle")}
				</Label>
				<Input
					id="own-transfer-title"
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
