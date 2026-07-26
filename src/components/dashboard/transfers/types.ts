import type { DashboardAccount } from "#/server/plaid";
import type { AccountDto } from "#/shared/types";

export type TransferType = "own" | "recipient" | "tax";

export type TaxPaymentType = "zus" | "tax_office";

/** Ledger account option for own-account transfers (internal account ids). */
export type TransferAccountOption = Pick<
	AccountDto,
	"id" | "name" | "currency" | "balanceMinor"
>;

export type OwnAccountTransferPayload = {
	type: "own";
	sourceAccountId: string;
	destinationAccountId: string;
	amount: number;
	currency: string;
	title: string;
};

export type RecipientTransferPayload = {
	type: "recipient";
	recipientName: string;
	recipientAccountNumber: string;
	amount: number;
	title: string;
};

export type TaxTransferPayload = {
	type: "tax";
	paymentType: TaxPaymentType;
	accountNumber: string;
	amount: number;
	paymentId: string;
};

export type TransferPayload =
	| OwnAccountTransferPayload
	| RecipientTransferPayload
	| TaxTransferPayload;

export type TransferFormProps = {
	accounts: DashboardAccount[];
	onCancel: () => void;
	onSuccess: (payload: TransferPayload) => void | Promise<void>;
};

export type OwnAccountTransferFormProps = {
	accounts: TransferAccountOption[];
	onCancel: () => void;
	onSuccess: (payload: OwnAccountTransferPayload) => void | Promise<void>;
};
