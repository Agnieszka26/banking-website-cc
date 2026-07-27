import { describe, expect, it, vi } from "vitest";
import type { TransferPayload } from "#/components/dashboard/transfers/types";

vi.mock("#/server/transfers/functions", () => ({
	createTransfer: vi.fn(),
	listLedgerAccounts: vi.fn(),
}));

import { createTransfer, listLedgerAccounts } from "#/server/transfers/functions";
import { submitTransfer, toAmountMinor } from "./submit-transfer";

const createTransferMock = vi.mocked(createTransfer);
const listLedgerAccountsMock = vi.mocked(listLedgerAccounts);

const ownPayload: Extract<TransferPayload, { type: "own" }> = {
	type: "own",
	sourceAccountId: "src",
	destinationAccountId: "dst",
	amount: 10,
	currency: "PLN",
	title: "Move",
};

describe("toAmountMinor", () => {
	it("converts major units to integer minor units with rounding", () => {
		expect(toAmountMinor(10.5)).toBe(1050);
		expect(toAmountMinor(100)).toBe(10_000);
		expect(toAmountMinor(10.005)).toBe(1001);
		expect(toAmountMinor(0.01)).toBe(1);
	});
});

describe("submitTransfer", () => {
	it("rejects tax payloads without calling the server", async () => {
		const result = await submitTransfer({
			type: "tax",
			paymentType: "zus",
			accountNumber: "PL61109010140000071219812874",
			amount: 10,
			paymentId: "123",
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Tax transfers are not supported by the ledger transfer API.",
			},
		});
		expect(createTransferMock).not.toHaveBeenCalled();
	});

	it("submits recipient transfers by IBAN via the ledger API", async () => {
		listLedgerAccountsMock.mockResolvedValue([
			{
				id: "src",
				name: "Main account",
				iban: "PL61109010140000071219812874",
				currency: "PLN",
				balanceMinor: 100_000,
			},
		]);
		createTransferMock.mockResolvedValue({
			ok: true,
			data: {
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Test",
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
				createdAt: "2026-07-26T12:00:00.000Z",
			},
		});

		const result = await submitTransfer({
			type: "recipient",
			recipientName: "Jan",
			recipientAccountNumber: "PL61109010140000071219812875",
			amount: 10,
			title: "Test",
		});

		expect(result.ok).toBe(true);
		expect(createTransferMock).toHaveBeenCalledWith({
			data: {
				sourceAccountId: "src",
				destinationIban: "PL61109010140000071219812875",
				amountMinor: 1000,
				currency: "PLN",
				title: "Test",
				counterpartyName: "Jan",
			},
		});
	});

	it("rejects non-positive major amounts before calling the server", async () => {
		createTransferMock.mockClear();
		listLedgerAccountsMock.mockClear();

		await expect(
			submitTransfer({ ...ownPayload, amount: 0 }),
		).resolves.toMatchObject({
			ok: false,
			error: { code: "VALIDATION_ERROR" },
		});
		await expect(
			submitTransfer({ ...ownPayload, amount: -5 }),
		).resolves.toMatchObject({
			ok: false,
			error: { code: "VALIDATION_ERROR" },
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

		await expect(submitTransfer(ownPayload)).resolves.toEqual({
			ok: false,
			error: {
				code: "INSUFFICIENT_FUNDS",
				message: "Account balance is insufficient for this debit.",
			},
		});
	});

	it("maps unexpected thrown errors to INTERNAL_ERROR", async () => {
		createTransferMock.mockRejectedValue(new Error("network down"));

		await expect(submitTransfer(ownPayload)).resolves.toEqual({
			ok: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "An unexpected error occurred.",
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
			...ownPayload,
			amount: 10,
			currency: "EUR",
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
				currency: "EUR",
				title: "Move",
			},
		});
	});
});
