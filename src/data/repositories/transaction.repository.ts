import "@tanstack/react-start/server-only";
import { AccountNotFoundError, InsufficientFundsError } from "#/lib/errors";
import { fromMinorBigInt, toMinorBigInt } from "#/lib/money";
import { withUserRlsContext } from "#/lib/prisma-rls";
import type {
	CreateTransactionRequestParsed,
	ListTransactionsQueryParsed,
} from "#/shared/types";

export type LedgerTransactionRecord = {
	id: string;
	accountId: string;
	amountMinor: number;
	currency: string;
	direction: string;
	type: string;
	title: string;
	counterpartyName: string | null;
	counterpartyAccountNumber: string | null;
	transferId: string | null;
	bookingDate: Date;
	createdAt: Date;
};

export type CreateLedgerTransactionInput = CreateTransactionRequestParsed & {
	bookingDate: Date;
};

export type ListLedgerTransactionsResult = {
	items: LedgerTransactionRecord[];
	total: number;
};

function toTransactionRecord(row: {
	id: string;
	accountId: string;
	amountMinor: bigint;
	currency: string;
	direction: string;
	type: string;
	title: string;
	counterpartyName: string | null;
	counterpartyAccountNumber: string | null;
	transferId: string | null;
	bookingDate: Date;
	createdAt: Date;
}): LedgerTransactionRecord {
	return {
		...row,
		amountMinor: fromMinorBigInt(row.amountMinor),
	};
}

/**
 * RLS-scoped access to `ledger_transactions`.
 *
 * Ownership strategy:
 * - All queries run inside `withUserRlsContext(userId)` which sets
 *   `app.current_user_id` and `SET LOCAL ROLE authenticated`.
 * - Postgres RLS on `ledger_transactions` requires the linked
 *   `ledger_accounts.user_id` to equal `current_app_user_id()`.
 * - Repository methods also pass `userId` into explicit account ownership
 *   filters as defense-in-depth (never trust client `accountId` alone).
 *
 * No auth, HTTP, or UI logic lives here.
 */
export const transactionRepository = {
	async getTransactionsByAccount(params: {
		userId: string;
		accountId?: string;
		filters: ListTransactionsQueryParsed;
	}): Promise<ListLedgerTransactionsResult> {
		const { userId, accountId, filters } = params;
		const { page, limit, type, dateFrom, dateTo } = filters;

		return withUserRlsContext(userId, async (tx) => {
			const where = {
				...(accountId
					? { accountId, account: { userId } }
					: { account: { userId } }),
				...(type ? { direction: type } : {}),
				...(dateFrom || dateTo
					? {
							bookingDate: {
								...(dateFrom
									? { gte: new Date(`${dateFrom}T00:00:00.000Z`) }
									: {}),
								...(dateTo ? { lte: new Date(`${dateTo}T00:00:00.000Z`) } : {}),
							},
						}
					: {}),
			};

			const [items, total] = await Promise.all([
				tx.ledgerTransaction.findMany({
					where,
					orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
					skip: (page - 1) * limit,
					take: limit,
				}),
				tx.ledgerTransaction.count({ where }),
			]);

			return {
				items: items.map(toTransactionRecord),
				total,
			};
		});
	},

	/**
	 * Creates an append-only ledger post and updates the account balance
	 * inside one RLS transaction. Debits use a conditional balance guard so
	 * concurrent writers cannot overdraw; credits increment unconditionally.
	 */
	async createTransaction(params: {
		userId: string;
		input: CreateLedgerTransactionInput;
	}): Promise<LedgerTransactionRecord> {
		const { userId, input } = params;
		const amountMinor = toMinorBigInt(input.amountMinor);

		return withUserRlsContext(userId, async (tx) => {
			const account = await tx.ledgerAccount.findFirst({
				where: { id: input.accountId, userId },
				select: { id: true, balanceMinor: true },
			});

			if (!account) {
				throw new AccountNotFoundError(input.accountId);
			}

			const created = await tx.ledgerTransaction.create({
				data: {
					accountId: input.accountId,
					amountMinor,
					currency: input.currency,
					direction: input.direction,
					type: input.type,
					title: input.title,
					counterpartyName: input.counterpartyName ?? null,
					counterpartyAccountNumber: input.counterpartyAccountNumber ?? null,
					bookingDate: input.bookingDate,
				},
			});

			if (input.direction === "debit") {
				const debited = await tx.ledgerAccount.updateMany({
					where: {
						id: account.id,
						balanceMinor: { gte: amountMinor },
					},
					data: { balanceMinor: { decrement: amountMinor } },
				});

				if (debited.count === 0) {
					throw new InsufficientFundsError({
						accountId: input.accountId,
						amountMinor: input.amountMinor,
						balanceMinor: fromMinorBigInt(account.balanceMinor),
					});
				}
			} else {
				await tx.ledgerAccount.update({
					where: { id: account.id },
					data: { balanceMinor: { increment: amountMinor } },
				});
			}

			return toTransactionRecord(created);
		});
	},
};
