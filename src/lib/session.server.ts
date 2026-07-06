import "@tanstack/react-start/server-only";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export type AuthSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type { AuthenticatedUser } from "#/lib/session-user";
export { toAuthenticatedUser } from "#/lib/session-user";

/** Returns the current session from request cookies, or `null`. */
export async function resolveSession(): Promise<AuthSession | null> {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	return session ?? null;
}

export type RequireSessionMode = "throw" | "unauthorized";

/**
 * Returns the current session or rejects unauthenticated requests.
 * Use `unauthorized` for server functions that should respond with HTTP 401.
 */
export async function requireSession(
	mode: RequireSessionMode = "throw",
): Promise<AuthSession> {
	const session = await resolveSession();

	if (!session) {
		if (mode === "unauthorized") {
			throw new Response("Unauthorized", { status: 401 });
		}

		throw new Error("Unauthorized");
	}

	return session;
}

/** Returns the authenticated user's id or rejects unauthenticated requests. */
export async function requireUserId(
	mode: RequireSessionMode = "throw",
): Promise<string> {
	const session = await requireSession(mode);
	return session.user.id;
}
