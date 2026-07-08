import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "#/lib/i18n";

export const Route = createFileRoute("/$locale/contact")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "Contact",
				description: "Contact page",
				keywords: "contact, page",
				author: "Baking App",
			},
		],
	}),
});

function RouteComponent() {
	const  t  = useTranslation();
	return <div>{t("contact.placeholder")}</div>;
}
