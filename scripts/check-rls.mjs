import pg from "pg";
import "dotenv/config";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

const rls = await client.query(`
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname
`);

const policies = await client.query(`
  SELECT tablename, policyname, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname
`);

console.log("RLS:", JSON.stringify(rls.rows, null, 2));
console.log("Policies:", JSON.stringify(policies.rows, null, 2));

await client.end();
