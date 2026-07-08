import { describe, expect, it } from "vitest";
import {
	isValidPolishAccountNumber,
	normalizeAccountNumber,
	parsePositiveAmount,
} from "#/components/dashboard/transfers/validation";

describe("transfer validation", () => {
	it("normalizes account numbers", () => {
		expect(normalizeAccountNumber("26 1234 5678 9012 3456 7890 1234")).toBe(
			"26123456789012345678901234",
		);
	});

	it("validates polish account numbers", () => {
		expect(isValidPolishAccountNumber("26123456789012345678901234")).toBe(true);
		expect(isValidPolishAccountNumber("PL61123456789012345678901234")).toBe(
			true,
		);
		expect(isValidPolishAccountNumber("123")).toBe(false);
	});

	it("parses positive amounts", () => {
		expect(parsePositiveAmount("10.50")).toBe(10.5);
		expect(parsePositiveAmount("0")).toBeNull();
		expect(parsePositiveAmount("-1")).toBeNull();
	});
});
