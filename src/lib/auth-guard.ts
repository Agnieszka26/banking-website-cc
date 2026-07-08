import { redirect } from "@tanstack/react-router";
import { resolveAppLocale } from "#/lib/i18n/paths";
import {
	type AuthenticatedUser,
	type SessionUserSource,
	toAuthenticatedUser,
} from "#/lib/session-user";

export { getSafeRedirectTarget } from "#/lib/redirect-safety";

type RouteSession = SessionUserSource | null;

/**
 * Maps a session from `getSession()` to route context, or redirects to sign-in.
 * Safe for route modules — does not import server-only APIs.
 */
export function authenticateRouteUser(
	session: RouteSession,
	location: { href: string; pathname: string },
): AuthenticatedUser {
	if (!session) {
		const locale = resolveAppLocale(location.pathname);
		throw redirect({
			to: "/$locale/sign-in/$",
			params: { locale },
			search: { redirect: location.href },
		});
	}

	return toAuthenticatedUser(session);
}
