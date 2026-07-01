import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("row level security", () => {
	const ownerUserId = `rls-owner-${randomUUID()}`;
	const otherUserId = `rls-other-${randomUUID()}`;
	const ownerAccountId = `acct-${randomUUID()}`;
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

		await client.query(
			`INSERT INTO transactions (account_id, amount, type)
       VALUES ($1, 10.50, 'debit')
       ON CONFLICT (account_id) DO UPDATE SET amount = EXCLUDED.amount`,
			[ownerAccountId],
		);

		await client.query(
			`INSERT INTO accounts ("user_UID", account_id)
       VALUES ($1, $2)
       ON CONFLICT (account_id) DO UPDATE SET "user_UID" = EXCLUDED."user_UID"`,
			[ownerUserId, ownerAccountId],
		);
	});

	afterAll(async () => {
		if (!client) {
			return;
		}

		await client.query("DELETE FROM accounts WHERE account_id = $1", [
			ownerAccountId,
		]);
		await client.query("DELETE FROM transactions WHERE account_id = $1", [
			ownerAccountId,
		]);
		await client.query("DELETE FROM plaid_link WHERE user_id = ANY($1::text[])", [
			[ownerUserId, otherUserId],
		]);
		await client.end();
	});

	async function queryAsAppUser<T extends pg.QueryResultRow>(
		userId: string | null,
		sql: string,
		params: unknown[] = [],
	): Promise<pg.QueryResult<T>> {
		await client.query("BEGIN");
		try {
			await client.query("SET LOCAL ROLE authenticated");
			if (userId) {
				await client.query("SELECT set_config('app.current_user_id', $1, true)", [
					userId,
				]);
			}
			const result = await client.query<T>(sql, params);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	}

	it("blocks plaid_link reads without a user context", async () => {
		const result = await queryAsAppUser(
			null,
			"SELECT user_id FROM plaid_link WHERE user_id = ANY($1::text[])",
			[[ownerUserId, otherUserId]],
		);

		expect(result.rows).toHaveLength(0);
	});

	it("allows users to read only their own plaid_link row", async () => {
		const ownRows = await queryAsAppUser(
			ownerUserId,
			"SELECT user_id, access_token FROM plaid_link WHERE user_id = $1",
			[ownerUserId],
		);
		const foreignRows = await queryAsAppUser(
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

	it("blocks transactions for accounts owned by another user", async () => {
		const result = await queryAsAppUser(
			otherUserId,
			"SELECT account_id FROM transactions WHERE account_id = $1",
			[ownerAccountId],
		);

		expect(result.rows).toHaveLength(0);
	});

	it("allows owners to read their own transactions", async () => {
		const result = await queryAsAppUser(
			ownerUserId,
			"SELECT account_id, type FROM transactions WHERE account_id = $1",
			[ownerAccountId],
		);

		expect(result.rows).toEqual([{ account_id: ownerAccountId, type: "debit" }]);
	});
});
