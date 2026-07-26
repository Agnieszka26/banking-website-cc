import "@tanstack/react-start/server-only";
import { fromMinorBigInt } from "#/lib/money";
import { withUserRlsContext } from "#/lib/prisma-rls";

export type LedgerAccountRecord = {
	id: string;
	userId: string;
	name: string;
	currency: string;
	balanceMinor: number;
};

/**
 * RLS-scoped access to `ledger_accounts`.
 * Ownership is enforced by Postgres RLS (`user_id = current_app_user_id()`)
 * after `withUserRlsContext` sets the session user id.
 */
export const ledgerAccountRepository = {
	async findOwnedById(
		userId: string,
		accountId: string,
	): Promise<LedgerAccountRecord | null> {
		return withUserRlsContext(userId, async (tx) => {
			const row = await tx.ledgerAccount.findFirst({
				where: { id: accountId, userId },
				select: {
					id: true,
					userId: true,
					name: true,
					currency: true,
					balanceMinor: true,
				},
			});

			if (!row) {
				return null;
			}

			return {
				...row,
				balanceMinor: fromMinorBigInt(row.balanceMinor),
			};
		});
	},

	async listOwned(userId: string): Promise<LedgerAccountRecord[]> {
		return withUserRlsContext(userId, async (tx) => {
			const rows = await tx.ledgerAccount.findMany({
				where: { userId },
				select: {
					id: true,
					userId: true,
					name: true,
					currency: true,
					balanceMinor: true,
				},
				orderBy: { name: "asc" },
			});

			return rows.map((row) => ({
				...row,
				balanceMinor: fromMinorBigInt(row.balanceMinor),
			}));
		});
	},
};
