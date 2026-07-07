export const SUPPORTED_LOCALES = ["en", "pl", "fr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";

export const LOCALE_COOKIE = "banking-locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type LocaleOption = {
	value: Locale;
	label: string;
};

/** Native language names for the switcher UI. */
export const LOCALE_OPTIONS: LocaleOption[] = [
	{ value: "en", label: "English" },
	{ value: "pl", label: "Polski" },
	{ value: "fr", label: "Français" },
];

export function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: string | undefined): Locale | null {
	if (!value) {
		return null;
	}
	return isLocale(value) ? value : null;
}

export function getLocaleLabel(locale: Locale): string {
	return LOCALE_OPTIONS.find((option) => option.value === locale)?.label ?? locale;
}
