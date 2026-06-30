import "@tanstack/react-start/server-only";
import { prisma } from "#/lib/prisma";

/** Returns the stored Plaid access token for a user, if one exists. */
export async function getPlaidAccessToken(
	userId: string,
): Promise<string | null> {
	const record = await prisma.plaidLink.findUnique({
		where: { userId },
		select: { accessToken: true },
	});

	return record?.accessToken ?? null;
}

/** Persists a Plaid access token for the given user. */
export async function setPlaidAccessToken(
	userId: string,
	accessToken: string,
): Promise<void> {
	await prisma.plaidLink.upsert({
		where: { userId },
		create: { userId, accessToken },
		update: { accessToken },
	});
}
