/**
 * Cross-user IBAN transfer integration tests (owner Prisma settlement path).
 * Skips when DATABASE_URL is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transferRepository } from "#/data/repositories/transfer.repository";
import { AccountNotFoundError } from "#/lib/errors";
import { generatePolishIban } from "#/lib/iban";
import { fromMinorBigInt } from "#/lib/money";

const connectionString = process.env.DATABASE_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("transferRepository cross-user IBAN settlement", () => {
	const senderUserId = `xfer-sender-${randomUUID()}`;
	const recipientUserId = `xfer-recipient-${randomUUID()}`;
	let sourceAccountId = "";
	let destinationAccountId = "";

	beforeAll(async () => {
		const { prisma } = await import("#/lib/prisma");

		const source = await prisma.ledgerAccount.create({
			data: {
				userId: senderUserId,
				name: "Sender",
				iban: generatePolishIban(),
				currency: "PLN",
				balanceMinor: 50_000n,
			},
		});
		sourceAccountId = source.id;

		const destination = await prisma.ledgerAccount.create({
			data: {
				userId: recipientUserId,
				name: "Recipient",
				iban: generatePolishIban(),
				currency: "PLN",
				balanceMinor: 10_000n,
			},
		});
		destinationAccountId = destination.id;
	});

	afterAll(async () => {
		const accountIds = [sourceAccountId, destinationAccountId].filter(Boolean);
		if (accountIds.length === 0) {
			return;
		}
		const { prisma } = await import("#/lib/prisma");
		await prisma.ledgerTransaction.deleteMany({
			where: { accountId: { in: accountIds } },
		});
		await prisma.ledgerTransfer.deleteMany({
			where: { userId: { in: [senderUserId, recipientUserId] } },
		});
		await prisma.ledgerAccount.deleteMany({
			where: { id: { in: accountIds } },
		});
	});

	it("atomically debits sender and credits recipient across users", async () => {
		const { prisma } = await import("#/lib/prisma");
		const amountMinor = 2500;

		const { transfer, deduplicated } = await transferRepository.createTransfer({
			userId: senderUserId,
			input: {
				sourceAccountId,
				destinationAccountId,
				amountMinor,
				currency: "PLN",
				title: "Cross-user rent",
				counterpartyName: "Recipient",
				allowCrossUser: true,
			},
		});

		expect(deduplicated).toBe(false);
		expect(transfer.transactionIds).toHaveLength(2);

		const legs = await prisma.ledgerTransaction.findMany({
			where: { id: { in: transfer.transactionIds } },
			select: { id: true, accountId: true, direction: true, type: true },
		});
		expect(legs).toHaveLength(2);
		expect(legs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					accountId: sourceAccountId,
					direction: "debit",
					type: "transfer",
				}),
				expect.objectContaining({
					accountId: destinationAccountId,
					direction: "credit",
					type: "transfer",
				}),
			]),
		);

		const [afterSource, afterDestination] = await Promise.all([
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: sourceAccountId },
				select: { balanceMinor: true },
			}),
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: destinationAccountId },
				select: { balanceMinor: true },
			}),
		]);

		expect(fromMinorBigInt(afterSource.balanceMinor)).toBe(47_500);
		expect(fromMinorBigInt(afterDestination.balanceMinor)).toBe(12_500);
	});

	it("rejects transfer when caller does not own the source account", async () => {
		const { prisma } = await import("#/lib/prisma");

		const [beforeSource, beforeDestination] = await Promise.all([
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: sourceAccountId },
				select: { balanceMinor: true },
			}),
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: destinationAccountId },
				select: { balanceMinor: true },
			}),
		]);

		await expect(
			transferRepository.createTransfer({
				userId: recipientUserId,
				input: {
					sourceAccountId,
					destinationAccountId,
					amountMinor: 1000,
					currency: "PLN",
					title: "Unauthorized cross-user debit",
					allowCrossUser: true,
				},
			}),
		).rejects.toBeInstanceOf(AccountNotFoundError);

		const [afterSource, afterDestination, legCount] = await Promise.all([
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: sourceAccountId },
				select: { balanceMinor: true },
			}),
			prisma.ledgerAccount.findUniqueOrThrow({
				where: { id: destinationAccountId },
				select: { balanceMinor: true },
			}),
			prisma.ledgerTransaction.count({
				where: {
					accountId: { in: [sourceAccountId, destinationAccountId] },
					title: "Unauthorized cross-user debit",
				},
			}),
		]);

		expect(afterSource.balanceMinor).toBe(beforeSource.balanceMinor);
		expect(afterDestination.balanceMinor).toBe(beforeDestination.balanceMinor);
		expect(legCount).toBe(0);
	});
});
