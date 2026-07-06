import "@tanstack/react-start/server-only";
import { withUserRlsContext } from "#/lib/prisma-rls";

/**
 * User-scoped access to `plaid_link` rows.
 * All methods run under RLS via `DATABASE_URL_RLS`.
 */
export const plaidLinkRepository = {
	/** Returns the stored Plaid access token for a user, if one exists. */
	async getAccessToken(userId: string): Promise<string | null> {
		return withUserRlsContext(userId, async (tx) => {
			const record = await tx.plaidLink.findUnique({
				where: { userId },
				select: { accessToken: true },
			});

			return record?.accessToken ?? null;
		});
	},

	/** Persists a Plaid access token (and optional item id) for the given user. */
	async saveAccessToken(
		userId: string,
		accessToken: string,
		itemId?: string,
	): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			await tx.plaidLink.upsert({
				where: { userId },
				create: {
					userId,
					accessToken,
					...(itemId ? { itemId } : {}),
				},
				update: { accessToken, ...(itemId ? { itemId } : {}) },
			});
		});
	},
};
