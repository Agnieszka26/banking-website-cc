import { describe, expect, it } from "vitest";
import type { TransactionListItemViewModel } from "#/lib/transaction-list-model";
import {
	getTransactionFlow,
	processTransactions,
	TRANSACTIONS_PAGE_SIZE,
	type TransactionListQuery,
} from "#/lib/transactions";

const transactions: TransactionListItemViewModel[] = [
	{
		id: "1",
		name: "Salary",
		date: "2025-01-10",
		currency: "PLN",
		amount: -5000,
		transferId: null,
		isTransfer: false,
	},
	{
		id: "2",
		name: "Coffee",
		date: "2025-01-12",
		currency: "PLN",
		amount: 20,
		transferId: null,
		isTransfer: false,
	},
	{
		id: "3",
		name: "Rent",
		date: "2025-01-05",
		currency: "EUR",
		amount: 1500,
		transferId: null,
		isTransfer: false,
	},
	{
		id: "4",
		name: "Bonus",
		date: "2025-01-20",
		currency: "PLN",
		amount: -1000,
		transferId: null,
		isTransfer: false,
	},
];

const defaultQuery: TransactionListQuery = {
	search: "",
	typeFilter: "all",
	dateSort: "asc",
	amountSort: "none",
	typeSort: "none",
	page: 1,
};

describe("getTransactionFlow", () => {
	it("treats negative amounts as income", () => {
		expect(getTransactionFlow(-100)).toBe("income");
	});

	it("treats zero and positive amounts as outcome", () => {
		expect(getTransactionFlow(0)).toBe("outcome");
		expect(getTransactionFlow(100)).toBe("outcome");
	});
});

describe("processTransactions", () => {
	it("returns all transactions without filters", () => {
		const result = processTransactions(transactions, defaultQuery);

		expect(result.total).toBe(4);
		expect(result.items).toHaveLength(4);
		expect(result.totalPages).toBe(1);
		expect(result.page).toBe(1);
	});

	it("filters transactions by flow type", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			typeFilter: "income",
		});

		expect(result.items.map((item) => item.name)).toEqual([
			"Salary",
			"Bonus",
		]);
		expect(result.total).toBe(2);
	});

	it("filters transactions by search query", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			search: "eur",
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0].name).toBe("Rent");
	});

	it("searches by formatted date", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			search: "2025",
		});

		expect(result.total).toBe(4);
	});

	it("sorts by amount ascending", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			amountSort: "asc",
		});

		expect(result.items.map((item) => Math.abs(item.amount))).toEqual([
			20,
			1000,
			1500,
			5000,
		]);
	});

    it("sorts income before outcome", () => {
        const result = processTransactions(transactions, {
            ...defaultQuery,
            typeSort: "income-first",
        });
    
        expect(result.items.map((item) => item.name)).toEqual([
            "Salary",
            "Bonus",
            "Rent",
            "Coffee",
        ]);
    });

	it("applies sort composition: type, then amount, then date", () => {
		const result = processTransactions(
			[
				{
					id: "1",
					name: "Income A",
					date: "2025-01-02",
					currency: "PLN",
					amount: -100,
				},
				{
					id: "2",
					name: "Income B",
					date: "2025-01-01",
					currency: "PLN",
					amount: -200,
				},
				{
					id: "3",
					name: "Outcome",
					date: "2025-01-03",
					currency: "PLN",
					amount: 50,
				},
			],
			{
				...defaultQuery,
				typeSort: "income-first",
				amountSort: "asc",
			},
		);

		expect(result.items.map((item) => item.name)).toEqual([
			"Income A",
			"Income B",
			"Outcome",
		]);
	});

	it("clamps page below minimum to first page", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			page: 0,
		});

		expect(result.page).toBe(1);
	});

	it("clamps page above maximum to last page", () => {
		const manyTransactions = Array.from(
			{ length: TRANSACTIONS_PAGE_SIZE + 5 },
			(_, index) => ({
				id: String(index),
				name: `Transaction ${index}`,
				date: "2025-01-01",
				currency: "PLN",
				amount: index,
			}),
		);

		const result = processTransactions(manyTransactions, {
			...defaultQuery,
			page: 99,
		});

		expect(result.page).toBe(2);
		expect(result.items).toHaveLength(5);
	});

	it("handles empty transaction list", () => {
		const result = processTransactions([], defaultQuery);

		expect(result).toEqual({
			items: [],
			total: 0,
			totalPages: 1,
			page: 1,
		});
	});

	it("keeps single page pagination for small datasets", () => {
		const result = processTransactions(transactions, {
			...defaultQuery,
			page: 10,
		});

		expect(result.totalPages).toBe(1);
		expect(result.page).toBe(1);
	});
});