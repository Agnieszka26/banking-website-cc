import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { plaidLinkRepository } from "#/data/repositories";

const connectionString = process.env.DATABASE_URL_RLS;
const describeIfRlsDb = connectionString ? describe : describe.skip;

describeIfRlsDb("plaidLinkRepository", () => {
	const ownerUserId = `prisma-rls-owner-${randomUUID()}`;
	const otherUserId = `prisma-rls-other-${randomUUID()}`;

	beforeAll(async () => {
		const { prisma } = await import("#/lib/prisma");
		await prisma.plaidLink.createMany({
			data: [
				{ userId: ownerUserId, accessToken: "owner-token" },
				{ userId: otherUserId, accessToken: "other-token" },
			],
			skipDuplicates: true,
		});
	});

	afterAll(async () => {
		const { prisma } = await import("#/lib/prisma");
		await prisma.plaidLink.deleteMany({
			where: { userId: { in: [ownerUserId, otherUserId] } },
		});
	});

	it("returns each user's own plaid_link row", async () => {
		await expect(plaidLinkRepository.getAccessToken(ownerUserId)).resolves.toBe(
			"owner-token",
		);
		await expect(plaidLinkRepository.getAccessToken(otherUserId)).resolves.toBe(
			"other-token",
		);
	});

	it("persists tokens for the authenticated user", async () => {
		const userId = `prisma-rls-save-${randomUUID()}`;

		try {
			await plaidLinkRepository.saveAccessToken(userId, "saved-token");
			await expect(plaidLinkRepository.getAccessToken(userId)).resolves.toBe(
				"saved-token",
			);
		} finally {
			const { prisma } = await import("#/lib/prisma");
			await prisma.plaidLink.deleteMany({ where: { userId } });
		}
	});
});
