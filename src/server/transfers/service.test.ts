import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/session.server", () => ({
	requireUserId: vi.fn(),
}));

vi.mock("#/data/repositories/ledger-account.repository", () => ({
	ledgerAccountRepository: {
		findOwnedById: vi.fn(),
		listOwned: vi.fn(),
	},
}));

vi.mock("#/data/repositories/transfer.repository", () => ({
	transferRepository: {
		createTransfer: vi.fn(),
	},
}));

vi.mock("#/lib/logger", () => ({
	log: vi.fn(),
}));

import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { transferRepository } from "#/data/repositories/transfer.repository";
import { requireUserId } from "#/lib/session.server";
import { createOwnAccountTransfer } from "./service";

const requireUserIdMock = vi.mocked(requireUserId);
const findOwnedByIdMock = vi.mocked(ledgerAccountRepository.findOwnedById);
const createTransferMock = vi.mocked(transferRepository.createTransfer);

describe("createOwnAccountTransfer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		requireUserIdMock.mockResolvedValue("user-a");
	});

	it("creates a transfer for owned accounts", async () => {
		findOwnedByIdMock
			.mockResolvedValueOnce({
				id: "src",
				userId: "user-a",
				name: "Checking",
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				currency: "PLN",
				balanceMinor: 10_000,
			});

		createTransferMock.mockResolvedValue({
			transfer: {
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				userId: "user-a",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
				createdAt: new Date("2026-07-26T12:00:00.000Z"),
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
			},
			deduplicated: false,
		});

		const result = await createOwnAccountTransfer({
			sourceAccountId: "src",
			destinationAccountId: "dst",
			amountMinor: 1000,
			currency: "PLN",
			title: "Move",
		});

		expect(result.id).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
		expect(result.transactionIds).toHaveLength(2);
		expect(createTransferMock).toHaveBeenCalled();
	});

	it("returns a deduplicated transfer from createTransfer without a second write", async () => {
		findOwnedByIdMock
			.mockResolvedValueOnce({
				id: "src",
				userId: "user-a",
				name: "Checking",
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				currency: "PLN",
				balanceMinor: 10_000,
			});

		createTransferMock.mockResolvedValue({
			transfer: {
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				userId: "user-a",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
				createdAt: new Date("2026-07-26T12:00:00.000Z"),
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
			},
			deduplicated: true,
		});

		const result = await createOwnAccountTransfer({
			sourceAccountId: "src",
			destinationAccountId: "dst",
			amountMinor: 1000,
			currency: "PLN",
			title: "Move",
		});

		expect(result.id).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
		expect(createTransferMock).toHaveBeenCalledTimes(1);
	});

	it("rejects transfer from another user's account", async () => {
		findOwnedByIdMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
			id: "dst",
			userId: "user-a",
			name: "Savings",
			currency: "PLN",
			balanceMinor: 10_000,
		});

		await expect(
			createOwnAccountTransfer({
				sourceAccountId: "foreign",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
			}),
		).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });

		expect(createTransferMock).not.toHaveBeenCalled();
	});

	it("rejects currency mismatch before persistence", async () => {
		findOwnedByIdMock
			.mockResolvedValueOnce({
				id: "src",
				userId: "user-a",
				name: "Checking",
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				currency: "PLN",
				balanceMinor: 10_000,
			});

		await expect(
			createOwnAccountTransfer({
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "EUR",
				title: "Move",
			}),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

		expect(createTransferMock).not.toHaveBeenCalled();
	});

	it("returns INSUFFICIENT_FUNDS when source balance is too low", async () => {
		findOwnedByIdMock
			.mockResolvedValueOnce({
				id: "src",
				userId: "user-a",
				name: "Checking",
				currency: "PLN",
				balanceMinor: 500,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				currency: "PLN",
				balanceMinor: 10_000,
			});

		await expect(
			createOwnAccountTransfer({
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
	});
});
