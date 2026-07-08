import { createFileRoute } from "@tanstack/react-router";
import Card from "#/components/Card";
import { CarouselComponent } from "#/components/Carousel";
import { HomeAuthPanel } from "#/components/HomeAuthPanel";
import NewsBanner from "#/components/NewsBanner";
import { getSession } from "#/lib/auth.functions";
import { getNews } from "#/server/news/functions";
import { toAuthenticatedUser } from "#/lib/session-user";

export const Route = createFileRoute("/$locale/")({
	loader: async () => {
		const [news, session] = await Promise.all([getNews(), getSession()]);

		return {
			news,
			user: session ? toAuthenticatedUser(session) : null,
		};
	},
	component: Home,
});

function Home() {
	const { news, user } = Route.useLoaderData();
	const latest = news[0] ?? null;

	return (
		<div
			id="home"
			className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10 lg:space-y-12"
		>
			<section className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
				<HomeAuthPanel initialUser={user} />
				<Card />
			</section>
			<section className="w-full">
				<CarouselComponent />
			</section>
			<NewsBanner latest={latest} />
		</div>
	);
}
