import type { Transaction } from "plaid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { plaidClient } from "#/server/plaid/client";
import { fetchPlaidTransactions } from "#/server/plaid/plaid-api";

vi.mock("#/server/plaid/client", () => ({
	plaidClient: {
		transactionsGet: vi.fn(),
	},
}));

function makeTransaction(id: string, date: string): Transaction {
	return {
		transaction_id: id,
		account_id: "acc-1",
		date,
		name: `Transaction ${id}`,
		amount: 10,
		iso_currency_code: "PLN",
	} as Transaction;
}

describe("fetchPlaidTransactions", () => {
	beforeEach(() => {
		vi.mocked(plaidClient.transactionsGet).mockReset();
	});

	it("paginates through all Plaid pages before mapping results", async () => {
		const pageOne = Array.from({ length: 500 }, (_, index) =>
			makeTransaction(`tx-${index}`, "2025-04-20"),
		);
		const pageTwo = [makeTransaction("tx-500", "2025-04-19")];

		vi.mocked(plaidClient.transactionsGet)
			.mockResolvedValueOnce({
				data: {
					total_transactions: 501,
					transactions: pageOne,
				},
			} as Awaited<ReturnType<typeof plaidClient.transactionsGet>>)
			.mockResolvedValueOnce({
				data: {
					total_transactions: 501,
					transactions: pageTwo,
				},
			} as Awaited<ReturnType<typeof plaidClient.transactionsGet>>);

		const transactions = await fetchPlaidTransactions("access-token");

		expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2);
		expect(plaidClient.transactionsGet).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				access_token: "access-token",
				options: { count: 500, offset: 0 },
			}),
		);
		expect(plaidClient.transactionsGet).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				access_token: "access-token",
				options: { count: 500, offset: 500 },
			}),
		);
		expect(transactions).toHaveLength(501);
		expect(transactions[0]?.id).toBe("tx-0");
		expect(transactions[500]?.id).toBe("tx-500");
	});
});
