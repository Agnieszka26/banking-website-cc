import "@tanstack/react-start/server-only";
import { withUserRlsContext } from "#/lib/prisma-rls";
import {
	mapCachedAccount,
	mapCachedTransaction,
} from "#/server/plaid/plaid-mappers";
import {
	PLAID_DASHBOARD_TRANSACTION_LIMIT,
	type PlaidSyncTimestamps,
} from "#/server/plaid/sync-config";
import type { SyncableTransaction } from "#/server/plaid/sync-types";
import type {
	DashboardAccount,
	DashboardTransaction,
} from "#/server/plaid/types";

/**
 * User-scoped read/write access to Plaid sync cache tables.
 * All methods run under RLS via `DATABASE_URL_RLS`.
 */
export const plaidSyncRepository = {
	async getSyncTimestamps(userId: string): Promise<PlaidSyncTimestamps | null> {
		return withUserRlsContext(userId, async (tx) => {
			const link = await tx.plaidLink.findUnique({
				where: { userId },
				select: {
					accountsSyncedAt: true,
					transactionsSyncedAt: true,
					syncError: true,
				},
			});

			if (!link) {
				return null;
			}

			return {
				accountsSyncedAt: link.accountsSyncedAt,
				transactionsSyncedAt: link.transactionsSyncedAt,
				syncError: link.syncError,
			};
		});
	},

	async getCachedAccounts(userId: string): Promise<DashboardAccount[]> {
		return withUserRlsContext(userId, async (tx) => {
			const rows = await tx.plaidCachedAccount.findMany({
				where: { userId },
				orderBy: { name: "asc" },
			});

			return rows.map(mapCachedAccount);
		});
	},

	async getCachedTransactions(
		userId: string,
		limit = PLAID_DASHBOARD_TRANSACTION_LIMIT,
	): Promise<DashboardTransaction[]> {
		return withUserRlsContext(userId, async (tx) => {
			const rows = await tx.plaidCachedTransaction.findMany({
				where: { userId },
				orderBy: { date: "desc" },
				take: limit,
			});

			return rows.map(mapCachedTransaction);
		});
	},

	/**
	 * Replaces all cached accounts for a user with a full Plaid snapshot.
	 * Caller must pass the complete account set (not incremental deltas).
	 */
	async replaceAccounts(
		userId: string,
		accounts: DashboardAccount[],
	): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			const syncedAt = new Date();

			await tx.plaidCachedAccount.deleteMany({ where: { userId } });

			if (accounts.length > 0) {
				await tx.plaidCachedAccount.createMany({
					data: accounts.map((account) => ({
						plaidAccountId: account.id,
						userId,
						name: account.name,
						mask: account.mask === "****" ? null : account.mask,
						balance: account.balance,
						currency: account.currency,
						type: account.type,
						syncedAt,
					})),
				});
			}

			await tx.plaidLink.update({
				where: { userId },
				data: {
					accountsSyncedAt: syncedAt,
					syncError: null,
				},
			});
		});
	},

	/**
	 * Replaces all cached transactions for a user with a full snapshot.
	 * Caller must pass the complete intended cache contents (not incremental
	 * deltas from a Plaid cursor). Uses delete-then-insert; do not call with
	 * partial updates — use upsert/merge only when cursor sync is implemented.
	 */
	async replaceTransactions(
		userId: string,
		snapshot: SyncableTransaction[],
	): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			const syncedAt = new Date();

			await tx.plaidCachedTransaction.deleteMany({ where: { userId } });

			if (snapshot.length > 0) {
				await tx.plaidCachedTransaction.createMany({
					data: snapshot.map((transaction) => ({
						plaidTransactionId: transaction.id,
						userId,
						plaidAccountId: transaction.plaidAccountId,
						date: transaction.date,
						name: transaction.name,
						amount: transaction.amount,
						currency: transaction.currency,
						syncedAt,
					})),
				});
			}

			await tx.plaidLink.update({
				where: { userId },
				data: {
					transactionsSyncedAt: syncedAt,
					syncError: null,
				},
			});
		});
	},

	async recordSyncError(userId: string, message: string): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			await tx.plaidLink.update({
				where: { userId },
				data: { syncError: message.slice(0, 500) },
			});
		});
	},

	async clearCachedData(userId: string): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			await tx.plaidCachedAccount.deleteMany({ where: { userId } });
			await tx.plaidCachedTransaction.deleteMany({ where: { userId } });
			await tx.plaidLink.update({
				where: { userId },
				data: {
					accountsSyncedAt: null,
					transactionsSyncedAt: null,
					syncError: null,
				},
			});
		});
	},
};
