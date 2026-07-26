import { describe, expect, it } from "vitest";
import { fromMinorBigInt, toMinorBigInt } from "#/lib/money";

describe("money minor-unit conversion", () => {
	it("round-trips safe integers", () => {
		expect(fromMinorBigInt(toMinorBigInt(1050))).toBe(1050);
		expect(fromMinorBigInt(toMinorBigInt(0))).toBe(0);
	});

	it("rejects unsafe numbers", () => {
		expect(() => toMinorBigInt(Number.MAX_SAFE_INTEGER + 1)).toThrow(
			RangeError,
		);
		expect(() => toMinorBigInt(1.5)).toThrow(RangeError);
	});

	it("rejects bigint values outside the safe integer range", () => {
		expect(() => fromMinorBigInt(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow(
			RangeError,
		);
	});
});
