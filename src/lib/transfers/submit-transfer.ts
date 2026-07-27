import type { TransferPayload } from "#/components/dashboard/transfers/types";
import type {
	CreateTransferResult,
	TransferErrorCode,
} from "#/server/transfers/functions";
import { createTransfer, listLedgerAccounts } from "#/server/transfers/functions";
import type { TransferDto } from "#/shared/types";

export type { CreateTransferResult, TransferErrorCode };

export type SubmitTransferResult =
	| { ok: true; data: TransferDto }
	| { ok: false; error: { code: TransferErrorCode; message?: string } };

/** Converts major-unit form amounts to integer minor units. */
export function toAmountMinor(amount: number): number {
	return Math.round(amount * 100);
}

/**
 * Submits a transfer through the real server boundary.
 * Own-account uses destinationAccountId; recipient uses destinationIban.
 */
export async function submitTransfer(
	payload: TransferPayload,
): Promise<SubmitTransferResult> {
	if (payload.type === "tax") {
		return {
			ok: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Tax transfers are not supported by the ledger transfer API.",
			},
		};
	}

	const amountMinor = toAmountMinor(payload.amount);
	if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
		return {
			ok: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Amount must be a positive value.",
			},
		};
	}

	try {
		if (payload.type === "own") {
			const result: CreateTransferResult = await createTransfer({
				data: {
					sourceAccountId: payload.sourceAccountId,
					destinationAccountId: payload.destinationAccountId,
					amountMinor,
					currency: payload.currency,
					title: payload.title,
				},
			});
			return result;
		}

		// Recipient: resolve the sender's primary ledger account, then transfer by IBAN.
		const accounts = await listLedgerAccounts();
		const source = accounts[0];
		if (!source) {
			return {
				ok: false,
				error: {
					code: "ACCOUNT_NOT_FOUND",
					message: "No internal account found for the current user.",
				},
			};
		}

		const result: CreateTransferResult = await createTransfer({
			data: {
				sourceAccountId: source.id,
				destinationIban: payload.recipientAccountNumber,
				amountMinor,
				currency: source.currency,
				title: payload.title,
				counterpartyName: payload.recipientName,
			},
		});
		return result;
	} catch {
		return {
			ok: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "An unexpected error occurred.",
			},
		};
	}
}
