import "@tanstack/react-start/server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"Missing DATABASE_URL. Set it to your Supabase Postgres connection string in your .env file.",
	);
}

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString });

/** Shared Prisma client for Supabase PostgreSQL (runtime transaction pooler). */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
