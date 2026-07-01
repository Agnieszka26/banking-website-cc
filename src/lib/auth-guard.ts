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
export type SafeRedirectTarget = {
	pathname: string;
	search: Record<string, string>;
	hash?: string;
};

function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
	const search: Record<string, string> = {};
	for (const [key, value] of searchParams) {
		search[key] = value;
	}
	return search;
}

function toRedirectTarget(url: URL): SafeRedirectTarget | null {
	const { pathname } = url;
	if (!pathname.startsWith("/") || pathname.startsWith("//")) {
		return null;
	}

	return {
		pathname,
		search: parseSearchParams(url.searchParams),
		...(url.hash ? { hash: url.hash.slice(1) } : {}),
	};
}

function getFallbackRedirectTarget(fallback: string): SafeRedirectTarget {
	try {
		const base =
			typeof window !== "undefined"
				? window.location.origin
				: "http://localhost";
		return toRedirectTarget(new URL(fallback, base)) ?? {
			pathname: "/dashboard",
			search: {},
		};
	} catch {
		return { pathname: "/dashboard", search: {} };
	}
}

/** Validates redirect input and returns path, query, and hash separately. */
export function getSafeRedirectTarget(
	redirect: string | undefined,
	fallback = "/dashboard",
): SafeRedirectTarget {
	const fallbackTarget = getFallbackRedirectTarget(fallback);

	if (!redirect) {
		return fallbackTarget;
	}

	if (typeof window === "undefined") {
		if (
			!redirect.startsWith("/") ||
			redirect.startsWith("//") ||
			redirect.includes("\\")
		) {
			return fallbackTarget;
		}

		try {
			return toRedirectTarget(new URL(redirect, "http://localhost")) ?? fallbackTarget;
		} catch {
			return fallbackTarget;
		}
	}

	try {
		const url = new URL(redirect, window.location.origin);
		if (url.origin !== window.location.origin) {
			return fallbackTarget;
		}

		return toRedirectTarget(url) ?? fallbackTarget;
	} catch {
		return fallbackTarget;
	}
}

/** Restricts post-login navigation to same-origin app paths. */
export function getSafeRedirectPath(
	redirect: string | undefined,
	fallback = "/dashboard",
): string {
	const target = getSafeRedirectTarget(redirect, fallback);
	const query = new URLSearchParams(target.search).toString();

	return `${target.pathname}${query ? `?${query}` : ""}${target.hash ? `#${target.hash}` : ""}`;
}
