import pg from "pg";
import "dotenv/config";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

const cols = await client.query(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`);

console.log(JSON.stringify(cols.rows, null, 2));
await client.end();
