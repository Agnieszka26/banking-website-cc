import { randomBytes } from "node:crypto";

/**
 * Fictional bank settlement number reserved for this banking simulation.
 * Not a real Polish bank code — IBANs belong to the application domain.
 */
export const INTERNAL_BANK_CODE = "10901014";

const POLISH_IBAN_PATTERN = /^PL\d{26}$/;

/** Mod-97 over an arbitrarily long digit string (IBAN check algorithm). */
function mod97(digitString: string): number {
	let remainder = 0;
	for (const char of digitString) {
		remainder = (remainder * 10 + Number(char)) % 97;
	}
	return remainder;
}

function expandIbanCharset(value: string): string {
	let expanded = "";
	for (const char of value) {
		if (char >= "A" && char <= "Z") {
			expanded += String(char.charCodeAt(0) - 55);
		} else {
			expanded += char;
		}
	}
	return expanded;
}

/** ISO 13616 check digits for a country code + BBAN. */
export function computeIbanCheckDigits(countryCode: string, bban: string): string {
	const rearranged = `${bban}${countryCode}00`;
	const checksum = 98 - mod97(expandIbanCharset(rearranged));
	return String(checksum).padStart(2, "0");
}

/**
 * Normalizes user/form input to `PL` + 26 digits (no spaces).
 * Accepts optional `PL` prefix and whitespace.
 */
export function normalizePolishIban(value: string): string {
	const compact = value.replace(/\s+/g, "").toUpperCase();
	if (compact.startsWith("PL")) {
		return compact;
	}
	if (/^\d{26}$/.test(compact)) {
		return `PL${compact}`;
	}
	return compact;
}

export function isValidPolishIban(value: string): boolean {
	const normalized = normalizePolishIban(value);
	if (!POLISH_IBAN_PATTERN.test(normalized)) {
		return false;
	}

	const checkDigits = normalized.slice(2, 4);
	const bban = normalized.slice(4);
	return computeIbanCheckDigits("PL", bban) === checkDigits;
}

/** Formats IBAN in groups of 4 for display. */
export function formatPolishIban(value: string): string {
	const normalized = normalizePolishIban(value);
	return normalized.replace(/(.{4})(?=.)/g, "$1 ").trim();
}

/** Last 4 digits of the BBAN for masked display. */
export function ibanMask(value: string): string {
	const normalized = normalizePolishIban(value);
	return normalized.slice(-4);
}

/**
 * Generates a unique application-domain Polish IBAN.
 * BBAN layout: 8-digit bank code + 16-digit serial (24 digits).
 * Full IBAN: `PL` + 2 check digits + BBAN (28 characters / `PL` + 26 digits).
 */
function randomSerial16(): string {
	const value = randomBytes(8).readBigUInt64BE() % 10_000_000_000_000_000n;
	return value.toString().padStart(16, "0");
}

export function generatePolishIban(serial?: string): string {
	const accountSerial = serial ?? randomSerial16();
	if (!/^\d{16}$/.test(accountSerial)) {
		throw new RangeError("IBAN serial must be exactly 16 digits.");
	}

	const bban = `${INTERNAL_BANK_CODE}${accountSerial}`;
	const checkDigits = computeIbanCheckDigits("PL", bban);
	return `PL${checkDigits}${bban}`;
}
