import { describe, expect, it } from "vitest";
import {
	generatePolishIban,
	isValidPolishIban,
	normalizePolishIban,
} from "#/lib/iban";

describe("iban", () => {
	it("normalizes whitespace and optional PL prefix", () => {
		expect(normalizePolishIban("26 1234 5678 9012 3456 7890 1234")).toBe(
			"PL26123456789012345678901234",
		);
		expect(normalizePolishIban("pl61109010140000071219812874")).toBe(
			"PL61109010140000071219812874",
		);
	});

	it("generates valid Polish IBANs with check digits", () => {
		const iban = generatePolishIban("0000000000000042");
		expect(iban).toBe("PL64109010140000000000000042");
		expect(isValidPolishIban(iban)).toBe(true);
	});

	it("rejects IBANs with invalid check digits", () => {
		const valid = generatePolishIban("0000000000000042");
		const broken = `${valid.slice(0, 2)}00${valid.slice(4)}`;
		expect(isValidPolishIban(broken)).toBe(false);
	});
});
