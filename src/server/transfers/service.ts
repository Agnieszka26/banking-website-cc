import "@tanstack/react-start/server-only";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { transferRepository } from "#/data/repositories/transfer.repository";
import {
	AccountNotFoundError,
	AppError,
	InsufficientFundsError,
} from "#/lib/errors";
import { log } from "#/lib/logger";
import { requireUserId } from "#/lib/session.server";
import { toTransferDto } from "#/server/transfers/mappers";
import type {
	AccountDto,
	CreateTransferRequestParsed,
	TransferDto,
} from "#/shared/types";

/**
 * Lists application-ledger accounts for the authenticated user.
 * Used by own-account transfer UI (not Plaid cache accounts).
 */
export async function listLedgerAccountsForUser(): Promise<AccountDto[]> {
	const userId = await requireUserId();
	const rows = await ledgerAccountRepository.listOwned(userId);

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		currency: row.currency,
		balanceMinor: row.balanceMinor,
	}));
}

/**
 * Creates an own-account transfer (debit source + credit destination).
 */
export async function createOwnAccountTransfer(
	input: CreateTransferRequestParsed,
): Promise<TransferDto> {
	const userId = await requireUserId();

	try {
		const [source, destination] = await Promise.all([
			ledgerAccountRepository.findOwnedById(userId, input.sourceAccountId),
			ledgerAccountRepository.findOwnedById(userId, input.destinationAccountId),
		]);

		if (!source || !destination) {
			log("warn", "transfer.forbidden", {
				userId,
				operation: "create",
				errorCategory: "ACCOUNT_NOT_FOUND",
			});
			throw new AccountNotFoundError(
				!source ? input.sourceAccountId : input.destinationAccountId,
			);
		}

		if (source.id === destination.id) {
			throw new AppError(
				"VALIDATION_ERROR",
				"Source and destination accounts must be different.",
			);
		}
		if (
			source.currency !== input.currency ||
			destination.currency !== input.currency
		) {
			log("warn", "transfer.create.failed", {
				userId,
				operation: "create",
				errorCategory: "VALIDATION_ERROR",
				reason: "currency_mismatch",
			});
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		if (source.balanceMinor < input.amountMinor) {
			log("warn", "transfer.insufficient_funds", {
				userId,
				operation: "create",
				errorCategory: "INSUFFICIENT_FUNDS",
			});
			throw new InsufficientFundsError({
				accountId: source.id,
				amountMinor: input.amountMinor,
				balanceMinor: source.balanceMinor,
			});
		}

		const { transfer, deduplicated } = await transferRepository.createTransfer({
			userId,
			input,
		});

		log("info", "transfer.create.success", {
			userId,
			transferId: transfer.id,
			operation: "create",
			...(deduplicated ? { deduplicated: true } : {}),
		});

		return toTransferDto(transfer);
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		log("error", "transfer.create.failed", {
			userId,
			operation: "create",
			errorCategory: "DATABASE_ERROR",
		});
		throw new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
	}
}
