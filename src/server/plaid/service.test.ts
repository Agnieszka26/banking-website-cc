import { afterEach, describe, expect, it, vi } from "vitest";
import {
	mergeDashboardData,
	toDashboardUser,
} from "#/server/plaid/dashboard-mappers";
import { getDateRange } from "#/server/plaid/format";
import type {
	DashboardOverview,
	DashboardTransactionsPayload,
} from "#/server/plaid/types";

describe("getDateRange", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a 30-day inclusive window ending today", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-04-24T12:00:00.000Z"));

		expect(getDateRange(30)).toEqual({
			startDate: "2025-03-25",
			endDate: "2025-04-24",
		});
	});
});

describe("mergeDashboardData", () => {
	it("combines overview and transactions into dashboard data", () => {
		const overview: DashboardOverview = {
			linked: true,
			user: {
				firstName: "Jan",
				lastName: "Kowalski",
				fullName: "Jan Kowalski",
				lastSignIn: null,
			},
			accounts: [
				{
					id: "acc-1",
					name: "Checking",
					mask: "1234",
					balance: 100,
					currency: "PLN",
					type: "checking",
					source: "plaid",
				},
			],
			summary: {
				totalAvailable: 100,
				savings: 0,
				currency: "PLN",
			},
		};
		const transactions: DashboardTransactionsPayload = {
			linked: true,
			transactions: [
				{
					id: "tx-1",
					date: "2025-04-20",
					name: "Sklep",
					amount: 10,
					currency: "PLN",
				},
			],
		};

		expect(mergeDashboardData(overview, transactions)).toEqual({
			linked: true,
			user: overview.user,
			accounts: overview.accounts,
			summary: overview.summary,
			transactions: transactions.transactions,
		});
	});

	it("marks dashboard as unlinked when either payload is unlinked", () => {
		const overview: DashboardOverview = {
			linked: true,
			user: {
				firstName: "Jan",
				lastName: "",
				fullName: "Jan",
				lastSignIn: null,
			},
			accounts: [],
			summary: null,
		};
		const transactions: DashboardTransactionsPayload = {
			linked: false,
			transactions: [],
		};

		expect(mergeDashboardData(overview, transactions).linked).toBe(false);
	});
});

describe("toDashboardUser", () => {
	it("splits full name into first and last name", () => {
		const user = toDashboardUser({
			user: {
				name: "Jan Kowalski",
				username: "jan",
			},
			session: {
				createdAt: new Date("2025-04-24T10:00:00.000Z"),
			},
		} as Parameters<typeof toDashboardUser>[0]);

		expect(user.firstName).toBe("Jan");
		expect(user.lastName).toBe("Kowalski");
		expect(user.fullName).toBe("Jan Kowalski");
		expect(user.lastSignIn).toMatch(/24\.04\.2025/);
	});
});
