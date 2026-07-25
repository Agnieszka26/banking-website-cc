import { z } from "zod";

/**
 * Shared Zod schemas — source of truth for API/domain validation.
 * TypeScript types are inferred in `./types.ts` via `z.infer`.
 *
 * Aligns with:
 * - `.cursor/docs/ARCHITECTURE_DECISIONS.md` (ledger, amountMinor, account identity)
 * - `docs/API_CONTRACTS.md` (envelopes, error codes, list filters)
 * - `.cursor/docs/DECISIONS.md` ADR-004 (backend Zod validation)
 */

const isoDateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const isoDateTimeString = z.string().datetime();

const currencyCode = z
	.string()
	.length(3)
	.regex(/^[A-Z]{3}$/, "Expected ISO 4217 currency code");

const positiveMinorUnits = z.number().int().positive();

// ---------------------------------------------------------------------------
// API envelope & errors
// ---------------------------------------------------------------------------

export const ApiErrorCodeSchema = z.enum([
	"INSUFFICIENT_FUNDS",
	"ACCOUNT_NOT_FOUND",
	"VALIDATION_ERROR",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"INTERNAL_ERROR",
]);

export const ApiErrorSchema = z.object({
	code: ApiErrorCodeSchema,
	message: z.string().min(1),
});

export const ApiErrorResponseSchema = z.object({
	error: ApiErrorSchema,
});

/** Success envelope factory — keeps `{ data: T }` consistent across endpoints. */
export function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
	return z.object({
		data: dataSchema,
	});
}

// ---------------------------------------------------------------------------
// Money & ledger primitives
// ---------------------------------------------------------------------------

/** Ledger direction from the account holder’s perspective. */
export const TransactionDirectionSchema = z.enum(["debit", "credit"]);

/**
 * Business classification for a single ledger post.
 * Credits are only accepted through allowed flows (backend-enforced).
 */
export const TransactionTypeSchema = z.enum([
	"transfer",
	"payment",
	"deposit",
	"income",
	"refund",
	"adjustment",
	"import",
]);

// ---------------------------------------------------------------------------
// Account DTO (application ledger — not Plaid models)
// ---------------------------------------------------------------------------

export const AccountDtoSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	currency: currencyCode,
	balanceMinor: z.number().int(),
});

// ---------------------------------------------------------------------------
// Transaction DTOs
// ---------------------------------------------------------------------------

export const TransactionDtoSchema = z.object({
	id: z.string().uuid(),
	accountId: z.string().min(1),
	amountMinor: positiveMinorUnits,
	currency: currencyCode,
	direction: TransactionDirectionSchema,
	type: TransactionTypeSchema,
	title: z.string().min(1).max(140),
	counterpartyName: z.string().min(1).max(120).nullable(),
	counterpartyAccountNumber: z.string().min(1).max(34).nullable(),
	/** Present when this post is one leg of a multi-leg transfer. */
	transferId: z.string().uuid().nullable(),
	createdAt: isoDateTimeString,
	bookingDate: isoDateString,
});

export const CreateTransactionRequestSchema = z.object({
	accountId: z.string().min(1),
	amountMinor: positiveMinorUnits,
	currency: currencyCode.default("PLN"),
	direction: TransactionDirectionSchema,
	type: TransactionTypeSchema,
	title: z.string().min(1).max(140),
	counterpartyName: z.string().min(1).max(120).optional(),
	counterpartyAccountNumber: z.string().min(1).max(34).optional(),
});

export const CreateTransactionResponseSchema =
	apiSuccessSchema(TransactionDtoSchema);

export const ListTransactionsQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(100).default(20),
		accountId: z.string().min(1).optional(),
		/** Filter by ledger direction (`debit` | `credit`). */
		type: TransactionDirectionSchema.optional(),
		dateFrom: isoDateString.optional(),
		dateTo: isoDateString.optional(),
	})
	.superRefine((query, ctx) => {
		if (
			query.dateFrom !== undefined &&
			query.dateTo !== undefined &&
			query.dateFrom > query.dateTo
		) {
			ctx.addIssue({
				code: "custom",
				message: "dateFrom must be on or before dateTo",
				path: ["dateFrom"],
			});
		}
	});

export const PaginationMetaSchema = z.object({
	page: z.number().int().min(1),
	limit: z.number().int().min(1),
	total: z.number().int().min(0),
	totalPages: z.number().int().min(0),
});

export const TransactionListDataSchema = z.object({
	items: z.array(TransactionDtoSchema),
	pagination: PaginationMetaSchema,
});

export const ListTransactionsResponseSchema = apiSuccessSchema(
	TransactionListDataSchema,
);

// ---------------------------------------------------------------------------
// Transfer DTOs (separate business operation — multi-leg)
// ---------------------------------------------------------------------------

export const CreateTransferRequestSchema = z
	.object({
		sourceAccountId: z.string().min(1),
		destinationAccountId: z.string().min(1),
		amountMinor: positiveMinorUnits,
		currency: currencyCode.default("PLN"),
		title: z.string().min(1).max(140),
	})
	.refine((value) => value.sourceAccountId !== value.destinationAccountId, {
		message: "sourceAccountId and destinationAccountId must differ",
		path: ["destinationAccountId"],
	});

export const TransferDtoSchema = z.object({
	id: z.string().uuid(),
	sourceAccountId: z.string().min(1),
	destinationAccountId: z.string().min(1),
	amountMinor: positiveMinorUnits,
	currency: currencyCode,
	title: z.string().min(1).max(140),
	/** Ledger posts created for this transfer (typically debit + credit). */
	transactionIds: z.array(z.string().uuid()).min(2),
	createdAt: isoDateTimeString,
});

export const CreateTransferResponseSchema = apiSuccessSchema(TransferDtoSchema);
