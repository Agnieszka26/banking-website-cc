import { readLocaleFromCookieHeader } from "#/lib/i18n/cookie";
import {
	DEFAULT_LOCALE,
	isLocale,
	type Locale,
	SUPPORTED_LOCALES,
} from "#/lib/i18n/locales";
import type { SafeRedirectTarget } from "#/lib/redirect-safety";

const LOCALE_PREFIX_PATTERN = new RegExp(
	`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`,
);

/** Extracts the locale prefix from a pathname, if present. */
export function getLocaleFromPathname(pathname: string): Locale | null {
	const match = pathname.match(LOCALE_PREFIX_PATTERN);
	if (!match?.[1] || !isLocale(match[1])) {
		return null;
	}
	return match[1];
}

/** Removes the leading `/{locale}` segment from a pathname. */
export function stripLocaleFromPathname(pathname: string): string {
	const withoutLocale = pathname.replace(LOCALE_PREFIX_PATTERN, "");
	if (!withoutLocale || withoutLocale === "") {
		return "/";
	}
	return withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
}

/** Builds a localized pathname, preserving the page path. */
export function buildLocalizedPathname(
	locale: Locale,
	pathWithoutLocale: string,
): string {
	const normalized =
		pathWithoutLocale === "/" ? "" : stripLocaleFromPathname(pathWithoutLocale);
	return `/${locale}${normalized}`;
}

/** Maps a pathname from one locale to another while preserving the suffix. */
export function switchLocaleInPathname(
	pathname: string,
	nextLocale: Locale,
): string {
	const suffix = stripLocaleFromPathname(pathname);
	return buildLocalizedPathname(nextLocale, suffix);
}

export function resolveLocaleFromPathname(pathname: string): Locale {
	return getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE;
}

/**
 * Resolves the active locale from the URL, falling back to the persisted cookie
 * on the client when the path has no locale prefix (e.g. legacy redirect hops).
 */
export function resolveAppLocale(pathname: string): Locale {
	const fromPath = getLocaleFromPathname(pathname);
	if (fromPath) {
		return fromPath;
	}

	if (typeof document !== "undefined") {
		const fromCookie = readLocaleFromCookieHeader(document.cookie);
		if (fromCookie && isLocale(fromCookie)) {
			return fromCookie;
		}
	}

	return DEFAULT_LOCALE;
}

/** Prefixes a validated post-login redirect target with the active locale. */
export function localizeRedirectTarget(
	target: SafeRedirectTarget,
	locale: Locale,
): SafeRedirectTarget {
	return {
		...target,
		pathname: buildLocalizedPathname(locale, target.pathname),
	};
}
