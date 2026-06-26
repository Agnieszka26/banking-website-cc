import "@tanstack/react-start/server-only";
import { setResponseStatus } from "@tanstack/react-start/server";
import { getSessionUserId } from "#/server/auth/sessions";

export async function requireUserId(): Promise<string> {
	const userId = getSessionUserId();

	if (!userId) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return userId;
}
