/**
 * RLS + repository integration tests for application ledger tables.
 * Skips when DATABASE_URL_RLS is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transactionRepository } from "#/data/repositories/transaction.repository";

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
				currency: "PLN",
				balanceMinor: 50_000,
			},
		});
		ownerAccountId = ownerAccount.id;

		const otherAccount = await prisma.ledgerAccount.create({
			data: {
				userId: otherUserId,
				name: "Other Checking",
				currency: "PLN",
				balanceMinor: 50_000,
			},
		});
		otherAccountId = otherAccount.id;

		await prisma.ledgerTransaction.create({
			data: {
				accountId: ownerAccountId,
				amountMinor: 2500,
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
				amountMinor: 9900,
				currency: "PLN",
				direction: "credit",
				type: "deposit",
				title: "Other deposit",
				bookingDate: new Date("2026-07-21T00:00:00.000Z"),
			},
		});
	});

	afterAll(async () => {
		if (!ownerAccountId && !otherAccountId) {
			return;
		}

		const { prisma } = await import("#/lib/prisma");
		await prisma.ledgerTransaction.deleteMany({
			where: { accountId: { in: [ownerAccountId, otherAccountId] } },
		});
		await prisma.ledgerAccount.deleteMany({
			where: { id: { in: [ownerAccountId, otherAccountId] } },
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
		const created = await transactionRepository.createTransaction({
			userId: ownerUserId,
			input: {
				accountId: ownerAccountId,
				amountMinor: 1000,
				currency: "PLN",
				direction: "debit",
				type: "payment",
				title: "RLS create",
				bookingDate: new Date("2026-07-26T00:00:00.000Z"),
			},
		});

		expect(created.accountId).toBe(ownerAccountId);
		expect(created.amountMinor).toBe(1000);

		await expect(
			transactionRepository.createTransaction({
				userId: ownerUserId,
				input: {
					accountId: otherAccountId,
					amountMinor: 1000,
					currency: "PLN",
					direction: "debit",
					type: "payment",
					title: "Should fail",
					bookingDate: new Date("2026-07-26T00:00:00.000Z"),
				},
			}),
		).rejects.toThrow("ACCOUNT_NOT_FOUND");
	});
});
