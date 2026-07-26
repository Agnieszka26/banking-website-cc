import "@tanstack/react-start/server-only";
import { AccountNotFoundError, InsufficientFundsError } from "#/lib/errors";
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

		return withUserRlsContext(userId, async (tx) => {
			const existing = await tx.ledgerTransfer.findFirst({
				where: {
					userId,
					sourceAccountId: input.sourceAccountId,
					destinationAccountId: input.destinationAccountId,
					amountMinor: input.amountMinor,
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

			return {
				...existing,
				transactionIds: legs.map((leg) => leg.id),
			};
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

		return withUserRlsContext(userId, async (tx) => {
			const [source, destination] = await Promise.all([
				tx.ledgerAccount.findFirst({
					where: { id: input.sourceAccountId, userId },
					select: { id: true, balanceMinor: true, currency: true },
				}),
				tx.ledgerAccount.findFirst({
					where: { id: input.destinationAccountId, userId },
					select: { id: true, balanceMinor: true, currency: true },
				}),
			]);

			if (!source || !destination) {
				throw new AccountNotFoundError(
					!source ? input.sourceAccountId : input.destinationAccountId,
				);
			}

			if (source.balanceMinor < input.amountMinor) {
				throw new InsufficientFundsError({
					accountId: source.id,
					amountMinor: input.amountMinor,
					balanceMinor: source.balanceMinor,
				});
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
					amountMinor: input.amountMinor,
					currency: input.currency,
					title: input.title,
				},
			});

			const debit = await tx.ledgerTransaction.create({
				data: {
					accountId: source.id,
					amountMinor: input.amountMinor,
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
					amountMinor: input.amountMinor,
					currency: input.currency,
					direction: "credit",
					type: "transfer",
					title: input.title,
					transferId: transfer.id,
					bookingDate,
				},
			});

			await tx.ledgerAccount.update({
				where: { id: source.id },
				data: { balanceMinor: { decrement: input.amountMinor } },
			});

			await tx.ledgerAccount.update({
				where: { id: destination.id },
				data: { balanceMinor: { increment: input.amountMinor } },
			});

			return {
				...transfer,
				transactionIds: [debit.id, credit.id],
			};
		});
	},
};
