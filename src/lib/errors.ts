import type { ApiErrorCode } from "#/shared/types";
import { API_ERROR_HTTP_STATUS } from "#/shared/types";

/** Safe structured fields for service-layer logging / instanceof mapping. */
export type AppErrorContext = Readonly<
	Record<string, string | number | boolean | null | undefined>
>;

/**
 * Typed application error for server boundaries.
 * Never expose raw database errors to clients — map them to INTERNAL_ERROR.
 * `context` is for server use only and is not included in {@link toResponse}.
 */
export class AppError extends Error {
	readonly name = "AppError";
	readonly code: ApiErrorCode;
	readonly context: AppErrorContext | undefined;

	constructor(code: ApiErrorCode, message: string, context?: AppErrorContext) {
		super(message);
		this.code = code;
		this.context = context;
	}

	get httpStatus(): number {
		return API_ERROR_HTTP_STATUS[this.code];
	}

	/** HTTP Response with the standard `{ error: { code, message } }` envelope. */
	toResponse(): Response {
		return new Response(
			JSON.stringify({
				error: {
					code: this.code,
					message: this.message,
				},
			}),
			{
				status: this.httpStatus,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

/** Missing or not-owned ledger account (same client code either way). */
export class AccountNotFoundError extends AppError {
	readonly name = "AccountNotFoundError";
	readonly accountId: string;

	constructor(accountId: string) {
		super("ACCOUNT_NOT_FOUND", "Account was not found.", { accountId });
		this.accountId = accountId;
	}
}

/** Debit would drive ledger balance below zero. */
export class InsufficientFundsError extends AppError {
	readonly name = "InsufficientFundsError";
	readonly accountId: string;
	readonly amountMinor: number;
	readonly balanceMinor: number;

	constructor(params: {
		accountId: string;
		amountMinor: number;
		balanceMinor: number;
	}) {
		super(
			"INSUFFICIENT_FUNDS",
			"Account balance is insufficient for this debit.",
			{
				accountId: params.accountId,
				amountMinor: params.amountMinor,
				balanceMinor: params.balanceMinor,
			},
		);
		this.accountId = params.accountId;
		this.amountMinor = params.amountMinor;
		this.balanceMinor = params.balanceMinor;
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

/** Maps unknown failures to a safe client-facing INTERNAL_ERROR. */
export function toAppError(error: unknown): AppError {
	if (isAppError(error)) {
		return error;
	}

	return new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
}

/** Converts AppError (or unknown) into an HTTP Response for createServerFn. */
export function toErrorResponse(error: unknown): Response {
	if (error instanceof Response) {
		return error;
	}

	return toAppError(error).toResponse();
}
