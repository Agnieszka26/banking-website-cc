const plaidTokens = new Map<string, string>();

export async function getPlaidAccessToken(
	userId: string,
): Promise<string | null> {
	return plaidTokens.get(userId) ?? null;
}

export async function setPlaidAccessToken(
	userId: string,
	accessToken: string,
): Promise<void> {
	plaidTokens.set(userId, accessToken);
}
