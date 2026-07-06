import { describe, expect, it } from "vitest";
import { parseNewsId } from "#/server/news/schemas";

describe("parseNewsId", () => {
	it("returns a trimmed id", () => {
		expect(parseNewsId(" 42 ")).toBe("42");
	});

	it("rejects empty values", () => {
		expect(() => parseNewsId("")).toThrow("Invalid news id");
		expect(() => parseNewsId("   ")).toThrow("Invalid news id");
		expect(() => parseNewsId(undefined)).toThrow("Invalid news id");
	});
});
