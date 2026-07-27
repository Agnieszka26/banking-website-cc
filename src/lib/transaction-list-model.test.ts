import { describe, expect, it } from "vitest";
import {
	mapLedgerTransactionToListItem,
	mapPlaidTransactionToListItem,
} from "./transaction-list-model";

describe("mapPlaidTransactionToListItem", () => {
	it("preserves Plaid fields and marks non-transfer", () => {
		expect(
			mapPlaidTransactionToListItem({
				id: "plaid-1",
				date: "2026-07-20",
				name: "Coffee",
				amount: 12.5,
				currency: "PLN",
			}),
		).toEqual({
			id: "plaid-1",
			date: "2026-07-20",
			name: "Coffee",
			amount: 12.5,
			currency: "PLN",
			transferId: null,
			isTransfer: false,
		});
	});
});

describe("mapLedgerTransactionToListItem", () => {
	it("maps debit transfer legs to positive amounts and flags isTransfer", () => {
		expect(
			mapLedgerTransactionToListItem({
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				accountId: "src",
				amountMinor: 10_050,
				currency: "PLN",
				direction: "debit",
				type: "transfer",
				title: "To savings",
				counterpartyName: null,
				counterpartyAccountNumber: null,
				transferId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				createdAt: "2026-07-25T16:10:00.000Z",
				bookingDate: "2026-07-25",
			}),
		).toEqual({
			id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
			date: "2026-07-25",
			name: "To savings",
			amount: 100.5,
			currency: "PLN",
			transferId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
			isTransfer: true,
		});
	});

	it("maps credit legs to negative amounts (income convention)", () => {
		const item = mapLedgerTransactionToListItem({
			id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
			accountId: "dst",
			amountMinor: 10_000,
			currency: "EUR",
			direction: "credit",
			type: "transfer",
			title: "From checking",
			counterpartyName: null,
			counterpartyAccountNumber: null,
			transferId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
			createdAt: "2026-07-25T16:10:00.000Z",
			bookingDate: "2026-07-25",
		});

		expect(item.amount).toBe(-100);
		expect(item.isTransfer).toBe(true);
	});

	it("does not flag ordinary ledger payments as transfers", () => {
		const item = mapLedgerTransactionToListItem({
			id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
			accountId: "src",
			amountMinor: 2500,
			currency: "PLN",
			direction: "debit",
			type: "payment",
			title: "Rent",
			counterpartyName: "Landlord",
			counterpartyAccountNumber: null,
			transferId: null,
			createdAt: "2026-07-25T12:00:00.000Z",
			bookingDate: "2026-07-25",
		});

		expect(item.isTransfer).toBe(false);
		expect(item.transferId).toBeNull();
		expect(item.amount).toBe(25);
	});
});
