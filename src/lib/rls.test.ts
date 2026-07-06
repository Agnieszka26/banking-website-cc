import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";
import { queryAsAppUser } from "#/lib/test/rls-query";

const connectionString = process.env.DIRECT_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("plaid_link row level security", () => {
	const ownerUserId = `rls-owner-${randomUUID()}`;
	const otherUserId = `rls-other-${randomUUID()}`;
	let client: pg.Client;

	beforeAll(async () => {
		client = new pg.Client({ connectionString });
		await client.connect();

		await client.query(
			`INSERT INTO plaid_link (user_id, access_token, updated_at)
       VALUES ($1, $2, NOW()), ($3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET access_token = EXCLUDED.access_token, updated_at = NOW()`,
			[ownerUserId, "owner-token", otherUserId, "other-token"],
		);
	});

	afterAll(async () => {
		if (!client) {
			return;
		}

		await client.query(
			"DELETE FROM plaid_link WHERE user_id = ANY($1::text[])",
			[[ownerUserId, otherUserId]],
		);
		await client.end();
	});

	it("blocks plaid_link reads without a user context", async () => {
		const result = await queryAsAppUser(
			client,
			null,
			"SELECT user_id FROM plaid_link WHERE user_id = ANY($1::text[])",
			[[ownerUserId, otherUserId]],
		);

		expect(result.rows).toHaveLength(0);
	});

	it("allows users to read only their own plaid_link row", async () => {
		const ownRows = await queryAsAppUser(
			client,
			ownerUserId,
			"SELECT user_id, access_token FROM plaid_link WHERE user_id = $1",
			[ownerUserId],
		);
		const foreignRows = await queryAsAppUser(
			client,
			ownerUserId,
			"SELECT user_id FROM plaid_link WHERE user_id = $1",
			[otherUserId],
		);

		expect(ownRows.rows).toEqual([
			{ user_id: ownerUserId, access_token: "owner-token" },
		]);
		expect(foreignRows.rows).toHaveLength(0);
	});

	it("blocks cross-user updates to plaid_link", async () => {
		const result = await queryAsAppUser(
			client,
			ownerUserId,
			`UPDATE plaid_link
       SET access_token = 'hijacked'
       WHERE user_id = $1
       RETURNING user_id`,
			[otherUserId],
		);

		expect(result.rows).toHaveLength(0);

		const otherRow = await client.query(
			"SELECT access_token FROM plaid_link WHERE user_id = $1",
			[otherUserId],
		);
		expect(otherRow.rows[0]?.access_token).toBe("other-token");
	});
});
