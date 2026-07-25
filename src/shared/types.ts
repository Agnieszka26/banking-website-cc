import type { z } from "zod";
import type {
	AccountDtoSchema,
	ApiErrorCodeSchema,
	ApiErrorResponseSchema,
	ApiErrorSchema,
	CreateTransactionRequestSchema,
	CreateTransactionResponseSchema,
	CreateTransferRequestSchema,
	CreateTransferResponseSchema,
	ListTransactionsQuerySchema,
	ListTransactionsResponseSchema,
	PaginationMetaSchema,
	TransactionDirectionSchema,
	TransactionDtoSchema,
	TransactionListDataSchema,
	TransactionTypeSchema,
	TransferDtoSchema,
} from "./schemas";

/**
 * Shared domain and API types.
 * Inferred from Zod schemas in `./schemas.ts` — do not duplicate shapes here.
 */

// ---------------------------------------------------------------------------
// API envelope & errors
// ---------------------------------------------------------------------------

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export type ApiError = z.infer<typeof ApiErrorSchema>;

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/** Successful API envelope. Business payloads live in `data`. */
export type ApiSuccessResponse<T> = {
	readonly data: T;
};

/** Discriminated union of success vs error envelopes. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Recommended HTTP status for each application error code. */
export const API_ERROR_HTTP_STATUS: Readonly<Record<ApiErrorCode, number>> = {
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	ACCOUNT_NOT_FOUND: 404,
	VALIDATION_ERROR: 400,
	INSUFFICIENT_FUNDS: 422,
	INTERNAL_ERROR: 500,
};

// ---------------------------------------------------------------------------
// Money & ledger primitives
// ---------------------------------------------------------------------------

export type TransactionDirection = z.infer<typeof TransactionDirectionSchema>;

export type TransactionType = z.infer<typeof TransactionTypeSchema>;

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/** Application ledger account DTO (not a Plaid account model). */
export type AccountDto = Readonly<z.infer<typeof AccountDtoSchema>>;

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

/** Public ledger transaction DTO — API fields only. */
export type TransactionDto = Readonly<z.infer<typeof TransactionDtoSchema>>;

export type CreateTransactionRequest = z.infer<
	typeof CreateTransactionRequestSchema
>;

export type CreateTransactionResponse = z.infer<
	typeof CreateTransactionResponseSchema
>;

/**
 * GET /api/transactions query.
 * Note: `type` filters by {@link TransactionDirection} (`debit` | `credit`),
 * not by {@link TransactionType}.
 */
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

export type PaginationMeta = Readonly<z.infer<typeof PaginationMetaSchema>>;

export type TransactionListData = Readonly<
	z.infer<typeof TransactionListDataSchema>
>;

export type ListTransactionsResponse = z.infer<
	typeof ListTransactionsResponseSchema
>;

// ---------------------------------------------------------------------------
// Transfer (multi-leg business operation)
// ---------------------------------------------------------------------------

export type CreateTransferRequest = z.infer<typeof CreateTransferRequestSchema>;

export type TransferDto = Readonly<z.infer<typeof TransferDtoSchema>>;

export type CreateTransferResponse = z.infer<
	typeof CreateTransferResponseSchema
>;
