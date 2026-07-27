/**
 * RLS + repository integration tests for own-account transfers.
 * Skips when DATABASE_URL_RLS is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transferRepository } from "#/data/repositories/transfer.repository";
import { fromMinorBigInt } from "#/lib/money";

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
		const { generatePolishIban } = await import("#/lib/iban");

		const source = await prisma.ledgerAccount.create({
			data: {
				userId: ownerUserId,
				name: "Source",
				iban: generatePolishIban(),
				currency: "PLN",
				balanceMinor: 50_000n,
			},
		});
		sourceAccountId = source.id;

		const destination = await prisma.ledgerAccount.create({
			data: {
				userId: ownerUserId,
				name: "Destination",
				iban: generatePolishIban(),
				currency: "PLN",
				balanceMinor: 10_000n,
			},
		});
		destinationAccountId = destination.id;

		const other = await prisma.ledgerAccount.create({
			data: {
				userId: otherUserId,
				name: "Other",
				iban: generatePolishIban(),
				currency: "PLN",
				balanceMinor: 50_000n,
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

		expect(created.deduplicated).toBe(false);
		expect(created.transfer.transactionIds).toHaveLength(2);

		const source = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
		});
		const destination = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: destinationAccountId },
		});

		expect(fromMinorBigInt(source.balanceMinor)).toBe(47_500);
		expect(fromMinorBigInt(destination.balanceMinor)).toBe(12_500);

		const legs = await prisma.ledgerTransaction.findMany({
			where: { transferId: created.transfer.id },
		});
		expect(legs).toHaveLength(2);
		expect(legs.every((leg) => leg.type === "transfer")).toBe(true);
	});

	it("returns an existing recent duplicate instead of creating a second transfer", async () => {
		const { prisma } = await import("#/lib/prisma");
		const input = {
			sourceAccountId,
			destinationAccountId,
			amountMinor: 1500,
			currency: "PLN",
			title: "Dedup transfer",
		};

		const first = await transferRepository.createTransfer({
			userId: ownerUserId,
			input,
		});
		expect(first.deduplicated).toBe(false);

		const beforeCount = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId, title: input.title },
		});
		const beforeSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});

		const second = await transferRepository.createTransfer({
			userId: ownerUserId,
			input,
		});

		expect(second.deduplicated).toBe(true);
		expect(second.transfer.id).toBe(first.transfer.id);
		expect(second.transfer.transactionIds).toEqual(
			first.transfer.transactionIds,
		);

		const afterCount = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId, title: input.title },
		});
		const afterSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});
		expect(afterCount).toBe(beforeCount);
		expect(fromMinorBigInt(afterSource.balanceMinor)).toBe(
			fromMinorBigInt(beforeSource.balanceMinor),
		);
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

	it("rejects identical source and destination before any writes", async () => {
		const { prisma } = await import("#/lib/prisma");
		const beforeTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId },
		});
		const beforeLegs = await prisma.ledgerTransaction.count({
			where: { accountId: sourceAccountId },
		});

		await expect(
			transferRepository.createTransfer({
				userId: ownerUserId,
				input: {
					sourceAccountId,
					destinationAccountId: sourceAccountId,
					amountMinor: 1000,
					currency: "PLN",
					title: "Same account",
				},
			}),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

		const afterTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId },
		});
		const afterLegs = await prisma.ledgerTransaction.count({
			where: { accountId: sourceAccountId },
		});
		expect(afterTransfers).toBe(beforeTransfers);
		expect(afterLegs).toBe(beforeLegs);
	});

	it("rejects currency mismatch before any writes", async () => {
		const { prisma } = await import("#/lib/prisma");
		const beforeTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId },
		});

		await expect(
			transferRepository.createTransfer({
				userId: ownerUserId,
				input: {
					sourceAccountId,
					destinationAccountId,
					amountMinor: 1000,
					currency: "EUR",
					title: "FX not allowed",
				},
			}),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

		const afterTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId },
		});
		expect(afterTransfers).toBe(beforeTransfers);
	});

	it("rejects overdraft with INSUFFICIENT_FUNDS and leaves balances unchanged", async () => {
		const { prisma } = await import("#/lib/prisma");
		const beforeSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});
		const beforeBalance = fromMinorBigInt(beforeSource.balanceMinor);
		const beforeTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId, title: "Overdraft" },
		});
		const beforeLegs = await prisma.ledgerTransaction.count({
			where: {
				accountId: { in: [sourceAccountId, destinationAccountId] },
				title: "Overdraft",
			},
		});

		await expect(
			transferRepository.createTransfer({
				userId: ownerUserId,
				input: {
					sourceAccountId,
					destinationAccountId,
					amountMinor: beforeBalance + 1,
					currency: "PLN",
					title: "Overdraft",
				},
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });

		const afterSource = await prisma.ledgerAccount.findUniqueOrThrow({
			where: { id: sourceAccountId },
			select: { balanceMinor: true },
		});
		expect(fromMinorBigInt(afterSource.balanceMinor)).toBe(beforeBalance);

		const afterTransfers = await prisma.ledgerTransfer.count({
			where: { userId: ownerUserId, title: "Overdraft" },
		});
		const afterLegs = await prisma.ledgerTransaction.count({
			where: {
				accountId: { in: [sourceAccountId, destinationAccountId] },
				title: "Overdraft",
			},
		});
		expect(afterTransfers).toBe(beforeTransfers);
		expect(afterLegs).toBe(beforeLegs);
	});
});
