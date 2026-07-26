import "@tanstack/react-start/server-only";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import { AppError } from "#/lib/errors";

export type AuthSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>;

/** Returns the current session from request cookies, or `null`. */
export async function resolveSession(): Promise<AuthSession | null> {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	return session ?? null;
}

export type RequireSessionMode = "throw" | "unauthorized";

/**
 * Returns the current session or rejects unauthenticated requests.
 *
 * - `throw` (default): typed {@link AppError} with code `UNAUTHORIZED`
 * - `unauthorized`: HTTP 401 {@link Response} with the API error envelope
 *   (used by existing createServerFn handlers that expect a Response)
 */
export async function requireSession(
	mode: RequireSessionMode = "throw",
): Promise<AuthSession> {
	const session = await resolveSession();

	if (!session) {
		const error = new AppError("UNAUTHORIZED", "Authentication required.");
		if (mode === "unauthorized") {
			throw error.toResponse();
		}

		throw error;
	}

	return session;
}

/**
 * Returns the authenticated user's id or rejects unauthenticated requests.
 * Must only be called from server code.
 */
export async function requireUserId(
	mode: RequireSessionMode = "throw",
): Promise<string> {
	const session = await requireSession(mode);
	return session.user.id;
}
