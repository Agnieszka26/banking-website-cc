import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news/$newsId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { newsId } = Route.useParams();
	return <div>Hello "/news/`${newsId}`"!</div>;
}
