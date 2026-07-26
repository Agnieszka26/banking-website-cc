import { describe, expect, it } from "vitest";
import { toTransactionDto } from "./mappers";

describe("toTransactionDto", () => {
	it("maps ledger entities to public DTOs without Prisma fields", () => {
		const dto = toTransactionDto({
			id: "8f3c1a2e-4b5d-6e7f-8091-a2b3c4d5e6f7",
			accountId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
			amountMinor: 25050,
			currency: "PLN",
			direction: "debit",
			type: "payment",
			title: "Czynsz za lipiec",
			counterpartyName: "Jan Kowalski",
			counterpartyAccountNumber: "PL61109010140000071219812874",
			transferId: null,
			createdAt: new Date("2026-07-25T16:05:12.345Z"),
			bookingDate: new Date("2026-07-25T00:00:00.000Z"),
		});

		expect(dto).toEqual({
			id: "8f3c1a2e-4b5d-6e7f-8091-a2b3c4d5e6f7",
			accountId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
			amountMinor: 25050,
			currency: "PLN",
			direction: "debit",
			type: "payment",
			title: "Czynsz za lipiec",
			counterpartyName: "Jan Kowalski",
			counterpartyAccountNumber: "PL61109010140000071219812874",
			transferId: null,
			createdAt: "2026-07-25T16:05:12.345Z",
			bookingDate: "2026-07-25",
		});
	});
});
