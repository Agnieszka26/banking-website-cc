import { describe, expect, it } from "vitest";
import { CreateTransferRequestSchema } from "./schemas";

const validBody = {
	sourceAccountId: "src-account",
	destinationAccountId: "dst-account",
	amountMinor: 10_050,
	title: "Own transfer",
};

describe("CreateTransferRequestSchema", () => {
	it("accepts a valid payload and defaults currency to PLN", () => {
		const parsed = CreateTransferRequestSchema.safeParse(validBody);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data).toEqual({
				...validBody,
				currency: "PLN",
			});
		}
	});

	it("preserves an explicit currency when provided", () => {
		const parsed = CreateTransferRequestSchema.safeParse({
			...validBody,
			currency: "EUR",
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.currency).toBe("EUR");
		}
	});

	it("rejects missing required fields", () => {
		expect(CreateTransferRequestSchema.safeParse({}).success).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				destinationAccountId: "dst",
				amountMinor: 100,
				title: "x",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				sourceAccountId: "src",
				amountMinor: 100,
				title: "x",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				sourceAccountId: "src",
				destinationAccountId: "dst",
				title: "x",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 100,
			}).success,
		).toBe(false);
	});

	it("rejects empty account ids", () => {
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				sourceAccountId: "",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				destinationAccountId: "",
			}).success,
		).toBe(false);
	});

	it("rejects invalid amounts (zero, negative, non-integer, non-finite)", () => {
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				amountMinor: 0,
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				amountMinor: -100,
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				amountMinor: 10.5,
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				amountMinor: Number.NaN,
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				amountMinor: Number.POSITIVE_INFINITY,
			}).success,
		).toBe(false);
	});

	it("rejects identical source and destination accounts", () => {
		const parsed = CreateTransferRequestSchema.safeParse({
			...validBody,
			destinationAccountId: validBody.sourceAccountId,
		});
		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues.some((issue) =>
				issue.path.includes("destinationAccountId"),
			)).toBe(true);
		}
	});

	it("rejects empty or oversized titles and invalid currency codes", () => {
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				title: "",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				title: "x".repeat(141),
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				currency: "pln",
			}).success,
		).toBe(false);
		expect(
			CreateTransferRequestSchema.safeParse({
				...validBody,
				currency: "EURO",
			}).success,
		).toBe(false);
	});
});
