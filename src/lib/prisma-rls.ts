import type { PrismaClient } from "#/generated/prisma/client";
import { prisma } from "#/lib/prisma";

type PrismaTransaction = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** Runs Prisma queries with `app.current_user_id` set for RLS-enforced roles. */
export async function withUserRlsContext<T>(
	userId: string,
	fn: (tx: PrismaTransaction) => Promise<T>,
): Promise<T> {
	return prisma.$transaction(async (tx) => {
		await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
		return fn(tx);
	});
}
