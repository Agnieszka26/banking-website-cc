import "@tanstack/react-start/server-only";
import { auth } from "@clerk/tanstack-react-start/server";
import { setResponseStatus } from "@tanstack/react-start/server";

export async function requireUserId(): Promise<string> {
	const { userId } = await auth();

	if (!userId) {
		setResponseStatus(401);
		throw new Error("Unauthorized");
	}

	return userId;
}
