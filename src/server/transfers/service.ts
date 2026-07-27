import "@tanstack/react-start/server-only";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { transferRepository } from "#/data/repositories/transfer.repository";
import {
	AccountNotFoundError,
	AppError,
	InsufficientFundsError,
} from "#/lib/errors";
import { isValidPolishIban, normalizePolishIban } from "#/lib/iban";
import { log } from "#/lib/logger";
import { requireUserId } from "#/lib/session.server";
import { toTransferDto } from "#/server/transfers/mappers";
import type {
	AccountDto,
	CreateTransferRequestParsed,
	TransferDto,
} from "#/shared/types";

function toAccountDto(row: {
	id: string;
	name: string;
	iban: string;
	currency: string;
	balanceMinor: number;
}): AccountDto {
	return {
		id: row.id,
		name: row.name,
		iban: row.iban,
		currency: row.currency,
		balanceMinor: row.balanceMinor,
	};
}

/**
 * Lists application-ledger accounts for the authenticated user.
 * Session gate repairs provisioning for legacy / incomplete users.
 */
export async function listLedgerAccountsForUser(): Promise<AccountDto[]> {
	const userId = await requireUserId();

	try {
		const rows = await ledgerAccountRepository.listOwned(userId);
		return rows.map(toAccountDto);
	} catch (error) {
		if (error instanceof AppError) throw error;
		log("error", "transfer.list_accounts.failed", {
			userId,
			operation: "list",
			errorCategory: "DATABASE_ERROR",
		});
		throw new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
	}
}

/**
 * Creates an internal transfer (own-account by id, or recipient by IBAN).
 */
export async function createInternalTransfer(
	input: CreateTransferRequestParsed,
): Promise<TransferDto> {
	const userId = await requireUserId();

	try {
		const source = await ledgerAccountRepository.findOwnedById(
			userId,
			input.sourceAccountId,
		);

		if (!source) {
			log("warn", "transfer.forbidden", {
				userId,
				operation: "create",
				errorCategory: "ACCOUNT_NOT_FOUND",
			});
			throw new AccountNotFoundError(input.sourceAccountId);
		}

		let destinationId: string;
		let allowCrossUser = false;
		let counterpartyName = input.counterpartyName ?? null;
		let counterpartyAccountNumber: string | null = null;

		if (input.destinationAccountId) {
			const destination = await ledgerAccountRepository.findOwnedById(
				userId,
				input.destinationAccountId,
			);

			if (!destination) {
				log("warn", "transfer.forbidden", {
					userId,
					operation: "create",
					errorCategory: "ACCOUNT_NOT_FOUND",
				});
				throw new AccountNotFoundError(input.destinationAccountId);
			}

			destinationId = destination.id;

			if (source.id === destinationId) {
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
				throw new AppError(
					"VALIDATION_ERROR",
					"Request body failed validation.",
				);
			}
		} else if (input.destinationIban) {
			const normalizedIban = normalizePolishIban(input.destinationIban);
			if (!isValidPolishIban(normalizedIban)) {
				throw new AppError(
					"VALIDATION_ERROR",
					"Request body failed validation.",
				);
			}

			const destination =
				await ledgerAccountRepository.findByIban(normalizedIban);

			if (!destination) {
				log("warn", "transfer.forbidden", {
					userId,
					operation: "create",
					errorCategory: "ACCOUNT_NOT_FOUND",
				});
				throw new AccountNotFoundError(normalizedIban);
			}

			if (destination.userId === userId && destination.id === source.id) {
				throw new AppError(
					"VALIDATION_ERROR",
					"Source and destination accounts must be different.",
				);
			}

			if (destination.userId === userId) {
				// Same user, different account — still use RLS own-account path.
				allowCrossUser = false;
			} else {
				allowCrossUser = true;
			}

			if (destination.currency !== input.currency) {
				log("warn", "transfer.create.failed", {
					userId,
					operation: "create",
					errorCategory: "VALIDATION_ERROR",
					reason: "currency_mismatch",
				});
				throw new AppError(
					"VALIDATION_ERROR",
					"Request body failed validation.",
				);
			}

			destinationId = destination.id;
			counterpartyAccountNumber = destination.iban;
			if (!counterpartyName) {
				counterpartyName = destination.name;
			}
		} else {
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		if (source.currency !== input.currency) {
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
			input: {
				sourceAccountId: source.id,
				destinationAccountId: destinationId,
				amountMinor: input.amountMinor,
				currency: input.currency,
				title: input.title,
				counterpartyName,
				counterpartyAccountNumber,
				allowCrossUser,
			},
		});

		log("info", "transfer.create.success", {
			userId,
			transferId: transfer.id,
			operation: "create",
			...(deduplicated ? { deduplicated: true } : {}),
			...(allowCrossUser ? { crossUser: true } : {}),
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

/** @deprecated Prefer {@link createInternalTransfer}. */
export const createOwnAccountTransfer = createInternalTransfer;
