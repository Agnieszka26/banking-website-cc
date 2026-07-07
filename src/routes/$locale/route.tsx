import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { parseLocale } from "#/lib/i18n/locales";

export const Route = createFileRoute("/$locale")({
	beforeLoad: ({ params }) => {
		const locale = parseLocale(params.locale);
		if (!locale) {
			throw notFound();
		}

		return { locale };
	},
	component: () => <Outlet />,
});
