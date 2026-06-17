import { createFileRoute } from "@tanstack/react-router";
import Card from "#/components/Card";
import { CarouselComponent } from "#/components/Carousel";
import LoginForm from "#/components/LoginForm";
import NewsBanner from "#/components/NewsBanner";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	console.log("Home rendered");
	return (
		<div
			id="home"
			className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10 lg:space-y-12"
		>
			<section className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
				<LoginForm />
				<Card />
			</section>
			<section className="w-full">
				<CarouselComponent />
			</section>
			<NewsBanner />
		</div>
	);
}
