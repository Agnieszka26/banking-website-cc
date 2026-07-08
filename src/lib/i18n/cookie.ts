import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "#/lib/i18n/locales";

const COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`);

/** Parses the locale cookie from a raw `Cookie` header value. */
export function readLocaleFromCookieHeader(
	cookieHeader: string | null | undefined,
): Locale | null {
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(COOKIE_PATTERN);
	if (!match?.[1]) {
		return null;
	}

	try {
		return decodeURIComponent(match[1]) as Locale;
	} catch {
		return null;
	}
}

/** Persists locale preference in a first-party cookie (client-side). */
export function writeLocaleCookie(locale: Locale): void {
	if (typeof document === "undefined") {
		return;
	}

	document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
}
