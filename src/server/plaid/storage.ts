const plaidTokens = new Map<string, string>();

/** Returns the stored Plaid access token for a user, if one exists. */
export async function getPlaidAccessToken(
	userId: string,
): Promise<string | null> {
	return plaidTokens.get(userId) ?? null;
}

/** Persists a Plaid access token for the given user. */
export async function setPlaidAccessToken(
	userId: string,
	accessToken: string,
): Promise<void> {
	plaidTokens.set(userId, accessToken);
}
