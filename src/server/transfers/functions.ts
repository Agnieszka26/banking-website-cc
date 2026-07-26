import { createServerFn } from "@tanstack/react-start";
import { isAppError } from "#/lib/errors";
import { log } from "#/lib/logger";
import { CreateTransferRequestSchema } from "#/shared/schemas";
import type { AccountDto, ApiErrorCode, TransferDto } from "#/shared/types";
import { createOwnAccountTransfer, listLedgerAccountsForUser } from "./service";

/** Client-facing transfer error codes (aligned with docs/API_CONTRACTS.md). */
export type TransferErrorCode = Extract<
	ApiErrorCode,
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "INSUFFICIENT_FUNDS"
	| "ACCOUNT_NOT_FOUND"
	| "VALIDATION_ERROR"
	| "INTERNAL_ERROR"
>;

export type CreateTransferResult =
	| { ok: true; data: TransferDto }
	| { ok: false; error: { code: TransferErrorCode; message?: string } };

function toTransferErrorCode(code: ApiErrorCode): TransferErrorCode {
	switch (code) {
		case "UNAUTHORIZED":
		case "FORBIDDEN":
		case "INSUFFICIENT_FUNDS":
		case "ACCOUNT_NOT_FOUND":
		case "VALIDATION_ERROR":
		case "INTERNAL_ERROR":
			return code;
		default:
			return "INTERNAL_ERROR";
	}
}

function failure(
	code: TransferErrorCode,
	message: string,
): CreateTransferResult {
	return { ok: false, error: { code, message } };
}

/** Lists ledger accounts for own-account transfer UI. */
export const listLedgerAccounts = createServerFn({ method: "GET" }).handler(
	async (): Promise<AccountDto[]> => listLedgerAccountsForUser(),
);

/**
 * Creates an own-account transfer.
 * Returns a typed Result so the client can switch on `error.code`.
 */
export const createTransfer = createServerFn({ method: "POST" })
	.validator((data: unknown) => data)
	.handler(async ({ data }): Promise<CreateTransferResult> => {
		const parsed = CreateTransferRequestSchema.safeParse(data);
		if (!parsed.success) {
			log("warn", "transfer.create.failed", {
				operation: "create",
				errorCategory: "VALIDATION_ERROR",
			});
			return failure("VALIDATION_ERROR", "Request body failed validation.");
		}

		try {
			const transfer = await createOwnAccountTransfer(parsed.data);
			return { ok: true, data: transfer };
		} catch (error) {
			if (isAppError(error)) {
				if (error.code === "UNAUTHORIZED") {
					log("warn", "transfer.create.failed", {
						operation: "create",
						errorCategory: "UNAUTHORIZED",
					});
				} else if (error.code === "INSUFFICIENT_FUNDS") {
					log("warn", "transfer.insufficient_funds", {
						operation: "create",
						errorCategory: "INSUFFICIENT_FUNDS",
					});
				} else if (
					error.code === "ACCOUNT_NOT_FOUND" ||
					error.code === "FORBIDDEN"
				) {
					log("warn", "transfer.forbidden", {
						operation: "create",
						errorCategory: error.code,
					});
				} else {
					log("warn", "transfer.create.failed", {
						operation: "create",
						errorCategory: error.code,
					});
				}

				return failure(toTransferErrorCode(error.code), error.message);
			}

			log("error", "transfer.create.failed", {
				operation: "create",
				errorCategory: "DATABASE_ERROR",
			});

			return failure("INTERNAL_ERROR", "An unexpected error occurred.");
		}
	});
