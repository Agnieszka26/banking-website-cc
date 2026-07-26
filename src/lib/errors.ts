import type { ApiErrorCode } from "#/shared/types";
import { API_ERROR_HTTP_STATUS } from "#/shared/types";

/**
 * Typed application error for server boundaries.
 * Never expose raw database errors to clients — map them to INTERNAL_ERROR.
 */
export class AppError extends Error {
	readonly name = "AppError";
	readonly code: ApiErrorCode;

	constructor(code: ApiErrorCode, message: string) {
		super(message);
		this.code = code;
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
