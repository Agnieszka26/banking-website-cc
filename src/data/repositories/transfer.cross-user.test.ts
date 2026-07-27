/**
 * Cross-user IBAN transfer integration test (owner Prisma settlement path).
 * Skips when DATABASE_URL is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { transferRepository } from "#/data/repositories/transfer.repository";
import { generatePolishIban } from "#/lib/iban";
import { fromMinorBigInt } from "#/lib/money";

const connectionString = process.env.DATABASE_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("transferRepository cross-user IBAN settlement", () => {
	const senderUserId = `xfer-sender-${randomUUID()}`;
	const recipientUserId = `xfer-recipient-${randomUUID()}`;
	let sourceAccountId = "";
	let destinationAccountId = "";
	let destinationIban = "";

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
		destinationIban = generatePolishIban();

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
				iban: destinationIban,
				currency: "PLN",
				balanceMinor: 10_000n,
			},
		});
		destinationAccountId = destination.id;

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
});
