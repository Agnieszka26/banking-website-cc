import { createServerFn } from "@tanstack/react-start";
import { AppError, isAppError, toErrorResponse } from "#/lib/errors";
import { log } from "#/lib/logger";
import {
	CreateTransactionRequestSchema,
	ListTransactionsQuerySchema,
} from "#/shared/schemas";
import type {
	CreateTransactionRequestParsed,
	CreateTransactionResponse,
	ListTransactionsQueryParsed,
	ListTransactionsResponse,
} from "#/shared/types";
import { createTransaction, listTransactions } from "./service";
import { setResponseStatus } from "@tanstack/react-start/server";

function logUnauthorized(operation: "list" | "create"): void {
	log("warn", "transaction.unauthorized", {
		operation,
		errorCategory: "UNAUTHORIZED",
	});
}

function parseListQuery(data: unknown): ListTransactionsQueryParsed {
	const parsed = ListTransactionsQuerySchema.safeParse(data ?? {});
	if (!parsed.success) {
		log("warn", "transaction.validation_failed", {
			operation: "list",
			errorCategory: "VALIDATION_ERROR",
		});
		throw new AppError(
			"VALIDATION_ERROR",
			"Query parameters failed validation.",
		).toResponse();
	}

	return parsed.data;
}

function parseCreateBody(data: unknown): CreateTransactionRequestParsed {
	const parsed = CreateTransactionRequestSchema.safeParse(data);
	if (!parsed.success) {
		log("warn", "transaction.validation_failed", {
			operation: "create",
			errorCategory: "VALIDATION_ERROR",
		});
		throw new AppError(
			"VALIDATION_ERROR",
			"Request body failed validation.",
		).toResponse();
	}

	return parsed.data;
}

/**
 * Lists application-ledger transactions for the authenticated user.
 * Transport: TanStack Start `createServerFn` (same DTOs as `/api/transactions`).
 */
export const listLedgerTransactions = createServerFn({ method: "GET" })
	.validator(parseListQuery)
	.handler(async ({ data }): Promise<ListTransactionsResponse> => {
		try {
			const result = await listTransactions(data);
			return { data: result };
		} catch (error) {
			if (isAppError(error) && error.code === "UNAUTHORIZED") {
				logUnauthorized("list");
			}
			throw toErrorResponse(error);
		}
	});

/**
 * Creates one append-only ledger transaction for the authenticated user.
 */
export const createLedgerTransaction = createServerFn({ method: "POST" })
	.validator(parseCreateBody)
	.handler(async ({ data }): Promise<CreateTransactionResponse> => {
		try {
			const result = await createTransaction(data);
			setResponseStatus(201);
			return { data: result };
		} catch (error) {
			if (isAppError(error) && error.code === "UNAUTHORIZED") {
				logUnauthorized("create");
			}
			throw toErrorResponse(error);
		}
	});
