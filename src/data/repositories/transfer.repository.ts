import "@tanstack/react-start/server-only";
import {
	AccountNotFoundError,
	AppError,
	InsufficientFundsError,
} from "#/lib/errors";
import { fromMinorBigInt, toMinorBigInt } from "#/lib/money";
import { prisma } from "#/lib/prisma";
import { withUserRlsContext } from "#/lib/prisma-rls";

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

/** Repository-level transfer write — destination already resolved to an account id. */
export type CreateTransferInput = {
	sourceAccountId: string;
	destinationAccountId: string;
	amountMinor: number;
	currency: string;
	title: string;
	counterpartyName?: string | null;
	counterpartyAccountNumber?: string | null;
	/**
	 * When true, destination may belong to another user.
	 * Uses owner Prisma after the service validated source ownership.
	 */
	allowCrossUser?: boolean;
};

export type CreateTransferOutcome = {
	transfer: LedgerTransferRecord;
	/** True when an existing complete transfer was returned for retry dedup. */
	deduplicated: boolean;
};

/** Dedup window for safe client retries after unknown outcomes (API_CONTRACTS §6.1). */
export const TRANSFER_DEDUP_WINDOW_MS = 5 * 60 * 1000;

/** Own-account / internal transfers always post debit + credit legs when complete. */
const COMPLETE_TRANSFER_TX_COUNT = 2;

type TransferTx = {
	$queryRaw: typeof prisma.$queryRaw;
	ledgerTransfer: typeof prisma.ledgerTransfer;
	ledgerTransaction: typeof prisma.ledgerTransaction;
	ledgerAccount: typeof prisma.ledgerAccount;
};

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
 * Duplicate fingerprint lookup using an existing transaction client.
 * Rules match API_CONTRACTS §6.1 (user + accounts + amount + currency + title).
 */
async function findRecentDuplicateWithTx(
	tx: TransferTx,
	params: {
		userId: string;
		input: CreateTransferInput;
		withinMs?: number;
	},
): Promise<LedgerTransferRecord | null> {
	const { userId, input, withinMs = TRANSFER_DEDUP_WINDOW_MS } = params;
	const since = new Date(Date.now() - withinMs);
	const amountMinor = toMinorBigInt(input.amountMinor);

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
}

async function executeTransferInTx(
	tx: TransferTx,
	params: {
		userId: string;
		input: CreateTransferInput;
		/** When false, both accounts must belong to `userId` (RLS own-account path). */
		requireOwnedDestination: boolean;
	},
): Promise<CreateTransferOutcome> {
	const { userId, input, requireOwnedDestination } = params;
	const amountMinor = toMinorBigInt(input.amountMinor);

	if (input.sourceAccountId === input.destinationAccountId) {
		throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
	}

	// Lock both accounts in deterministic id order to avoid deadlocks
	// when reciprocal transfers (A→B and B→A) run concurrently.
	const orderedAccountIds = [
		input.sourceAccountId,
		input.destinationAccountId,
	].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));

	type LockedAccountRow = {
		id: string;
		user_id: string;
		balance_minor: bigint;
		currency: string;
		iban: string;
		name: string;
	};

	const lockedById = new Map<string, LockedAccountRow>();
	for (const accountId of orderedAccountIds) {
		const rows = requireOwnedDestination
			? await tx.$queryRaw<LockedAccountRow[]>`
					SELECT id, user_id, balance_minor, currency, iban, name
					FROM public.ledger_accounts
					WHERE id = ${accountId}::uuid
						AND user_id = ${userId}
					FOR UPDATE
				`
			: await tx.$queryRaw<LockedAccountRow[]>`
					SELECT id, user_id, balance_minor, currency, iban, name
					FROM public.ledger_accounts
					WHERE id = ${accountId}::uuid
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

	if (source.user_id !== userId) {
		throw new AccountNotFoundError(input.sourceAccountId);
	}

	if (requireOwnedDestination && destination.user_id !== userId) {
		throw new AccountNotFoundError(input.destinationAccountId);
	}

	if (
		source.currency !== input.currency ||
		destination.currency !== input.currency
	) {
		throw new AppError("VALIDATION_ERROR", "Request body failed validation.");
	}

	// Dedup after locks so concurrent identical requests serialize here.
	const duplicate = await findRecentDuplicateWithTx(tx, { userId, input });
	if (
		duplicate &&
		duplicate.transactionIds.length >= COMPLETE_TRANSFER_TX_COUNT
	) {
		return { transfer: duplicate, deduplicated: true };
	}

	const now = new Date();
	const bookingDate = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	);

	const transfer = await tx.ledgerTransfer.create({
		data: {
			userId,
			sourceAccountId: source.id,
			destinationAccountId: destination.id,
			amountMinor,
			currency: input.currency,
			title: input.title,
		},
	});

	const debitCounterpartyName =
		input.counterpartyName ?? destination.name;
	const creditCounterpartyName = input.counterpartyName ?? null;

	const debit = await tx.ledgerTransaction.create({
		data: {
			accountId: source.id,
			amountMinor,
			currency: input.currency,
			direction: "debit",
			type: "transfer",
			title: input.title,
			counterpartyName: debitCounterpartyName,
			counterpartyAccountNumber: destination.iban,
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
			counterpartyName: creditCounterpartyName,
			counterpartyAccountNumber: source.iban,
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

	return {
		transfer: toTransferRecord(transfer, [debit.id, credit.id]),
		deduplicated: false,
	};
}

/**
 * Access for internal transfers (own-account under RLS; cross-user via owner Prisma).
 * All multi-leg writes run in one DB transaction.
 */
export const transferRepository = {
	/**
	 * Standalone duplicate lookup (own transaction). Prefer createTransfer,
	 * which runs this check inside the create transaction after account locks.
	 */
	async findRecentDuplicate(params: {
		userId: string;
		input: CreateTransferInput;
		withinMs?: number;
	}): Promise<LedgerTransferRecord | null> {
		if (params.input.allowCrossUser) {
			return prisma.$transaction(async (tx) =>
				findRecentDuplicateWithTx(tx, params),
			);
		}

		return withUserRlsContext(params.userId, async (tx) =>
			findRecentDuplicateWithTx(tx, params),
		);
	},

	/**
	 * Atomically creates transfer row, debit/credit ledger legs, and balance updates.
	 * Duplicate detection runs inside the same transaction after account locks.
	 * Caller must already validate ownership, currency match, and funds.
	 */
	async createTransfer(params: {
		userId: string;
		input: CreateTransferInput;
	}): Promise<CreateTransferOutcome> {
		const { userId, input } = params;
		const allowCrossUser = input.allowCrossUser === true;

		if (allowCrossUser) {
			// Cross-user settlement: owner role after service-layer ownership checks.
			// RLS cannot credit another user's account from the sender session.
			return prisma.$transaction(async (tx) =>
				executeTransferInTx(tx, {
					userId,
					input,
					requireOwnedDestination: false,
				}),
			);
		}

		return withUserRlsContext(userId, async (tx) =>
			executeTransferInTx(tx, {
				userId,
				input,
				requireOwnedDestination: true,
			}),
		);
	},
};
