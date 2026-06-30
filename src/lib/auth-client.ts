import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
	plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Identifier-based login: authenticates by username/identifier + password.
 * Returns Better Auth's `{ data, error }` result (does not throw on auth failure).
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
