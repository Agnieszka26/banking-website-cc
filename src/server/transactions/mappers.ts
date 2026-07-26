import type { LedgerTransactionRecord } from "#/data/repositories/transaction.repository";
import {
	TransactionDirectionSchema,
	TransactionTypeSchema,
} from "#/shared/schemas";
import type { TransactionDto } from "#/shared/types";

function toIsoDate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

/**
 * Maps a ledger DB entity to the public TransactionDTO.
 * The server boundary owns this mapping — never return Prisma models to clients.
 */
export function toTransactionDto(row: LedgerTransactionRecord): TransactionDto {
	return {
		id: row.id,
		accountId: row.accountId,
		amountMinor: row.amountMinor,
		currency: row.currency,
		direction: TransactionDirectionSchema.parse(row.direction),
		type: TransactionTypeSchema.parse(row.type),
		title: row.title,
		counterpartyName: row.counterpartyName,
		counterpartyAccountNumber: row.counterpartyAccountNumber,
		transferId: row.transferId,
		createdAt: row.createdAt.toISOString(),
		bookingDate: toIsoDate(row.bookingDate),
	};
}
