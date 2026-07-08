import { useRouterState } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { writeLocaleCookie } from "#/lib/i18n/cookie";
import type { Locale } from "#/lib/i18n/locales";
import { getMessages, type Messages, translate } from "#/lib/i18n/messages";
import {
	getLocaleFromPathname,
	resolveAppLocale,
} from "#/lib/i18n/paths";

type I18nContextValue = {
	locale: Locale;
	messages: Messages;
	t: (key: string, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
	locale: Locale;
	children: ReactNode;
};

export function I18nProvider({ locale, children }: I18nProviderProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const value = useMemo<I18nContextValue>(() => {
		const messages = getMessages(locale);
		return {
			locale,
			messages,
			t: (key, values) => translate(messages, key, values),
		};
	}, [locale]);

	useEffect(() => {
		document.documentElement.lang = locale;
		// Only persist when the URL carries an explicit locale — avoids overwriting
		// the cookie with DEFAULT_LOCALE during legacy non-localized redirect hops.
		if (getLocaleFromPathname(pathname)) {
			writeLocaleCookie(locale);
		}
	}, [locale, pathname]);

	return (
		<I18nContext.Provider value={value}>{children}</I18nContext.Provider>
	);
}

export function useI18n(): I18nContextValue {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useI18n must be used within I18nProvider");
	}
	return context;
}

function useResolvedLocale(): Locale {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	return resolveAppLocale(pathname);
}

/** Shorthand for `useI18n().t`, with URL-based fallback outside the provider. */
export function useTranslation() {
	const locale = useResolvedLocale();
	const messages = useMemo(() => getMessages(locale), [locale]);
	return useMemo(
		() => (key: string, values?: Record<string, string | number>) =>
			translate(messages, key, values),
		[messages],
	);
}

/** Returns the active locale from context or the current URL. */
export function useLocale(): Locale {
	return useResolvedLocale();
}
