export function normalizeAccountNumber(value: string): string {
	const compact = value.replace(/\s+/g, "").toUpperCase();
	if (/^\d{26}$/.test(compact)) {
		return `PL${compact}`;
	}
	return compact;
}

export function isValidPolishAccountNumber(value: string): boolean {
	return /^PL\d{26}$/.test(normalizeAccountNumber(value));
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
