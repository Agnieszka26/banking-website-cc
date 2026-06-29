import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"Missing DATABASE_URL. Set it to your Supabase Postgres connection string in your .env file.",
	);
}

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	database: new Pool({ connectionString }),
	emailAndPassword: {
		enabled: true,
	},
	// `username` plugin matches the app's identifier-based login flow.
	// `tanstackStartCookies` must remain the last plugin in the array.
	plugins: [username(), tanstackStartCookies()],
});
