import { redirect } from "@tanstack/react-router";
import {
	toAuthenticatedUser,
	type AuthenticatedUser,
	type SessionUserSource,
} from "#/lib/session-user";

export { getSafeRedirectTarget } from "#/lib/redirect-safety";

type RouteSession = SessionUserSource | null;

/**
 * Maps a session from `getSession()` to route context, or redirects to sign-in.
 * Safe for route modules — does not import server-only APIs.
 */
export function authenticateRouteUser(
	session: RouteSession,
	location: { href: string },
): AuthenticatedUser {
	if (!session) {
		throw redirect({
			to: "/sign-in/$",
			search: { redirect: location.href },
		});
	}

	return toAuthenticatedUser(session);
}
