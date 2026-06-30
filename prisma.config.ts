import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	// CLI operations (db push, migrate, studio, introspect) use a session
	// connection. The transaction pooler (6543) can't run these reliably.
	datasource: {
		url: env("DIRECT_URL"),
	},
});
