import type pg from "pg";

/** Runs SQL as the `authenticated` role with optional app user context (RLS tests). */
export async function queryAsAppUser<T extends pg.QueryResultRow>(
	client: pg.Client,
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
