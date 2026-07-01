import { redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/auth.functions";

export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
};

/** Resolves the session or redirects unauthenticated users to sign-in. */
export async function requireAuthenticatedUser(location: {
	href: string;
}): Promise<AuthenticatedUser> {
	const session = await getSession();

	if (!session) {
		throw redirect({
			to: "/sign-in/$",
			search: { redirect: location.href },
		});
	}

	return {
		id: session.user.id,
		name: session.user.name || session.user.username || "Użytkownik",
		email: session.user.email,
	};
}

/** Restricts post-login navigation to same-origin app paths. */
export function getSafeRedirectPath(
	redirect: string | undefined,
	fallback = "/dashboard",
): string {
	if (!redirect) {
		return fallback;
	}

	if (redirect.startsWith("/") && !redirect.startsWith("//")) {
		return redirect;
	}

	if (typeof window === "undefined") {
		return fallback;
	}

	try {
		const url = new URL(redirect, window.location.origin);
		if (url.origin !== window.location.origin) {
			return fallback;
		}

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}
