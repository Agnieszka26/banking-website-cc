import { describe, expect, it } from "vitest";
import {
	isNonEmpty,
	isValidPolishAccountNumber,
	normalizeAccountNumber,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";

describe("normalizeAccountNumber", () => {
	it("strips whitespace, uppercases, and adds PL prefix when missing", () => {
		expect(normalizeAccountNumber("26 1234 5678 9012 3456 7890 1234")).toBe(
			"PL26123456789012345678901234",
		);
		expect(normalizeAccountNumber("pl61109010140000071219812874")).toBe(
			"PL61109010140000071219812874",
		);
	});
});

describe("isValidPolishAccountNumber", () => {
	it("accepts 26-digit and PL-prefixed numbers", () => {
		expect(isValidPolishAccountNumber("26123456789012345678901234")).toBe(true);
		expect(isValidPolishAccountNumber("PL61123456789012345678901234")).toBe(
			true,
		);
		expect(
			isValidPolishAccountNumber("26 1234 5678 9012 3456 7890 1234"),
		).toBe(true);
	});

	it("rejects invalid account numbers", () => {
		expect(isValidPolishAccountNumber("")).toBe(false);
		expect(isValidPolishAccountNumber("123")).toBe(false);
		expect(isValidPolishAccountNumber("2612345678901234567890123")).toBe(false);
		expect(isValidPolishAccountNumber("261234567890123456789012345")).toBe(
			false,
		);
		expect(isValidPolishAccountNumber("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe(
			false,
		);
	});
});

describe("parsePositiveAmount", () => {
	it("parses valid positive amounts including comma decimals", () => {
		expect(parsePositiveAmount("10.50")).toBe(10.5);
		expect(parsePositiveAmount("10,50")).toBe(10.5);
		expect(parsePositiveAmount(" 100 ")).toBe(100);
		expect(parsePositiveAmount("0.01")).toBe(0.01);
	});

	it("rejects empty, zero, negative, NaN, and malformed input", () => {
		expect(parsePositiveAmount("")).toBeNull();
		expect(parsePositiveAmount("   ")).toBeNull();
		expect(parsePositiveAmount("0")).toBeNull();
		expect(parsePositiveAmount("0.0")).toBeNull();
		expect(parsePositiveAmount("-1")).toBeNull();
		expect(parsePositiveAmount("-0.01")).toBeNull();
		expect(parsePositiveAmount("NaN")).toBeNull();
		expect(parsePositiveAmount("abc")).toBeNull();
		expect(parsePositiveAmount("not-a-number")).toBeNull();
	});
});

describe("isNonEmpty", () => {
	it("requires non-whitespace content", () => {
		expect(isNonEmpty("title")).toBe(true);
		expect(isNonEmpty("  x  ")).toBe(true);
		expect(isNonEmpty("")).toBe(false);
		expect(isNonEmpty("   ")).toBe(false);
	});
});
