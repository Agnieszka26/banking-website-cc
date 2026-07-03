/**
 * RLS tests for deprecated legacy tables (`profiles`, `accounts`, `transactions`).
 * The app does not query these tables; banking data comes from the Plaid API.
 * Policies remain until the tables are dropped from Supabase.
 */
import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL;
const describeIfDb = connectionString ? describe : describe.skip;

describeIfDb("legacy table row level security", () => {
	const ownerUserId = `rls-legacy-owner-${randomUUID()}`;
	const otherUserId = `rls-legacy-other-${randomUUID()}`;
	const ownerAccountId = `acct-${randomUUID()}`;
	let client: pg.Client;

	beforeAll(async () => {
		client = new pg.Client({ connectionString });
		await client.connect();

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
		await client.end();
	});

	async function queryAsAppUser<T extends pg.QueryResultRow>(
		userId: string,
		sql: string,
		params: unknown[] = [],
	): Promise<pg.QueryResult<T>> {
		await client.query("BEGIN");
		try {
			await client.query("SET LOCAL ROLE authenticated");
			await client.query("SELECT set_config('app.current_user_id', $1, true)", [
				userId,
			]);
			const result = await client.query<T>(sql, params);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	}

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

		expect(result.rows).toEqual([
			{ account_id: ownerAccountId, type: "debit" },
		]);
	});
});
