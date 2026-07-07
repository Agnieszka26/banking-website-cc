export {
	DEFAULT_LOCALE,
	getLocaleLabel,
	isLocale,
	LOCALE_COOKIE,
	LOCALE_OPTIONS,
	parseLocale,
	SUPPORTED_LOCALES,
	type Locale,
	type LocaleOption,
} from "#/lib/i18n/locales";
export { writeLocaleCookie } from "#/lib/i18n/cookie";
export {
	buildLocalizedPathname,
	getLocaleFromPathname,
	localizeRedirectTarget,
	resolveAppLocale,
	resolveLocaleFromPathname,
	stripLocaleFromPathname,
	switchLocaleInPathname,
} from "#/lib/i18n/paths";
export { getMessages, translate, type Messages } from "#/lib/i18n/messages";
export { getPreferredLocale } from "#/lib/i18n/functions";
export { I18nProvider, useI18n, useLocale, useTranslation } from "#/lib/i18n/context";
export { useLocalizedPath } from "#/lib/i18n/hooks";
