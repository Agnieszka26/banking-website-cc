import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

export function CarouselComponent() {
	return (
		<Carousel className="w-full max-w-md">
			<CarouselContent>
				<CarouselItem>Slide 1</CarouselItem>
				<CarouselItem>Slide 2</CarouselItem>
				<CarouselItem>Slide 3</CarouselItem>
			</CarouselContent>

			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}
