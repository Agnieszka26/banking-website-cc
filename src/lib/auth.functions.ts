import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

/** Returns the current Better Auth session from request cookies, or `null`. */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	return auth.api.getSession({ headers });
});

/** Returns the current session or throws `Unauthorized` when unauthenticated. */
export const ensureSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new Error("Unauthorized");
		}

		return session;
	},
);
