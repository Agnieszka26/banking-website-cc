import { describe, expectTypeOf, it } from "vitest";
import type {
	CreateTransactionRequest,
	CreateTransactionRequestParsed,
	CreateTransactionResponse,
	CreateTransferRequest,
	CreateTransferRequestParsed,
	ListTransactionsQuery,
	ListTransactionsQueryParsed,
	TransactionDto,
} from "./types";

describe("shared transport input vs parsed types", () => {
	it("allows omitting schema defaults on public request/query inputs", () => {
		expectTypeOf<CreateTransactionRequest>().toMatchTypeOf<{
			accountId: string;
			amountMinor: number;
			direction: "debit" | "credit";
			type: string;
			title: string;
			currency?: string;
		}>();

		expectTypeOf<CreateTransferRequest>().toMatchTypeOf<{
			sourceAccountId: string;
			destinationAccountId: string;
			amountMinor: number;
			title: string;
			currency?: string;
		}>();

		expectTypeOf<ListTransactionsQuery>().toMatchTypeOf<{
			page?: unknown;
			limit?: unknown;
			accountId?: string;
		}>();
	});

	it("requires defaults on parsed-output aliases; response stays output", () => {
		expectTypeOf<CreateTransactionRequestParsed>().toMatchTypeOf<{
			currency: string;
		}>();
		expectTypeOf<CreateTransferRequestParsed>().toMatchTypeOf<{
			currency: string;
		}>();
		expectTypeOf<ListTransactionsQueryParsed>().toMatchTypeOf<{
			page: number;
			limit: number;
		}>();

		expectTypeOf<CreateTransactionResponse>().toMatchTypeOf<{
			data: TransactionDto;
		}>();
	});
});
