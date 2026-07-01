import "@tanstack/react-start/server-only";
import { withUserRlsContext } from "#/lib/prisma-rls";

/** Returns the stored Plaid access token for a user, if one exists. */
export async function getPlaidAccessToken(
	userId: string,
): Promise<string | null> {
	return withUserRlsContext(userId, async (tx) => {
		const record = await tx.plaidLink.findUnique({
			where: { userId },
			select: { accessToken: true },
		});

		return record?.accessToken ?? null;
	});
}

/** Persists a Plaid access token for the given user. */
export async function setPlaidAccessToken(
	userId: string,
	accessToken: string,
): Promise<void> {
	await withUserRlsContext(userId, async (tx) => {
		await tx.plaidLink.upsert({
			where: { userId },
			create: { userId, accessToken },
			update: { accessToken },
		});
	});
}
