import {
	DEFAULT_LOCALE,
	isLocale,
	type Locale,
	SUPPORTED_LOCALES,
} from "#/lib/i18n/locales";

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
