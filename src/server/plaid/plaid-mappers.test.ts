import { describe, expect, it } from "vitest";
import {
	buildAccountSummary,
	mapCachedAccount,
	mapCachedTransaction,
} from "#/server/plaid/plaid-mappers";

describe("mapCachedAccount", () => {
	it("converts decimal balances to numbers", () => {
		expect(
			mapCachedAccount({
				plaidAccountId: "acc-1",
				name: "Checking",
				mask: "1234",
				balance: { toNumber: () => 125.5 },
				currency: "PLN",
				type: "checking",
			}),
		).toEqual({
			id: "acc-1",
			name: "Checking",
			mask: "1234",
			balance: 125.5,
			currency: "PLN",
			type: "checking",
			source: "plaid",
		});
	});
});

describe("mapCachedTransaction", () => {
	it("maps cached rows to dashboard transactions", () => {
		expect(
			mapCachedTransaction({
				plaidTransactionId: "tx-1",
				date: "2025-04-20",
				name: "Sklep",
				amount: 42,
				currency: "PLN",
			}),
		).toEqual({
			id: "tx-1",
			date: "2025-04-20",
			name: "Sklep",
			amount: 42,
			currency: "PLN",
		});
	});
});

describe("buildAccountSummary", () => {
	it("aggregates cash-like balances and savings account types", () => {
		expect(
			buildAccountSummary([
				{
					id: "1",
					name: "Checking",
					mask: "1111",
					balance: 100,
					currency: "PLN",
					type: "checking",
					source: "plaid",
				},
				{
					id: "2",
					name: "Savings",
					mask: "2222",
					balance: 50,
					currency: "PLN",
					type: "savings",
					source: "plaid",
				},
				{
					id: "3",
					name: "Credit card",
					mask: "3333",
					balance: 500,
					currency: "PLN",
					type: "credit card",
					source: "plaid",
				},
			]),
		).toEqual({
			byCurrency: [
				{ currency: "PLN", totalAvailable: 150, savings: 50 },
			],
		});
	});

	it("keeps totals separate per currency instead of summing across them", () => {
		expect(
			buildAccountSummary([
				{
					id: "pln",
					name: "Main",
					mask: "1111",
					balance: 1000,
					currency: "PLN",
					type: "checking",
					source: "internal",
				},
				{
					id: "usd",
					name: "USD Checking",
					mask: "2222",
					balance: 200,
					currency: "USD",
					type: "checking",
					source: "plaid",
				},
				{
					id: "usd-sav",
					name: "USD Savings",
					mask: "3333",
					balance: 50,
					currency: "USD",
					type: "savings",
					source: "plaid",
				},
			]),
		).toEqual({
			byCurrency: [
				{ currency: "PLN", totalAvailable: 1000, savings: 0 },
				{ currency: "USD", totalAvailable: 250, savings: 50 },
			],
		});
	});

	it("maps null cached masks to a display placeholder", () => {
		expect(
			mapCachedAccount({
				plaidAccountId: "acc-2",
				name: "Checking",
				mask: null,
				balance: 10,
				currency: "PLN",
				type: "checking",
			}).mask,
		).toBe("****");
	});
});
