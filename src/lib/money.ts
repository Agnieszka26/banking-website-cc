/**
 * Safe conversion between API `number` minor units and Prisma/Postgres `bigint`.
 * API contract caps at Number.MAX_SAFE_INTEGER to avoid JS precision loss.
 */

export const MAX_SAFE_MINOR_UNITS = Number.MAX_SAFE_INTEGER;

export function toMinorBigInt(value: number): bigint {
	if (!Number.isSafeInteger(value)) {
		throw new RangeError("Minor units must be a safe integer.");
	}

	return BigInt(value);
}

export function fromMinorBigInt(value: bigint): number {
	if (
		value > BigInt(MAX_SAFE_MINOR_UNITS) ||
		value < BigInt(Number.MIN_SAFE_INTEGER)
	) {
		throw new RangeError("Minor units exceed the safe integer range.");
	}

	return Number(value);
}
