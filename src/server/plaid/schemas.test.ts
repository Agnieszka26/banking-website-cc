import { describe, expect, it } from "vitest";
import { parsePublicTokenInput } from "#/server/plaid/schemas";

describe("parsePublicTokenInput", () => {
	it("returns a trimmed token for valid input", () => {
		expect(parsePublicTokenInput({ publicToken: "  public-sandbox-token  " })).toEqual({
			publicToken: "public-sandbox-token",
		});
	});

	it("rejects missing payloads", () => {
		expect(() => parsePublicTokenInput(null)).toThrow("Invalid public token");
		expect(() => parsePublicTokenInput({})).toThrow("Invalid public token");
	});

	it("rejects tokens that are too short", () => {
		expect(() => parsePublicTokenInput({ publicToken: "short" })).toThrow(
			"Invalid public token",
		);
	});
});
