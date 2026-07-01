import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const directUrl = process.env.DIRECT_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!directUrl) {
	throw new Error("Missing DIRECT_URL");
}

if (!databaseUrl) {
	throw new Error("Missing DATABASE_URL");
}

const password =
	process.env.BANKING_APP_DB_PASSWORD ?? randomBytes(24).toString("base64url");

const migrationPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"../prisma/migrations/20250630120000_enable_rls/migration.sql",
);

const client = new pg.Client({ connectionString: directUrl });
await client.connect();

try {
	await client.query(readFileSync(migrationPath, "utf8"));
	const escapedPassword = password.replace(/'/g, "''");
	await client.query(
		`ALTER ROLE banking_app_runtime WITH LOGIN PASSWORD '${escapedPassword}'`,
	);
} finally {
	await client.end();
}

const parsed = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
const [runtimeUser, projectRef = ""] = parsed.username.split(".");
const rlsUsername = `banking_app_runtime${projectRef ? `.${projectRef}` : ""}`;
parsed.username = rlsUsername;
parsed.password = password;

const databaseUrlRls = `postgresql://${parsed.username}:${encodeURIComponent(password)}@${parsed.host}${parsed.pathname}`;

const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
const envContents = readFileSync(envPath, "utf8");

if (/^DATABASE_URL_RLS=/m.test(envContents)) {
	console.log("DATABASE_URL_RLS already set in .env; password was rotated.");
	console.log(`BANKING_APP_DB_PASSWORD=${password}`);
	console.log(`DATABASE_URL_RLS=${databaseUrlRls}`);
} else {
	const nextEnv = `${envContents.trimEnd()}\n# RLS-enforced Prisma connection (non-BYPASSRLS login).\nDATABASE_URL_RLS=${databaseUrlRls}\n`;
	writeFileSync(envPath, nextEnv);
	console.log("Added DATABASE_URL_RLS to .env");
	if (!process.env.BANKING_APP_DB_PASSWORD) {
		console.log(
			"Generated BANKING_APP_DB_PASSWORD for banking_app_runtime; save it if you rotate the role again.",
		);
	}
}

console.log(`Skipped runtime user: ${runtimeUser} -> ${rlsUsername}`);
