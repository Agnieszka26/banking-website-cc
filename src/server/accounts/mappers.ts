import type { LedgerAccountRecord } from "#/data/repositories/ledger-account.repository";
import { ibanMask } from "#/lib/iban";
import type { DashboardAccount } from "#/server/plaid/types";

/** Maps an internal ledger account to the dashboard account DTO. */
export function mapLedgerAccountToDashboard(
	account: LedgerAccountRecord,
): DashboardAccount {
	return {
		id: account.id,
		name: account.name,
		mask: ibanMask(account.iban),
		balance: account.balanceMinor / 100,
		currency: account.currency,
		type: "checking",
		iban: account.iban,
		source: "internal",
	};
}
