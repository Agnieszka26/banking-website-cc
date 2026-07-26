import type { TransferPayload } from "#/components/dashboard/transfers/types";
import type {
	CreateTransferResult,
	TransferErrorCode,
} from "#/server/transfers/functions";
import { createTransfer } from "#/server/transfers/functions";
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
 * Only own-account transfers are supported by the ledger transfer API.
 */
export async function submitTransfer(
	payload: TransferPayload,
): Promise<SubmitTransferResult> {
	if (payload.type !== "own") {
		return {
			ok: false,
			error: {
				code: "VALIDATION_ERROR",
				message:
					"Only own-account transfers are supported by the ledger transfer API.",
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
