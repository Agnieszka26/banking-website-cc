import { createServerFn } from "@tanstack/react-start";
import { resolveSession } from "#/lib/session.server";

/** Returns the current Better Auth session from request cookies, or `null`. */
export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return resolveSession();
	},
);
