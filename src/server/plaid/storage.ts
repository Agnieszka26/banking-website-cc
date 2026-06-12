import { clerkClient } from "@clerk/tanstack-react-start/server";

const PLAID_ACCESS_TOKEN_KEY = "plaidAccessToken";

export async function getPlaidAccessToken(
	userId: string,
): Promise<string | null> {
	const user = await clerkClient().users.getUser(userId);
	const token = user.privateMetadata[PLAID_ACCESS_TOKEN_KEY];

	return typeof token === "string" ? token : null;
}

export async function setPlaidAccessToken(
	userId: string,
	accessToken: string,
): Promise<void> {
	await clerkClient().users.updateUserMetadata(userId, {
		privateMetadata: {
			[PLAID_ACCESS_TOKEN_KEY]: accessToken,
		},
	});
}
