import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/session.server", () => ({
	requireUserId: vi.fn(),
}));

vi.mock("#/data/repositories/ledger-account.repository", () => ({
	ledgerAccountRepository: {
		findOwnedById: vi.fn(),
		listOwned: vi.fn(),
		findByIban: vi.fn(),
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
import { createInternalTransfer } from "./service";
import { generatePolishIban } from "#/lib/iban";

const requireUserIdMock = vi.mocked(requireUserId);
const findOwnedByIdMock = vi.mocked(ledgerAccountRepository.findOwnedById);
const findByIbanMock = vi.mocked(ledgerAccountRepository.findByIban);
const createTransferMock = vi.mocked(transferRepository.createTransfer);

const SRC_IBAN = generatePolishIban("0000000000000001");
const DST_IBAN = generatePolishIban("0000000000000002");
const OTHER_IBAN = generatePolishIban("0000000000000003");
const UNKNOWN_IBAN = generatePolishIban("0000000000000099");

describe("createInternalTransfer", () => {
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
				iban: SRC_IBAN,
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				iban: DST_IBAN,
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

		const result = await createInternalTransfer({
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

	it("creates a cross-user transfer by IBAN", async () => {
		findOwnedByIdMock.mockResolvedValueOnce({
			id: "src",
			userId: "user-a",
			name: "Checking",
			iban: SRC_IBAN,
			currency: "PLN",
			balanceMinor: 50_000,
		});
		findByIbanMock.mockResolvedValueOnce({
			id: "dst-other",
			userId: "user-b",
			name: "Main account",
			iban: OTHER_IBAN,
			currency: "PLN",
			balanceMinor: 10_000,
		});

		createTransferMock.mockResolvedValue({
			transfer: {
				id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				userId: "user-a",
				sourceAccountId: "src",
				destinationAccountId: "dst-other",
				amountMinor: 1000,
				currency: "PLN",
				title: "Pay rent",
				createdAt: new Date("2026-07-26T12:00:00.000Z"),
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
			},
			deduplicated: false,
		});

		const result = await createInternalTransfer({
			sourceAccountId: "src",
			destinationIban: OTHER_IBAN,
			amountMinor: 1000,
			currency: "PLN",
			title: "Pay rent",
			counterpartyName: "Anna",
		});

		expect(result.id).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
		expect(createTransferMock).toHaveBeenCalledWith({
			userId: "user-a",
			input: expect.objectContaining({
				destinationAccountId: "dst-other",
				allowCrossUser: true,
				counterpartyName: "Anna",
			}),
		});
	});

	it("creates a same-user transfer by IBAN with allowCrossUser false", async () => {
		findOwnedByIdMock.mockResolvedValueOnce({
			id: "src",
			userId: "user-a",
			name: "Checking",
			iban: SRC_IBAN,
			currency: "PLN",
			balanceMinor: 50_000,
		});
		findByIbanMock.mockResolvedValueOnce({
			id: "dst",
			userId: "user-a",
			name: "Savings",
			iban: DST_IBAN,
			currency: "PLN",
			balanceMinor: 10_000,
		});

		createTransferMock.mockResolvedValue({
			transfer: {
				id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
				userId: "user-a",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Own move",
				createdAt: new Date("2026-07-26T12:00:00.000Z"),
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
			},
			deduplicated: false,
		});

		await createInternalTransfer({
			sourceAccountId: "src",
			destinationIban: DST_IBAN,
			amountMinor: 1000,
			currency: "PLN",
			title: "Own move",
		});

		expect(createTransferMock).toHaveBeenCalledWith({
			userId: "user-a",
			input: expect.objectContaining({
				destinationAccountId: "dst",
				allowCrossUser: false,
				counterpartyName: "Savings",
			}),
		});
	});

	it("rejects malformed destination IBAN before lookup", async () => {
		findOwnedByIdMock.mockResolvedValueOnce({
			id: "src",
			userId: "user-a",
			name: "Checking",
			iban: SRC_IBAN,
			currency: "PLN",
			balanceMinor: 50_000,
		});

		await expect(
			createInternalTransfer({
				sourceAccountId: "src",
				destinationIban: "not-a-valid-iban",
				amountMinor: 1000,
				currency: "PLN",
				title: "Pay",
			}),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

		expect(findByIbanMock).not.toHaveBeenCalled();
		expect(createTransferMock).not.toHaveBeenCalled();
	});

	it("propagates recipient account name when cross-user IBAN omits counterpartyName", async () => {
		findOwnedByIdMock.mockResolvedValueOnce({
			id: "src",
			userId: "user-a",
			name: "Checking",
			iban: SRC_IBAN,
			currency: "PLN",
			balanceMinor: 50_000,
		});
		findByIbanMock.mockResolvedValueOnce({
			id: "dst-other",
			userId: "user-b",
			name: "Main account",
			iban: OTHER_IBAN,
			currency: "PLN",
			balanceMinor: 10_000,
		});

		createTransferMock.mockResolvedValue({
			transfer: {
				id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
				userId: "user-a",
				sourceAccountId: "src",
				destinationAccountId: "dst-other",
				amountMinor: 1000,
				currency: "PLN",
				title: "Pay rent",
				createdAt: new Date("2026-07-26T12:00:00.000Z"),
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
			},
			deduplicated: false,
		});

		await createInternalTransfer({
			sourceAccountId: "src",
			destinationIban: OTHER_IBAN,
			amountMinor: 1000,
			currency: "PLN",
			title: "Pay rent",
		});

		expect(createTransferMock).toHaveBeenCalledWith({
			userId: "user-a",
			input: expect.objectContaining({
				destinationAccountId: "dst-other",
				allowCrossUser: true,
				counterpartyName: "Main account",
			}),
		});
	});

	it("returns a deduplicated transfer from createTransfer without a second write", async () => {
		findOwnedByIdMock
			.mockResolvedValueOnce({
				id: "src",
				userId: "user-a",
				name: "Checking",
				iban: SRC_IBAN,
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				iban: DST_IBAN,
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

		const result = await createInternalTransfer({
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
		findOwnedByIdMock.mockResolvedValueOnce(null);

		await expect(
			createInternalTransfer({
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
				iban: SRC_IBAN,
				currency: "PLN",
				balanceMinor: 50_000,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				iban: DST_IBAN,
				currency: "PLN",
				balanceMinor: 10_000,
			});

		await expect(
			createInternalTransfer({
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
				iban: SRC_IBAN,
				currency: "PLN",
				balanceMinor: 500,
			})
			.mockResolvedValueOnce({
				id: "dst",
				userId: "user-a",
				name: "Savings",
				iban: DST_IBAN,
				currency: "PLN",
				balanceMinor: 10_000,
			});

		await expect(
			createInternalTransfer({
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
	});

	it("rejects unknown destination IBAN", async () => {
		findOwnedByIdMock.mockResolvedValueOnce({
			id: "src",
			userId: "user-a",
			name: "Checking",
			iban: SRC_IBAN,
			currency: "PLN",
			balanceMinor: 50_000,
		});
		findByIbanMock.mockResolvedValueOnce(null);

		await expect(
			createInternalTransfer({
				sourceAccountId: "src",
				destinationIban: UNKNOWN_IBAN,
				amountMinor: 1000,
				currency: "PLN",
				title: "Pay",
			}),
		).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
	});
});
