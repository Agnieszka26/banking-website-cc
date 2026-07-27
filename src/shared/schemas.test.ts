import { describe, expect, it } from "vitest";
import {
	ListTransactionsQuerySchema,
	TransactionDtoSchema,
} from "./schemas";

describe("isoDateString calendar validation", () => {
	it("rejects impossible calendar dates while keeping format errors", () => {
		const feb31 = ListTransactionsQuerySchema.safeParse({
			dateFrom: "2026-02-31",
		});
		expect(feb31.success).toBe(false);
		if (!feb31.success) {
			expect(feb31.error.issues[0]?.message).toBe("Invalid calendar date");
		}

		const badMonthDay = ListTransactionsQuerySchema.safeParse({
			dateFrom: "2026-13-40",
		});
		expect(badMonthDay.success).toBe(false);
		if (!badMonthDay.success) {
			expect(badMonthDay.error.issues[0]?.message).toBe(
				"Invalid calendar date",
			);
		}

		const badFormat = ListTransactionsQuerySchema.safeParse({
			dateFrom: "2026/02/01",
		});
		expect(badFormat.success).toBe(false);
		if (!badFormat.success) {
			expect(badFormat.error.issues[0]?.message).toBe("Expected YYYY-MM-DD");
		}
	});

	it("accepts valid calendar boundaries for query filters and bookingDate", () => {
		expect(
			ListTransactionsQuerySchema.safeParse({
				dateFrom: "2026-01-01",
				dateTo: "2026-12-31",
			}).success,
		).toBe(true);

		expect(
			ListTransactionsQuerySchema.safeParse({
				dateFrom: "2024-02-29",
				dateTo: "2026-02-28",
			}).success,
		).toBe(true);

		expect(
			ListTransactionsQuerySchema.safeParse({
				dateFrom: "2025-02-29",
			}).success,
		).toBe(false);

		const booking = TransactionDtoSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			accountId: "acc-1",
			amountMinor: 100,
			currency: "PLN",
			direction: "debit",
			type: "transfer",
			title: "Test",
			counterpartyName: null,
			counterpartyAccountNumber: null,
			transferId: null,
			createdAt: "2026-07-26T12:00:00.000Z",
			bookingDate: "2026-04-30",
		});
		expect(booking.success).toBe(true);

		const invalidBooking = TransactionDtoSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			accountId: "acc-1",
			amountMinor: 100,
			currency: "PLN",
			direction: "debit",
			type: "transfer",
			title: "Test",
			counterpartyName: null,
			counterpartyAccountNumber: null,
			transferId: null,
			createdAt: "2026-07-26T12:00:00.000Z",
			bookingDate: "2026-04-31",
		});
		expect(invalidBooking.success).toBe(false);
		if (!invalidBooking.success) {
			expect(invalidBooking.error.issues[0]?.message).toBe(
				"Invalid calendar date",
			);
		}
	});
});
