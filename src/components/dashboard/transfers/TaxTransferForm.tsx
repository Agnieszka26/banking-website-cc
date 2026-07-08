import { type FormEvent, useState } from "react";
import { TransferAmountField } from "#/components/dashboard/transfers/TransferAmountField";
import { TransferFormActions } from "#/components/dashboard/transfers/TransferFormActions";
import type {
	TaxPaymentType,
	TransferFormProps,
} from "#/components/dashboard/transfers/types";
import {
	isNonEmpty,
	isValidPolishAccountNumber,
	normalizeAccountNumber,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";
import { useTranslation } from "#/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FieldErrors = {
	paymentType?: string;
	accountNumber?: string;
	amount?: string;
	paymentId?: string;
};

const PAYMENT_TYPES: TaxPaymentType[] = ["zus", "tax_office"];

export function TaxTransferForm({ onCancel, onSuccess }: TransferFormProps) {
	const t = useTranslation();
	const [paymentType, setPaymentType] = useState<TaxPaymentType | "">("");
	const [accountNumber, setAccountNumber] = useState("");
	const [amount, setAmount] = useState("");
	const [paymentId, setPaymentId] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validate = (): FieldErrors => {
		const nextErrors: FieldErrors = {};

		if (!paymentType) {
			nextErrors.paymentType = t("dashboard.transferForms.errors.required");
		}

		if (!isNonEmpty(accountNumber)) {
			nextErrors.accountNumber = t("dashboard.transferForms.errors.required");
		} else if (!isValidPolishAccountNumber(accountNumber)) {
			nextErrors.accountNumber = t(
				"dashboard.transferForms.errors.invalidAccountNumber",
			);
		}

		if (parsePositiveAmount(amount) === null) {
			nextErrors.amount = t("dashboard.transferForms.errors.amountPositive");
		}

		if (!isNonEmpty(paymentId)) {
			nextErrors.paymentId = t("dashboard.transferForms.errors.required");
		}

		return nextErrors;
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate();
		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0 || !paymentType) {
			return;
		}

		const parsedAmount = parsePositiveAmount(amount);
		if (parsedAmount === null) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onSuccess({
				type: "tax",
				paymentType,
				accountNumber: normalizeAccountNumber(accountNumber),
				amount: parsedAmount,
				paymentId: paymentId.trim(),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="tax-transfer-type">
					{t("dashboard.transferForms.paymentType")}
				</Label>
				<Select
					value={paymentType || null}
					onValueChange={(value) =>
						setPaymentType((value as TaxPaymentType | null) ?? "")
					}
				>
					<SelectTrigger
						id="tax-transfer-type"
						className={cn("w-full", errors.paymentType && "border-destructive")}
						aria-invalid={Boolean(errors.paymentType)}
					>
						<SelectValue
							placeholder={t("dashboard.transferForms.selectPaymentType")}
						/>
					</SelectTrigger>
					<SelectContent>
						{PAYMENT_TYPES.map((type) => (
							<SelectItem key={type} value={type}>
								{type === "zus"
									? t("dashboard.transferForms.paymentTypeZus")
									: t("dashboard.transferForms.paymentTypeTaxOffice")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.paymentType && (
					<p className="text-xs text-destructive" role="alert">
						{errors.paymentType}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="tax-transfer-account">
					{t("dashboard.transferForms.accountNumber")}
				</Label>
				<Input
					id="tax-transfer-account"
					type="text"
					inputMode="numeric"
					autoComplete="off"
					value={accountNumber}
					onChange={(event) => setAccountNumber(event.target.value)}
					aria-invalid={Boolean(errors.accountNumber)}
					className={cn("h-10", errors.accountNumber && "border-destructive")}
				/>
				{errors.accountNumber && (
					<p className="text-xs text-destructive" role="alert">
						{errors.accountNumber}
					</p>
				)}
			</div>

			<TransferAmountField
				id="tax-transfer-amount"
				value={amount}
				onChange={setAmount}
				error={errors.amount}
			/>

			<div className="space-y-2">
				<Label htmlFor="tax-transfer-payment-id">
					{t("dashboard.transferForms.paymentId")}
				</Label>
				<Input
					id="tax-transfer-payment-id"
					type="text"
					value={paymentId}
					onChange={(event) => setPaymentId(event.target.value)}
					aria-invalid={Boolean(errors.paymentId)}
					className={cn("h-10", errors.paymentId && "border-destructive")}
				/>
				{errors.paymentId && (
					<p className="text-xs text-destructive" role="alert">
						{errors.paymentId}
					</p>
				)}
			</div>

			<TransferFormActions
				onCancel={onCancel}
				isSubmitting={isSubmitting}
				submitLabel={t("dashboard.transferForms.makeTransfer")}
			/>
		</form>
	);
}
