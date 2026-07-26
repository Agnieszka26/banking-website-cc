import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "#/lib/errors";

vi.mock("#/lib/session.server", () => ({
	requireUserId: vi.fn(),
}));

vi.mock("#/data/repositories/ledger-account.repository", () => ({
	ledgerAccountRepository: {
		findOwnedById: vi.fn(),
	},
}));

vi.mock("#/data/repositories/transaction.repository", () => ({
	transactionRepository: {
		getTransactionsByAccount: vi.fn(),
		createTransaction: vi.fn(),
	},
}));

vi.mock("#/lib/logger", () => ({
	log: vi.fn(),
}));

import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { transactionRepository } from "#/data/repositories/transaction.repository";
import { requireUserId } from "#/lib/session.server";
import { createTransaction, listTransactions } from "./service";

const requireUserIdMock = vi.mocked(requireUserId);
const findOwnedByIdMock = vi.mocked(ledgerAccountRepository.findOwnedById);
const getTransactionsMock = vi.mocked(
	transactionRepository.getTransactionsByAccount,
);
const createTransactionMock = vi.mocked(
	transactionRepository.createTransaction,
);

describe("transaction service auth and ownership", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rejects unauthenticated list requests with UNAUTHORIZED", async () => {
		requireUserIdMock.mockRejectedValue(
			new AppError("UNAUTHORIZED", "Authentication required."),
		);

		await expect(
			listTransactions({ page: 1, limit: 20 }),
		).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects listing another user's account with ACCOUNT_NOT_FOUND", async () => {
		requireUserIdMock.mockResolvedValue("user-a");
		findOwnedByIdMock.mockResolvedValue(null);

		await expect(
			listTransactions({
				page: 1,
				limit: 20,
				accountId: "acct-other",
			}),
		).rejects.toMatchObject({
			code: "ACCOUNT_NOT_FOUND",
		});

		expect(getTransactionsMock).not.toHaveBeenCalled();
	});

	it("returns own transactions for the authenticated user", async () => {
		requireUserIdMock.mockResolvedValue("user-a");
		findOwnedByIdMock.mockResolvedValue({
			id: "acct-1",
			userId: "user-a",
			name: "Checking",
			currency: "PLN",
			balanceMinor: 10_000,
		});
		getTransactionsMock.mockResolvedValue({
			items: [
				{
					id: "11111111-1111-1111-1111-111111111111",
					accountId: "acct-1",
					amountMinor: 2500,
					currency: "PLN",
					direction: "debit",
					type: "payment",
					title: "Rent",
					counterpartyName: null,
					counterpartyAccountNumber: null,
					transferId: null,
					bookingDate: new Date("2026-07-25T00:00:00.000Z"),
					createdAt: new Date("2026-07-25T16:05:12.345Z"),
				},
			],
			total: 1,
		});

		const result = await listTransactions({
			page: 1,
			limit: 20,
			accountId: "acct-1",
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({
			id: "11111111-1111-1111-1111-111111111111",
			accountId: "acct-1",
			amountMinor: 2500,
			direction: "debit",
			bookingDate: "2026-07-25",
		});
		expect(result.pagination).toEqual({
			page: 1,
			limit: 20,
			total: 1,
			totalPages: 1,
		});
	});

	it("rejects create for an account the user does not own", async () => {
		requireUserIdMock.mockResolvedValue("user-a");
		findOwnedByIdMock.mockResolvedValue(null);

		await expect(
			createTransaction({
				accountId: "acct-other",
				amountMinor: 100,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "Coffee",
			}),
		).rejects.toMatchObject({
			code: "ACCOUNT_NOT_FOUND",
		});

		expect(createTransactionMock).not.toHaveBeenCalled();
	});

	it("returns typed VALIDATION_ERROR for disallowed credit flows", async () => {
		requireUserIdMock.mockResolvedValue("user-a");

		await expect(
			createTransaction({
				accountId: "acct-1",
				amountMinor: 100,
				currency: "PLN",
				direction: "credit",
				type: "payment",
				title: "Fake top-up",
			}),
		).rejects.toMatchObject({
			code: "VALIDATION_ERROR",
		});
	});

	it("returns typed INSUFFICIENT_FUNDS for overdrawn debits", async () => {
		requireUserIdMock.mockResolvedValue("user-a");
		findOwnedByIdMock.mockResolvedValue({
			id: "acct-1",
			userId: "user-a",
			name: "Checking",
			currency: "PLN",
			balanceMinor: 50,
		});

		await expect(
			createTransaction({
				accountId: "acct-1",
				amountMinor: 100,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "Too much",
			}),
		).rejects.toMatchObject({
			code: "INSUFFICIENT_FUNDS",
		});
	});

	it("maps database failures to INTERNAL_ERROR", async () => {
		requireUserIdMock.mockResolvedValue("user-a");
		findOwnedByIdMock.mockResolvedValue({
			id: "acct-1",
			userId: "user-a",
			name: "Checking",
			currency: "PLN",
			balanceMinor: 10_000,
		});
		createTransactionMock.mockRejectedValue(new Error("connection reset"));

		await expect(
			createTransaction({
				accountId: "acct-1",
				amountMinor: 100,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "Coffee",
			}),
		).rejects.toMatchObject({
			code: "INTERNAL_ERROR",
		});
	});
});
