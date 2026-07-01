import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Better Auth React client configured for identifier-based login. */
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
	plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Identifier-based login: authenticates by username/identifier + password.
 * @param input.identifier - User identifier (normalized to lowercase).
 * @param input.password - Account password.
 * @param input.rememberMe - Whether to extend the session lifetime.
 * @returns Better Auth `{ data, error }` result (does not throw on auth failure).
 */
export function loginWithIdentifier(input: {
	identifier: string;
	password: string;
	rememberMe?: boolean;
}) {
	return authClient.signIn.username({
		username: input.identifier.trim().toLowerCase(),
		password: input.password,
		rememberMe: input.rememberMe,
	});
}

type LogoutResult =
	| { ok: true }
	| { ok: false; error: string };

/**
 * Ends the Better Auth session. Returns `{ ok: false }` when sign-out fails so
 * callers can avoid clearing analytics or navigation state prematurely.
 */
export async function logout(): Promise<LogoutResult> {
	const { error } = await authClient.signOut();

	if (error) {
		return {
			ok: false,
			error: error.message ?? "Wylogowanie nie powiodło się",
		};
	}

	return { ok: true };
}
