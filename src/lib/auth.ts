import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { log } from "#/lib/logger";
import { prisma } from "#/lib/prisma";
import { provisionInternalAccountForUser } from "#/server/accounts/provision";

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
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					try {
						await provisionInternalAccountForUser(user.id);
					} catch (error) {
						log("error", "account.provision.failed", {
							userId: user.id,
							operation: "provision",
							errorCategory: "DATABASE_ERROR",
							message:
								error instanceof Error ? error.message : "Unknown error",
						});
						// Re-throw so signup does not succeed without an internal account.
						throw error;
					}
				},
			},
		},
	},
	// `username` plugin enables identifier-based login (sign in by username).
	// `tanstackStartCookies` must remain the last plugin in the array.
	plugins: [username(), tanstackStartCookies()],
});
