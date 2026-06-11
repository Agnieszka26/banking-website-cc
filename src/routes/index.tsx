import { createFileRoute } from "@tanstack/react-router";
import Card from "#/components/Card";
import { CarouselComponent } from "#/components/Carousel";
import LoginForm from "#/components/LoginForm";
import { getPokemon } from "#/server/pokemon";
import NewsBanner from "#/components/NewsBanner";

export const Route = createFileRoute("/")({
	component: Home,
	loader: async () => {
		const data = await getPokemon();

		return data;
	},
	pendingComponent: () => <div>Loading...</div>,
	pendingMs: 300,
	errorComponent: () => <div>Error</div>,
});

function Home() {
	return (
		<div id="home">
			<section className="p-8 flex flex-row gap-4">
				<LoginForm />
				<Card />
			</section>
			<section>
				<CarouselComponent />
			</section>
				<NewsBanner />
		</div>
	);
}
