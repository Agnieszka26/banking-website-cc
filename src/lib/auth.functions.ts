import { createServerFn } from "@tanstack/react-start";
import { requireSession, resolveSession } from "#/lib/session.server";

/** Returns the current Better Auth session from request cookies, or `null`. */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
	return resolveSession();
});

/** Returns the current session or throws `Unauthorized` when unauthenticated. */
export const ensureSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return requireSession("throw");
	},
);
