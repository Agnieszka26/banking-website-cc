import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

export function CarouselComponent() {
	// TODO: Replace with real carousel content (e.g., promotional banners, announcements)
	const slides = ["Slide 1", "Slide 2", "Slide 3"];

	return (
		<Carousel className="w-full">
			<CarouselContent className="-ml-2 sm:-ml-4">
				{slides.map((slide) => (
					<CarouselItem
						key={slide}
						className="pl-2 sm:pl-4 basis-full"
					>
						<div className="flex items-center justify-center h-44 sm:h-52 lg:h-60 rounded-xl bg-muted border border-border text-muted-foreground font-medium">
							{slide}
						</div>
					</CarouselItem>
				))}
			</CarouselContent>

			<CarouselPrevious className="left-2 sm:left-4" />
			<CarouselNext className="right-2 sm:right-4" />
		</Carousel>
	);
}
