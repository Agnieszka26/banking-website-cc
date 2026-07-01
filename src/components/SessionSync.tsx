import { useSession } from "#/lib/auth-client";

/**
 * Subscribes to the Better Auth session on the client so cookie refresh and
 * sign-out propagate to the reactive session store.
 */
export function SessionSync() {
	useSession();
	return null;
}
