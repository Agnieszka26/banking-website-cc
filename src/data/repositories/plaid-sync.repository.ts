import "@tanstack/react-start/server-only";
import { withUserRlsContext } from "#/lib/prisma-rls";
import {
	mapCachedAccount,
	mapCachedTransaction,
} from "#/server/plaid/plaid-mappers";
import type {
	DashboardAccount,
	DashboardTransaction,
} from "#/server/plaid/types";
import {
	PLAID_DASHBOARD_TRANSACTION_LIMIT,
	PLAID_SYNC_TRANSACTION_LIMIT,
	type PlaidSyncTimestamps,
} from "#/server/plaid/sync-config";
import type { SyncableTransaction } from "#/server/plaid/sync-types";

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
						mask: account.mask,
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

	async replaceTransactions(
		userId: string,
		transactions: SyncableTransaction[],
	): Promise<void> {
		await withUserRlsContext(userId, async (tx) => {
			const syncedAt = new Date();
			const limited = transactions.slice(0, PLAID_SYNC_TRANSACTION_LIMIT);

			await tx.plaidCachedTransaction.deleteMany({ where: { userId } });

			if (limited.length > 0) {
				await tx.plaidCachedTransaction.createMany({
					data: limited.map((transaction) => ({
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
