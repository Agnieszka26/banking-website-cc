import type { LedgerTransferRecord } from "#/data/repositories/transfer.repository";
import type { TransferDto } from "#/shared/types";

/** Maps a ledger transfer record to the public TransferDTO. */
export function toTransferDto(row: LedgerTransferRecord): TransferDto {
	return {
		id: row.id,
		sourceAccountId: row.sourceAccountId,
		destinationAccountId: row.destinationAccountId,
		amountMinor: row.amountMinor,
		currency: row.currency,
		title: row.title,
		transactionIds: row.transactionIds,
		createdAt: row.createdAt.toISOString(),
	};
}
