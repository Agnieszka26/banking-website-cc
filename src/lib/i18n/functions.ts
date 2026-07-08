import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { readLocaleFromCookieHeader } from "#/lib/i18n/cookie";
import {
	DEFAULT_LOCALE,
	isLocale,
	type Locale,
} from "#/lib/i18n/locales";

/** Resolves the preferred locale from the `banking-locale` cookie (SSR-safe). */
export const getPreferredLocale = createServerFn({ method: "GET" }).handler(
	async (): Promise<Locale> => {
		const cookieHeader = getRequestHeaders().get("cookie");
		const fromCookie = readLocaleFromCookieHeader(cookieHeader);
		if (fromCookie && isLocale(fromCookie)) {
			return fromCookie;
		}
		return DEFAULT_LOCALE;
	},
);
