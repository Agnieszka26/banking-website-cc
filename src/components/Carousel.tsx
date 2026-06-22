import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import slide1 from "./../../public/assets/slide1.png";
import slide2 from "./../../public/assets/slide2.png";
import slide3 from "./../../public/assets/slide3.png";


export function CarouselComponent() {
	const slides = [{
		image: slide1,
		title: "bezpieczenstwo priorytetem"
	},
	{
		image: slide2,
		title: "planuj dziś ciesz się jutrem",
	},
	{
		image: slide3,
		title: "bankowość prosta i bezpieczna",
	}
];

	return (
		<Carousel className="w-full">
			<CarouselContent className="-ml-2 sm:-ml-4">
				{slides.map(({image, title}) => (
					<CarouselItem
						key={title}
						className="pl-2 sm:pl-4 basis-full"
					>
						<div className="flex items-center justify-center h-44 sm:h-52 lg:h-120 rounded-xl bg-muted border border-border text-muted-foreground font-medium">
							<img src={image} alt={title}  />
						</div>
					</CarouselItem>
				))}
			</CarouselContent>

			<CarouselPrevious className="left-2 sm:left-4" />
			<CarouselNext className="right-2 sm:right-4" />
		</Carousel>
	);
}
