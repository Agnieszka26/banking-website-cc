import { describe, expect, it } from "vitest";
import { formatPlDate } from "#/server/plaid/format";

describe("formatPlDate", () => {
	it("formats ISO dates for Polish display", () => {
		expect(formatPlDate("2025-04-24")).toBe("24.04.2025");
	});

	it("rejects invalid formats", () => {
		expect(() => formatPlDate("24.04.2025")).toThrow("Invalid date format");
	});
});
