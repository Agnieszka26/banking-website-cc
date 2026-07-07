const POLISH_ACCOUNT_NUMBER_PATTERN = /^(?:PL)?\d{26}$/;

export function normalizeAccountNumber(value: string): string {
	return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidPolishAccountNumber(value: string): boolean {
	const normalized = normalizeAccountNumber(value);
	return POLISH_ACCOUNT_NUMBER_PATTERN.test(normalized);
}

export function parsePositiveAmount(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const amount = Number.parseFloat(trimmed.replace(",", "."));
	if (!Number.isFinite(amount) || amount <= 0) {
		return null;
	}

	return amount;
}

export function isNonEmpty(value: string): boolean {
	return value.trim().length > 0;
}
