import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
	throw new Error("Missing DIRECT_URL");
}

const migrationsDir = join(
	dirname(fileURLToPath(import.meta.url)),
	"../prisma/migrations",
);

const migrationFiles = readdirSync(migrationsDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort()
	.map((name) => join(migrationsDir, name, "migration.sql"));

const client = new pg.Client({ connectionString });
await client.connect();

try {
	for (const sqlPath of migrationFiles) {
		await client.query(readFileSync(sqlPath, "utf8"));
		console.log(`Applied ${sqlPath.split(/[/\\]/).slice(-2, -1)[0]}`);
	}
	console.log("All RLS migrations applied.");
} finally {
	await client.end();
}
