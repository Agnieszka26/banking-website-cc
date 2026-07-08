import {
	createRouter as createTanStackRouter,
	type AnyRouter,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Creates the TanStack Router instance used by the app. */
export function getRouter(): AnyRouter {
	return createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});
}
