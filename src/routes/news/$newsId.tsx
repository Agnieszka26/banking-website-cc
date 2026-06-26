import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Megaphone } from "lucide-react";
import { getNewsById } from "#/server/news/functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/news/$newsId")({
	loader: async ({ params }) => {
		const item = await getNewsById({ data: params.newsId });
		if (!item) throw notFound();
		return item;
	},
	component: RouteComponent,
});

function formatPlDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("pl-PL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function RouteComponent() {
	const item = Route.useLoaderData();

	return (
		<article className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
			<Link to="/news">
				<Button variant="link" className="mb-4 h-auto px-0">
					<ChevronLeft className="mr-1 h-4 w-4" /> Wróć do aktualności
				</Button>
			</Link>

			<div className="mb-2 flex items-center gap-2 text-primary">
				<Megaphone className="h-5 w-5 shrink-0" />
				<span className="text-xs text-muted-foreground">
					{formatPlDate(item.created_at)}
				</span>
				{item.category && (
					<span className="text-xs font-medium uppercase tracking-wide">
						· {item.category}
					</span>
				)}
			</div>

			<h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
				{item.title}
			</h1>

			{item.subtitle && (
				<p className="mb-4 text-lg text-muted-foreground">{item.subtitle}</p>
			)}

			{item.body && (
				<div className="prose prose-sm max-w-none whitespace-pre-line leading-relaxed text-foreground">
					{item.body}
				</div>
			)}
		</article>
	);
}
