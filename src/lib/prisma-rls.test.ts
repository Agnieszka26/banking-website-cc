import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { withUserRlsContext } from "#/lib/prisma-rls";

const connectionString = process.env.DATABASE_URL_RLS;
const describeIfRlsDb = connectionString ? describe : describe.skip;

describeIfRlsDb("withUserRlsContext", () => {
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

	it("returns only the caller's plaid_link row", async () => {
		const ownToken = await withUserRlsContext(ownerUserId, async (tx) => {
			const record = await tx.plaidLink.findUnique({
				where: { userId: ownerUserId },
				select: { accessToken: true },
			});
			return record?.accessToken ?? null;
		});

		const foreignRows = await withUserRlsContext(ownerUserId, async (tx) => {
			return tx.plaidLink.findMany({
				where: { userId: otherUserId },
				select: { userId: true },
			});
		});

		expect(ownToken).toBe("owner-token");
		expect(foreignRows).toHaveLength(0);
	});
});
