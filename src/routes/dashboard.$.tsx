import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPreferredLocale } from "#/lib/i18n/functions";
import { buildLocalizedPathname, stripLocaleFromPathname } from "#/lib/i18n/paths";

/** Redirects legacy `/dashboard/*` paths to the localized dashboard tree. */
export const Route = createFileRoute("/dashboard/$")({
	beforeLoad: async ({ location }) => {
		const locale = await getPreferredLocale();
		const path = stripLocaleFromPathname(location.pathname) || "/dashboard";
		throw redirect({ to: buildLocalizedPathname(locale, path) });
	},
});
