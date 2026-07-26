import { type FormEvent, useState } from "react";
import { AccountSelectField } from "#/components/dashboard/transfers/AccountSelectField";
import { TransferAmountField } from "#/components/dashboard/transfers/TransferAmountField";
import { TransferFormActions } from "#/components/dashboard/transfers/TransferFormActions";
import { TransferTitleField } from "#/components/dashboard/transfers/TransferTitleField";
import type { OwnAccountTransferFormProps } from "#/components/dashboard/transfers/types";
import {
	isNonEmpty,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";
import { useTranslation } from "#/lib/i18n";

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
}: OwnAccountTransferFormProps) {
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
			nextErrors.sourceAccountId = t("dashboard.transferForms.errors.required");
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

			<TransferAmountField
				id="own-transfer-amount"
				value={amount}
				onChange={setAmount}
				error={errors.amount}
			/>

			<TransferTitleField
				id="own-transfer-title"
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
