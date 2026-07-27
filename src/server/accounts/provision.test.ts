/**
 * Integration tests for internal account provisioning (IBAN + initial deposit).
 * Skips when DATABASE_URL is not configured.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { INITIAL_DEPOSIT_AMOUNT_MINOR, INITIAL_DEPOSIT_TITLE } from "#/server/accounts/constants";
import { provisionInternalAccountForUser } from "#/server/accounts/provision";

const connectionString = process.env.DATABASE_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("provisionInternalAccountForUser", () => {
	const userIds: string[] = [];

	afterAll(async () => {
		if (userIds.length === 0) {
			return;
		}
		const { prisma } = await import("#/lib/prisma");
		const accounts = await prisma.ledgerAccount.findMany({
			where: { userId: { in: userIds } },
			select: { id: true },
		});
		const accountIds = accounts.map((row) => row.id);
		if (accountIds.length > 0) {
			await prisma.ledgerTransaction.deleteMany({
				where: { accountId: { in: accountIds } },
			});
			await prisma.ledgerAccount.deleteMany({
				where: { id: { in: accountIds } },
			});
		}
	});

	it("creates an account with IBAN and initial 1000 PLN ledger deposit", async () => {
		const { prisma } = await import("#/lib/prisma");
		const userId = `provision-${randomUUID()}`;
		userIds.push(userId);

		const account = await provisionInternalAccountForUser(userId);

		expect(account.userId).toBe(userId);
		expect(account.iban).toMatch(/^PL\d{26}$/);
		expect(account.currency).toBe("PLN");
		expect(account.balanceMinor).toBe(INITIAL_DEPOSIT_AMOUNT_MINOR);

		const deposit = await prisma.ledgerTransaction.findFirst({
			where: {
				accountId: account.id,
				type: "deposit",
				direction: "credit",
				title: INITIAL_DEPOSIT_TITLE,
			},
		});

		expect(deposit).not.toBeNull();
		expect(Number(deposit?.amountMinor)).toBe(INITIAL_DEPOSIT_AMOUNT_MINOR);
	});

	it("is idempotent for the same user", async () => {
		const userId = `provision-idem-${randomUUID()}`;
		userIds.push(userId);

		const first = await provisionInternalAccountForUser(userId);
		const second = await provisionInternalAccountForUser(userId);

		expect(second.id).toBe(first.id);
		expect(second.iban).toBe(first.iban);
		expect(second.balanceMinor).toBe(INITIAL_DEPOSIT_AMOUNT_MINOR);
	});
});
