import "@tanstack/react-start/server-only";
import {
	AccountNotFoundError,
	AppError,
	InsufficientFundsError,
} from "#/lib/errors";
import { fromMinorBigInt, toMinorBigInt } from "#/lib/money";
import { withUserRlsContext } from "#/lib/prisma-rls";
import type { CreateTransferRequestParsed } from "#/shared/types";

export type LedgerTransferRecord = {
	id: string;
	userId: string;
	sourceAccountId: string;
	destinationAccountId: string;
	amountMinor: number;
	currency: string;
	title: string;
	createdAt: Date;
	transactionIds: string[];
};

export type CreateTransferInput = CreateTransferRequestParsed;

/** Dedup window for safe client retries after unknown outcomes (API_CONTRACTS §6.1). */
export const TRANSFER_DEDUP_WINDOW_MS = 5 * 60 * 1000;

function toTransferRecord(
	row: {
		id: string;
		userId: string;
		sourceAccountId: string;
		destinationAccountId: string;
		amountMinor: bigint;
		currency: string;
		title: string;
		createdAt: Date;
	},
	transactionIds: string[],
): LedgerTransferRecord {
	return {
		...row,
		amountMinor: fromMinorBigInt(row.amountMinor),
		transactionIds,
	};
}

/**
 * RLS-scoped access for own-account transfers.
 * All multi-leg writes run in one `withUserRlsContext` DB transaction.
 */
export const transferRepository = {
	async findRecentDuplicate(params: {
		userId: string;
		input: CreateTransferInput;
		withinMs?: number;
	}): Promise<LedgerTransferRecord | null> {
		const { userId, input, withinMs = TRANSFER_DEDUP_WINDOW_MS } = params;
		const since = new Date(Date.now() - withinMs);
		const amountMinor = toMinorBigInt(input.amountMinor);

		return withUserRlsContext(userId, async (tx) => {
			const existing = await tx.ledgerTransfer.findFirst({
				where: {
					userId,
					sourceAccountId: input.sourceAccountId,
					destinationAccountId: input.destinationAccountId,
					amountMinor,
					currency: input.currency,
					title: input.title,
					createdAt: { gte: since },
				},
				orderBy: { createdAt: "desc" },
			});

			if (!existing) {
				return null;
			}

			const legs = await tx.ledgerTransaction.findMany({
				where: { transferId: existing.id },
				select: { id: true },
				orderBy: { createdAt: "asc" },
			});

			return toTransferRecord(
				existing,
				legs.map((leg) => leg.id),
			);
		});
	},

	/**
	 * Atomically creates transfer row, debit/credit ledger legs, and balance updates.
	 * Caller must already validate ownership, currency match, and funds.
	 */
	async createTransfer(params: {
		userId: string;
		input: CreateTransferInput;
	}): Promise<LedgerTransferRecord> {
		const { userId, input } = params;
		const amountMinor = toMinorBigInt(input.amountMinor);

		if (input.sourceAccountId === input.destinationAccountId) {
			throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
		}

		return withUserRlsContext(userId, async (tx) => {
			// Lock both accounts in deterministic id order to avoid deadlocks
			// when reciprocal transfers (A→B and B→A) run concurrently.
			const orderedAccountIds = [
				input.sourceAccountId,
				input.destinationAccountId,
			].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

			type LockedAccountRow = {
				id: string;
				balance_minor: bigint;
				currency: string;
			};

			const lockedById = new Map<string, LockedAccountRow>();
			for (const accountId of orderedAccountIds) {
				const rows = await tx.$queryRaw<LockedAccountRow[]>`
					SELECT id, balance_minor, currency
					FROM public.ledger_accounts
					WHERE id = ${accountId}::uuid
						AND user_id = ${userId}
					FOR UPDATE
				`;
				const row = rows[0];
				if (row) {
					lockedById.set(row.id, row);
				}
			}

			const source = lockedById.get(input.sourceAccountId);
			const destination = lockedById.get(input.destinationAccountId);

			if (!source || !destination) {
				throw new AccountNotFoundError(
					!source ? input.sourceAccountId : input.destinationAccountId,
				);
			}

			if (
				source.currency !== input.currency ||
				destination.currency !== input.currency
			) {
				throw new AppError(
					"VALIDATION_ERROR",
					"Request body failed validation.",
				);
			}

			const bookingDate = new Date(
				Date.UTC(
					new Date().getUTCFullYear(),
					new Date().getUTCMonth(),
					new Date().getUTCDate(),
				),
			);

			const transfer = await tx.ledgerTransfer.create({
				data: {
					userId,
					sourceAccountId: input.sourceAccountId,
					destinationAccountId: input.destinationAccountId,
					amountMinor,
					currency: input.currency,
					title: input.title,
				},
			});

			const debit = await tx.ledgerTransaction.create({
				data: {
					accountId: source.id,
					amountMinor,
					currency: input.currency,
					direction: "debit",
					type: "transfer",
					title: input.title,
					transferId: transfer.id,
					bookingDate,
				},
			});

			const credit = await tx.ledgerTransaction.create({
				data: {
					accountId: destination.id,
					amountMinor,
					currency: input.currency,
					direction: "credit",
					type: "transfer",
					title: input.title,
					transferId: transfer.id,
					bookingDate,
				},
			});

			const debited = await tx.ledgerAccount.updateMany({
				where: { id: source.id, balanceMinor: { gte: amountMinor } },
				data: { balanceMinor: { decrement: amountMinor } },
			});
			if (debited.count === 0) {
				throw new InsufficientFundsError({
					accountId: source.id,
					amountMinor: input.amountMinor,
					balanceMinor: fromMinorBigInt(source.balance_minor),
				});
			}

			await tx.ledgerAccount.update({
				where: { id: destination.id },
				data: { balanceMinor: { increment: amountMinor } },
			});

			return toTransferRecord(transfer, [debit.id, credit.id]);
		});
	},
};
