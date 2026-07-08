import "@tanstack/react-start/server-only";
import { plaidLinkRepository, plaidSyncRepository } from "#/data/repositories";
import {
	fetchPlaidAccounts,
	fetchPlaidTransactionSnapshot,
} from "#/server/plaid/plaid-api";
import type { PlaidSyncScope } from "#/server/plaid/sync-config";

/**
 * Pulls normalized Plaid data into Postgres cache tables for a user.
 * Intended for sync-on-link, stale refresh, and future cron/webhook workers.
 */
export async function syncUserPlaidData(
	userId: string,
	scope: PlaidSyncScope = "all",
): Promise<void> {
	const accessToken = await plaidLinkRepository.getAccessToken(userId);
	if (!accessToken) {
		return;
	}

	try {
		if (scope === "all") {
			await Promise.all([
				(async () => {
					const accounts = await fetchPlaidAccounts(accessToken);
					await plaidSyncRepository.replaceAccounts(userId, accounts);
				})(),
				(async () => {
					const snapshot = await fetchPlaidTransactionSnapshot(accessToken);
					await plaidSyncRepository.replaceTransactions(userId, snapshot);
				})(),
			]);
			return;
		}

		if (scope === "accounts") {
			const accounts = await fetchPlaidAccounts(accessToken);
			await plaidSyncRepository.replaceAccounts(userId, accounts);
		}

		if (scope === "transactions") {
			const snapshot = await fetchPlaidTransactionSnapshot(accessToken);
			await plaidSyncRepository.replaceTransactions(userId, snapshot);
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown Plaid sync error";
		await plaidSyncRepository.recordSyncError(userId, message);
		throw error;
	}
}
