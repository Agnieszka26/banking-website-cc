import "@tanstack/react-start/server-only";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { transactionRepository } from "#/data/repositories/transaction.repository";
import { AppError } from "#/lib/errors";
import { log } from "#/lib/logger";
import { requireUserId } from "#/lib/session.server";
import { toTransactionDto } from "#/server/transactions/mappers";
import type {
	CreateTransactionRequestParsed,
	ListTransactionsQueryParsed,
	TransactionDto,
	TransactionListData,
	TransactionType,
} from "#/shared/types";

/** Client-create credits must use an allowed business flow. */
const ALLOWED_CREDIT_TYPES = new Set<TransactionType>([
	"deposit",
	"income",
	"refund",
]);

/**
 * Transaction types that must only be created
 * through dedicated server-side workflows.
 *
 * Examples:
 * - transfer: requires paired ledger entries + transferId
 * - import: requires controlled ingestion flow
 */
const DISALLOWED_CLIENT_TYPES = new Set<TransactionType>(["import", "transfer"]);

function utcBookingDateToday(): Date {
	const now = new Date();
	return new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	);
}

function maskAccountTail(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	if (value.length <= 4) {
		return "****";
	}

	return `****${value.slice(-4)}`;
}

/**
 * List ledger transactions for the authenticated user.
 * Ownership: optional `accountId` must belong to the session user.
 */
export async function listTransactions(
	query: ListTransactionsQueryParsed,
): Promise<TransactionListData> {
	const userId = await requireUserId();

	try {
		if (query.accountId) {
			const account = await ledgerAccountRepository.findOwnedById(
				userId,
				query.accountId,
			);

			if (!account) {
				log("warn", "transaction.forbidden", {
					userId,
					accountId: query.accountId,
					operation: "list",
					errorCategory: "ACCOUNT_NOT_FOUND",
				});
				throw new AppError("ACCOUNT_NOT_FOUND", "Account was not found.");
			}
		}

		const { items, total } =
			await transactionRepository.getTransactionsByAccount({
				userId,
				accountId: query.accountId,
				filters: query,
			});

		const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

		log("info", "transaction.list.success", {
			userId,
			accountId: query.accountId ?? null,
			operation: "list",
			page: query.page,
			limit: query.limit,
			total,
		});

		return {
			items: items.map(toTransactionDto),
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages,
			},
		};
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		log("error", "transaction.list_failed", {
			userId,
			operation: "list",
			errorCategory: "DATABASE_ERROR",
			reason: "list_query_failed",
		});
		throw new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
	}
}
/**
 * Create one append-only ledger transaction for the authenticated user.
 */
export async function createTransaction(
	input: CreateTransactionRequestParsed,
): Promise<TransactionDto> {
	const userId = await requireUserId();

	try {
		if (DISALLOWED_CLIENT_TYPES.has(input.type)) {
			log("warn", "transaction.validation_failed", {
				userId,
				accountId: input.accountId,
				operation: "create",
				errorCategory: "VALIDATION_ERROR",
				reason: "disallowed_type",
			});
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		if (input.direction === "credit" && !ALLOWED_CREDIT_TYPES.has(input.type)) {
			log("warn", "transaction.validation_failed", {
				userId,
				accountId: input.accountId,
				operation: "create",
				errorCategory: "VALIDATION_ERROR",
				reason: "credit_flow_not_allowed",
			});
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		const account = await ledgerAccountRepository.findOwnedById(
			userId,
			input.accountId,
		);

		if (!account) {
			log("warn", "transaction.forbidden", {
				userId,
				accountId: input.accountId,
				operation: "create",
				errorCategory: "ACCOUNT_NOT_FOUND",
			});
			throw new AppError("ACCOUNT_NOT_FOUND", "Account was not found.");
		}

		if (account.currency !== input.currency) {
			log("warn", "transaction.validation_failed", {
				userId,
				accountId: input.accountId,
				operation: "create",
				errorCategory: "VALIDATION_ERROR",
				reason: "currency_mismatch",
			});
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		if (
			input.direction === "debit" &&
			account.balanceMinor < input.amountMinor
		) {
			log("warn", "transaction.create_failed", {
				userId,
				accountId: input.accountId,
				operation: "create",
				errorCategory: "INSUFFICIENT_FUNDS",
			});
			throw new AppError(
				"INSUFFICIENT_FUNDS",
				"Account balance is insufficient for this debit.",
			);
		}

		const created = await transactionRepository.createTransaction({
			userId,
			input: {
				...input,
				bookingDate: utcBookingDateToday(),
			},
		});

		log("info", "transaction.create.success", {
			userId,
			accountId: input.accountId,
			transactionId: created.id,
			operation: "create",
			direction: input.direction,
			type: input.type,
			counterpartyAccountMasked: maskAccountTail(
				input.counterpartyAccountNumber,
			),
		});

		return toTransactionDto(created);
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		log("error", "transaction.create_failed", {
			userId,
			accountId: input.accountId,
			operation: "create",
			errorCategory: "DATABASE_ERROR",
		});
		throw new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
	}
}
