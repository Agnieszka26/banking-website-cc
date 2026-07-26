import { describe, expect, it, vi } from "vitest";
import type { TransferPayload } from "#/components/dashboard/transfers/types";

vi.mock("#/server/transfers/functions", () => ({
	createTransfer: vi.fn(),
}));

import { createTransfer } from "#/server/transfers/functions";
import { submitTransfer, toAmountMinor } from "./submit-transfer";

const createTransferMock = vi.mocked(createTransfer);

describe("submitTransfer", () => {
	it("converts major units to minor units", () => {
		expect(toAmountMinor(10.5)).toBe(1050);
		expect(toAmountMinor(100)).toBe(10_000);
	});

	it("rejects recipient/tax payloads without calling the server", async () => {
		const result = await submitTransfer({
			type: "recipient",
			recipientName: "Jan",
			recipientAccountNumber: "PL61109010140000071219812874",
			amount: 10,
			title: "Test",
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "VALIDATION_ERROR",
				message:
					"Only own-account transfers are supported by the ledger transfer API.",
			},
		});
		expect(createTransferMock).not.toHaveBeenCalled();
	});

	it("returns typed INSUFFICIENT_FUNDS from the server result", async () => {
		createTransferMock.mockResolvedValue({
			ok: false,
			error: {
				code: "INSUFFICIENT_FUNDS",
				message: "Account balance is insufficient for this debit.",
			},
		});

		const payload: TransferPayload = {
			type: "own",
			sourceAccountId: "src",
			destinationAccountId: "dst",
			amount: 100,
			title: "Move",
		};

		await expect(submitTransfer(payload)).resolves.toEqual({
			ok: false,
			error: {
				code: "INSUFFICIENT_FUNDS",
				message: "Account balance is insufficient for this debit.",
			},
		});
	});

	it("returns TransferDto on success", async () => {
		createTransferMock.mockResolvedValue({
			ok: true,
			data: {
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
				createdAt: "2026-07-26T12:00:00.000Z",
			},
		});

		const result = await submitTransfer({
			type: "own",
			sourceAccountId: "src",
			destinationAccountId: "dst",
			amount: 10,
			title: "Move",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.amountMinor).toBe(1000);
		}
		expect(createTransferMock).toHaveBeenCalledWith({
			data: {
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
			},
		});
	});
});
