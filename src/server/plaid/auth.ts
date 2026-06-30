import "@tanstack/react-start/server-only";
import { getRequestHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

type AuthSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>;

/** Requires an authenticated Better Auth session or responds with 401. */
export async function requireSession(): Promise<AuthSession> {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return session;
}

/** Returns the authenticated user's id or responds with 401. */
export async function requireUserId(): Promise<string> {
	const session = await requireSession();
	return session.user.id;
}
