import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
	throw new Error("Missing DIRECT_URL");
}

const sqlPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"../prisma/migrations/20250630120000_enable_rls/migration.sql",
);

const client = new pg.Client({ connectionString });
await client.connect();

try {
	await client.query(readFileSync(sqlPath, "utf8"));
	console.log("RLS migration applied.");
} finally {
	await client.end();
}
