import "@tanstack/react-start/server-only";
import { generatePolishIban, normalizePolishIban } from "#/lib/iban";
import { fromMinorBigInt, toMinorBigInt } from "#/lib/money";
import { prisma } from "#/lib/prisma";
import { withUserRlsContext } from "#/lib/prisma-rls";
import {
	DEFAULT_LEDGER_ACCOUNT_NAME,
	DEFAULT_LEDGER_CURRENCY,
	INITIAL_DEPOSIT_AMOUNT_MINOR,
	INITIAL_DEPOSIT_TITLE,
} from "#/server/accounts/constants";

export type LedgerAccountRecord = {
	id: string;
	userId: string;
	name: string;
	iban: string;
	currency: string;
	balanceMinor: number;
};

const accountSelect = {
	id: true,
	userId: true,
	name: true,
	iban: true,
	currency: true,
	balanceMinor: true,
} as const;

function toAccountRecord(row: {
	id: string;
	userId: string;
	name: string;
	iban: string;
	currency: string;
	balanceMinor: bigint;
}): LedgerAccountRecord {
	return {
		...row,
		balanceMinor: fromMinorBigInt(row.balanceMinor),
	};
}

/**
 * RLS-scoped access to `ledger_accounts`.
 * Ownership is enforced by Postgres RLS (`user_id = current_app_user_id()`)
 * after `withUserRlsContext` sets the session user id.
 *
 * Cross-user IBAN lookup and signup provisioning use the owner Prisma client
 * (no FK to auth user; provisioning is an admin/bootstrap path).
 */
export const ledgerAccountRepository = {
	async findOwnedById(
		userId: string,
		accountId: string,
	): Promise<LedgerAccountRecord | null> {
		return withUserRlsContext(userId, async (tx) => {
			const row = await tx.ledgerAccount.findFirst({
				where: { id: accountId, userId },
				select: accountSelect,
			});

			return row ? toAccountRecord(row) : null;
		});
	},

	async listOwned(userId: string): Promise<LedgerAccountRecord[]> {
		return withUserRlsContext(userId, async (tx) => {
			const rows = await tx.ledgerAccount.findMany({
				where: { userId },
				select: accountSelect,
				orderBy: { name: "asc" },
			});

			return rows.map(toAccountRecord);
		});
	},

	/**
	 * Resolves an internal account by application IBAN (cross-user).
	 * Uses owner Prisma because RLS only exposes the caller's own rows.
	 * Returns identity fields only — never expose this to clients without
	 * an authenticated transfer intent.
	 */
	async findByIban(iban: string): Promise<LedgerAccountRecord | null> {
		const normalized = normalizePolishIban(iban);
		const row = await prisma.ledgerAccount.findUnique({
			where: { iban: normalized },
			select: accountSelect,
		});

		return row ? toAccountRecord(row) : null;
	},

	/**
	 * Creates an internal ledger account with an initial deposit ledger post.
	 * Idempotent per user: if the user already has an account, returns it.
	 * Uses owner Prisma (signup bootstrap / backfill for legacy users).
	 */
	async provisionForUser(userId: string): Promise<{
		account: LedgerAccountRecord;
		created: boolean;
	}> {
		const existing = await prisma.ledgerAccount.findFirst({
			where: { userId },
			select: accountSelect,
			orderBy: { createdAt: "asc" },
		});

		if (existing) {
			return { account: toAccountRecord(existing), created: false };
		}

		const bookingDate = new Date(
			Date.UTC(
				new Date().getUTCFullYear(),
				new Date().getUTCMonth(),
				new Date().getUTCDate(),
			),
		);
		const depositMinor = toMinorBigInt(INITIAL_DEPOSIT_AMOUNT_MINOR);

		for (let attempt = 0; attempt < 8; attempt++) {
			const iban = generatePolishIban();

			try {
				const account = await prisma.$transaction(async (tx) => {
					const created = await tx.ledgerAccount.create({
						data: {
							userId,
							name: DEFAULT_LEDGER_ACCOUNT_NAME,
							iban,
							currency: DEFAULT_LEDGER_CURRENCY,
							balanceMinor: 0n,
						},
						select: accountSelect,
					});

					await tx.ledgerTransaction.create({
						data: {
							accountId: created.id,
							amountMinor: depositMinor,
							currency: DEFAULT_LEDGER_CURRENCY,
							direction: "credit",
							type: "deposit",
							title: INITIAL_DEPOSIT_TITLE,
							bookingDate,
						},
					});

					return tx.ledgerAccount.update({
						where: { id: created.id },
						data: { balanceMinor: { increment: depositMinor } },
						select: accountSelect,
					});
				});

				return { account: toAccountRecord(account), created: true };
			} catch (error) {
				const code =
					error && typeof error === "object" && "code" in error
						? String((error as { code: unknown }).code)
						: "";
				// Unique IBAN collision — retry with a new serial.
				if (code === "P2002") {
					continue;
				}
				throw error;
			}
		}

		throw new Error("Failed to allocate a unique IBAN for the new account.");
	},
};
