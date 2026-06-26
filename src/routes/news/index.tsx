import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Megaphone } from "lucide-react";
import { getNews } from "#/server/news/functions";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/news/")({
	loader: () => getNews(),
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
	const news = Route.useLoaderData();

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
			<header className="mb-6 flex items-center gap-2 sm:mb-8">
				<Megaphone className="h-6 w-6 shrink-0 text-primary" />
				<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
					Aktualności
				</h1>
			</header>

			{news.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					Brak aktualnych komunikatów.
				</p>
			) : (
				<ul className="space-y-3 sm:space-y-4">
					{news.map((item) => (
						<li key={item.id}>
							<Link
								to="/news/$newsId"
								params={{ newsId: String(item.id) }}
								className="block"
							>
								<Card className="transition-shadow hover:shadow-md">
									<CardContent className="flex items-start gap-4 p-4 sm:p-5">
										<div className="min-w-0 flex-1 space-y-1">
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<span>{formatPlDate(item.created_at)}</span>
												{item.category && (
													<>
														<span aria-hidden>·</span>
														<span className="font-medium uppercase tracking-wide text-primary">
															{item.category}
														</span>
													</>
												)}
											</div>
											<div className="font-semibold leading-snug">
												{item.title}
											</div>
											{item.subtitle && (
												<p className="line-clamp-2 text-sm text-muted-foreground">
													{item.subtitle}
												</p>
											)}
										</div>
										<ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
									</CardContent>
								</Card>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
