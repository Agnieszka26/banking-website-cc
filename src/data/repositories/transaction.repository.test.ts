/**
 * RLS + repository integration tests for application ledger tables.
 * Skips when DATABASE_URL_RLS is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transactionRepository } from "#/data/repositories/transaction.repository";
import { fromMinorBigInt } from "#/lib/money";

const connectionString = process.env.DATABASE_URL_RLS;
const describeIfRlsDb = connectionString ? describe : describe.skip;

describeIfRlsDb("transactionRepository (ledger RLS)", () => {
	const ownerUserId = `ledger-owner-${randomUUID()}`;
	const otherUserId = `ledger-other-${randomUUID()}`;
	let ownerAccountId = "";
	let otherAccountId = "";

	beforeAll(async () => {
		const { prisma } = await import("#/lib/prisma");

		const ownerAccount = await prisma.ledgerAccount.create({
			data: {
				userId: ownerUserId,
				name: "Owner Checking",
				iban: (await import("#/lib/iban")).generatePolishIban(),
				currency: "PLN",
				balanceMinor: 50_000n,
			},
		});
		ownerAccountId = ownerAccount.id;

		const otherAccount = await prisma.ledgerAccount.create({
			data: {
				userId: otherUserId,
				name: "Other Checking",
				iban: (await import("#/lib/iban")).generatePolishIban(),
				currency: "PLN",
				balanceMinor: 50_000n,
			},
		});
		otherAccountId = otherAccount.id;

		await prisma.ledgerTransaction.create({
			data: {
				accountId: ownerAccountId,
				amountMinor: 2500n,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "Owner payment",
				bookingDate: new Date("2026-07-20T00:00:00.000Z"),
			},
		});

		await prisma.ledgerTransaction.create({
			data: {
				accountId: otherAccountId,
				amountMinor: 9900n,
				currency: "PLN",
				direction: "credit",
				type: "deposit",
				title: "Other deposit",
				bookingDate: new Date("2026-07-21T00:00:00.000Z"),
			},
		});
	});

	afterAll(async () => {
		const accountIds = [ownerAccountId, otherAccountId].filter(Boolean);
		if (accountIds.length === 0) {
			return;
		}

		const { prisma } = await import("#/lib/prisma");
		await prisma.ledgerTransaction.deleteMany({
			where: { accountId: { in: accountIds } },
		});
		await prisma.ledgerAccount.deleteMany({
			where: { id: { in: accountIds } },
		});
	});

	it("returns the owner's own transactions", async () => {
		const result = await transactionRepository.getTransactionsByAccount({
			userId: ownerUserId,
			accountId: ownerAccountId,
			filters: { page: 1, limit: 20 },
		});

		expect(result.total).toBe(1);
		expect(result.items[0]?.title).toBe("Owner payment");
		expect(result.items[0]?.accountId).toBe(ownerAccountId);
	});

	it("does not expose another user's account transactions", async () => {
		const result = await transactionRepository.getTransactionsByAccount({
			userId: ownerUserId,
			accountId: otherAccountId,
			filters: { page: 1, limit: 20 },
		});

		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
	});

	it("creates a transaction only for an owned account", async () => {
		const { prisma } = await import("#/lib/prisma");
		const debitAmount = 1000;

		const before = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: ownerAccountId },
			select: { balanceMinor: true },
		});
		const beforeBalance = fromMinorBigInt(before.balanceMinor);

		const created = await transactionRepository.createTransaction({
			userId: ownerUserId,
			input: {
				accountId: ownerAccountId,
				amountMinor: debitAmount,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "RLS create",
				bookingDate: new Date("2026-07-26T00:00:00.000Z"),
			},
		});

		expect(created.accountId).toBe(ownerAccountId);
		expect(created.amountMinor).toBe(debitAmount);

		const afterDebit = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: ownerAccountId },
			select: { balanceMinor: true },
		});
		const afterDebitBalance = fromMinorBigInt(afterDebit.balanceMinor);
		expect(afterDebitBalance).toBe(beforeBalance - debitAmount);

		await expect(
			transactionRepository.createTransaction({
				userId: ownerUserId,
				input: {
					accountId: otherAccountId,
					amountMinor: debitAmount,
					currency: "PLN",
					direction: "debit",
					type: "payment",
					title: "Should fail",
					bookingDate: new Date("2026-07-26T00:00:00.000Z"),
				},
			}),
		).rejects.toMatchObject({
			code: "ACCOUNT_NOT_FOUND",
			accountId: otherAccountId,
		});

		const overdraftAmount = afterDebitBalance + 1;
		await expect(
			transactionRepository.createTransaction({
				userId: ownerUserId,
				input: {
					accountId: ownerAccountId,
					amountMinor: overdraftAmount,
					currency: "PLN",
					direction: "debit",
					type: "payment",
					title: "Overdraft attempt",
					bookingDate: new Date("2026-07-26T00:00:00.000Z"),
				},
			}),
		).rejects.toMatchObject({
			code: "INSUFFICIENT_FUNDS",
			accountId: ownerAccountId,
			amountMinor: overdraftAmount,
			balanceMinor: afterDebitBalance,
		});

		const afterOverdraft = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: ownerAccountId },
			select: { balanceMinor: true },
		});
		expect(fromMinorBigInt(afterOverdraft.balanceMinor)).toBe(
			afterDebitBalance,
		);
	});
});
