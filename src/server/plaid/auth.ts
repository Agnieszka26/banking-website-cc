import "@tanstack/react-start/server-only";
import { getRequestHeaders, setResponseStatus } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

type AuthSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function requireSession(): Promise<AuthSession> {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });

	if (!session) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return session;
}

export async function requireUserId(): Promise<string> {
	const session = await requireSession();
	return session.user.id;
}
