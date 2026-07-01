import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "#/lib/prisma";

/** Better Auth server instance (sessions, identifier login, Prisma adapter). */
export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	// Prisma is the single data-access gateway (Supabase PostgreSQL).
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
	},
	// `username` plugin enables identifier-based login (sign in by username).
	// `tanstackStartCookies` must remain the last plugin in the array.
	plugins: [username(), tanstackStartCookies()],
});
