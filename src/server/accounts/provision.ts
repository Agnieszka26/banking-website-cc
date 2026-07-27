import "@tanstack/react-start/server-only";
import { ledgerAccountRepository } from "#/data/repositories/ledger-account.repository";
import { log } from "#/lib/logger";
import type { LedgerAccountRecord } from "#/data/repositories/ledger-account.repository";

/**
 * Ensures the user has an internal ledger account (IBAN + initial deposit).
 * Called from Better Auth signup hooks and as a backfill on first dashboard access.
 */
export async function provisionInternalAccountForUser(
	userId: string,
): Promise<LedgerAccountRecord> {
	const { account, created } =
		await ledgerAccountRepository.provisionForUser(userId);

	if (created) {
		log("info", "account.provision.success", {
			userId,
			accountId: account.id,
			operation: "provision",
		});
	}

	return account;
}
