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
	it("aggregates balances and savings account types", () => {
		expect(
			buildAccountSummary([
				{
					id: "1",
					name: "Checking",
					mask: "1111",
					balance: 100,
					currency: "PLN",
					type: "checking",
				},
				{
					id: "2",
					name: "Savings",
					mask: "2222",
					balance: 50,
					currency: "PLN",
					type: "savings",
				},
			]),
		).toEqual({
			totalAvailable: 150,
			savings: 50,
			currency: "PLN",
		});
	});
});
