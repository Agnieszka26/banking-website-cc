import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPreferredLocale } from "#/lib/i18n/functions";
import { buildLocalizedPathname } from "#/lib/i18n/paths";

export const Route = createFileRoute("/sign-up/$")({
	beforeLoad: async () => {
		const locale = await getPreferredLocale();
		throw redirect({ to: buildLocalizedPathname(locale, "/sign-up") });
	},
});
