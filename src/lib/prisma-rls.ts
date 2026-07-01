import "@tanstack/react-start/server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaClient } from "#/generated/prisma/client";
import { PrismaClient as PrismaClientConstructor } from "#/generated/prisma/client";

const RLS_ENFORCED_ROLE = "authenticated";
const BYPASS_ROLES = new Set(["postgres", "service_role"]);

type PrismaTransaction = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type SessionRoleRow = {
	session_user: string;
	rolsuper: boolean;
	rolbypassrls: boolean;
};

function getRlsConnectionString(): string {
	const connectionString = process.env.DATABASE_URL_RLS;
	if (!connectionString) {
		throw new Error(
			"Missing DATABASE_URL_RLS. Run `npm run db:rls-user` and add the printed connection string to your .env file.",
		);
	}

	return connectionString;
}

const globalForRlsPrisma = globalThis as unknown as {
	prismaRls?: PrismaClient;
};

function getRlsPrisma(): PrismaClient {
	if (!globalForRlsPrisma.prismaRls) {
		const adapter = new PrismaPg({ connectionString: getRlsConnectionString() });
		globalForRlsPrisma.prismaRls = new PrismaClientConstructor({ adapter });
	}

	return globalForRlsPrisma.prismaRls;
}

async function assertRlsCapableSession(tx: PrismaTransaction): Promise<void> {
	const [row] = await tx.$queryRaw<SessionRoleRow[]>`
		SELECT
			session_user::text AS session_user,
			r.rolsuper,
			r.rolbypassrls
		FROM pg_roles r
		WHERE r.rolname = session_user::text
	`;

	if (!row) {
		throw new Error("Unable to verify database session role for RLS.");
	}

	if (
		BYPASS_ROLES.has(row.session_user) ||
		row.rolsuper ||
		row.rolbypassrls
	) {
		throw new Error(
			`RLS queries must not run as ${row.session_user} (superuser or BYPASSRLS). Use DATABASE_URL_RLS from \`npm run db:rls-user\`.`,
		);
	}
}

async function activateRlsSession(
	tx: PrismaTransaction,
	userId: string,
): Promise<void> {
	await assertRlsCapableSession(tx);
	await tx.$executeRawUnsafe(`SET LOCAL ROLE ${RLS_ENFORCED_ROLE}`);
	await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
}

/** Runs Prisma queries under an RLS-enforced DB role and user context. */
export async function withUserRlsContext<T>(
	userId: string,
	fn: (tx: PrismaTransaction) => Promise<T>,
): Promise<T> {
	return getRlsPrisma().$transaction(async (tx) => {
		await activateRlsSession(tx, userId);
		return fn(tx);
	});
}
