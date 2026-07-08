/** Restricts post-login navigation to same-origin app paths. */
export type SafeRedirectTarget = {
	pathname: string;
	search: Record<string, string>;
	hash?: string;
};

function parseSearchParams(
	searchParams: URLSearchParams,
): Record<string, string> {
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
		return (
			toRedirectTarget(new URL(fallback, base)) ?? {
				pathname: "/dashboard",
				search: {},
			}
		);
	} catch {
		return { pathname: "/dashboard", search: {} };
	}
}

/** Rejects non-path inputs and dangerous URI schemes such as javascript: or data:. */
function isUnsafeRedirectInput(redirect: string): boolean {
	if (redirect.startsWith("//") || redirect.includes("\\")) {
		return true;
	}

	if (redirect.startsWith("/")) {
		return false;
	}

	if (/^(javascript|data|vbscript|file):/i.test(redirect)) {
		return true;
	}

	if (/^https?:\/\//i.test(redirect)) {
		return false;
	}

	return (
		/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(redirect) || !redirect.startsWith("/")
	);
}

/** Parses a redirect against a trusted origin; rejects cross-origin and non-http(s) URLs. */
function parseSameOriginRedirectUrl(
	redirect: string,
	origin: string,
): URL | null {
	if (isUnsafeRedirectInput(redirect)) {
		return null;
	}

	try {
		const url = new URL(redirect, origin);
		if (url.origin !== origin) {
			return null;
		}

		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}

		return url;
	} catch {
		return null;
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

	const origin =
		typeof window === "undefined" ? "http://localhost" : window.location.origin;

	const url = parseSameOriginRedirectUrl(redirect, origin);
	if (!url) {
		return fallbackTarget;
	}

	return toRedirectTarget(url) ?? fallbackTarget;
}

/** Serializes a safe redirect target back to a path string. */
export function getSafeRedirectPath(
	redirect: string | undefined,
	fallback = "/dashboard",
): string {
	const target = getSafeRedirectTarget(redirect, fallback);
	const query = new URLSearchParams(target.search).toString();

	return `${target.pathname}${query ? `?${query}` : ""}${target.hash ? `#${target.hash}` : ""}`;
}
