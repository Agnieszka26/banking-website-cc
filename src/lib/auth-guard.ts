import { redirect } from "@tanstack/react-router";
import { resolveSession, toAuthenticatedUser } from "#/lib/session";
import type { AuthenticatedUser } from "#/lib/session-user";

export type { AuthenticatedUser } from "#/lib/session-user";
export {
	getSafeRedirectPath,
	getSafeRedirectTarget,
	type SafeRedirectTarget,
} from "#/lib/redirect-safety";

/** Resolves the session or redirects unauthenticated users to sign-in. */
export async function requireAuthenticatedUser(location: {
	href: string;
}): Promise<AuthenticatedUser> {
	const session = await resolveSession();

	if (!session) {
		throw redirect({
			to: "/sign-in/$",
			search: { redirect: location.href },
		});
	}

	return toAuthenticatedUser(session);
}
