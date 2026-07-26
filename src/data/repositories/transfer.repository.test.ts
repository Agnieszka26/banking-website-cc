/**
 * RLS + repository integration tests for own-account transfers.
 * Skips when DATABASE_URL_RLS is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transferRepository } from "#/data/repositories/transfer.repository";

const connectionString = process.env.DATABASE_URL_RLS;
const describeIfRlsDb = connectionString ? describe : describe.skip;

describeIfRlsDb("transferRepository (ledger RLS)", () => {
	const ownerUserId = `transfer-owner-${randomUUID()}`;
	const otherUserId = `transfer-other-${randomUUID()}`;
	let sourceAccountId = "";
	let destinationAccountId = "";
	let otherAccountId = "";

	beforeAll(async () => {
		const { prisma } = await import("#/lib/prisma");

		const source = await prisma.ledgerAccount.create({
			data: {
				userId: ownerUserId,
				name: "Source",
				currency: "PLN",
				balanceMinor: 50_000,
			},
		});
		sourceAccountId = source.id;

		const destination = await prisma.ledgerAccount.create({
			data: {
				userId: ownerUserId,
				name: "Destination",
				currency: "PLN",
				balanceMinor: 10_000,
			},
		});
		destinationAccountId = destination.id;

		const other = await prisma.ledgerAccount.create({
			data: {
				userId: otherUserId,
				name: "Other",
				currency: "PLN",
				balanceMinor: 50_000,
			},
		});
		otherAccountId = other.id;
	});

	afterAll(async () => {
		const accountIds = [
			sourceAccountId,
			destinationAccountId,
			otherAccountId,
		].filter(Boolean);
		if (accountIds.length === 0) {
			return;
		}

		const { prisma } = await import("#/lib/prisma");
		await prisma.ledgerTransaction.deleteMany({
			where: { accountId: { in: accountIds } },
		});
		await prisma.ledgerTransfer.deleteMany({
			where: { userId: { in: [ownerUserId, otherUserId] } },
		});
		await prisma.ledgerAccount.deleteMany({
			where: { id: { in: accountIds } },
		});
	});

	it("creates an atomic own-account transfer", async () => {
		const { prisma } = await import("#/lib/prisma");
		const amountMinor = 2500;

		const created = await transferRepository.createTransfer({
			userId: ownerUserId,
			input: {
				sourceAccountId,
				destinationAccountId,
				amountMinor,
				currency: "PLN",
				title: "Repo transfer",
			},
		});

		expect(created.transactionIds).toHaveLength(2);

		const source = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
		});
		const destination = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: destinationAccountId },
		});

		expect(source.balanceMinor).toBe(47_500);
		expect(destination.balanceMinor).toBe(12_500);

		const legs = await prisma.ledgerTransaction.findMany({
			where: { transferId: created.id },
		});
		expect(legs).toHaveLength(2);
		expect(legs.every((leg) => leg.type === "transfer")).toBe(true);
	});

	it("rejects transfer from another user's account", async () => {
		await expect(
			transferRepository.createTransfer({
				userId: ownerUserId,
				input: {
					sourceAccountId: otherAccountId,
					destinationAccountId,
					amountMinor: 1000,
					currency: "PLN",
					title: "Forbidden",
				},
			}),
		).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
	});

	it("rejects overdraft with INSUFFICIENT_FUNDS and leaves balances unchanged", async () => {
		const { prisma } = await import("#/lib/prisma");
		const beforeSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});

		await expect(
			transferRepository.createTransfer({
				userId: ownerUserId,
				input: {
					sourceAccountId,
					destinationAccountId,
					amountMinor: beforeSource.balanceMinor + 1,
					currency: "PLN",
					title: "Overdraft",
				},
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });

		const afterSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});
		expect(afterSource.balanceMinor).toBe(beforeSource.balanceMinor);
	});
});
