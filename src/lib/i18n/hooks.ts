import { useCallback } from "react";
import { useLocale } from "#/lib/i18n/context";
import { buildLocalizedPathname } from "#/lib/i18n/paths";

/** Builds pathnames prefixed with the active locale. */
export function useLocalizedPath() {
	const locale = useLocale();

	return useCallback(
		(path: string) => buildLocalizedPathname(locale, path),
		[locale],
	);
}
