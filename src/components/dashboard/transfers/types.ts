import type { DashboardAccount } from "#/server/plaid";

export type TransferType = "own" | "recipient" | "tax";

export type TaxPaymentType = "zus" | "tax_office";

export type OwnAccountTransferPayload = {
	type: "own";
	sourceAccountId: string;
	destinationAccountId: string;
	amount: number;
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
