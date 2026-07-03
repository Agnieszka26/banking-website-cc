import type {
	DashboardData,
	DashboardOverview,
	DashboardTransactionsPayload,
	DashboardUser,
} from "./types";

export type DashboardSessionSource = {
	user: {
		name: string;
		username?: string | null;
	};
	session: {
		createdAt: Date | string | null;
	};
};

/** Maps a Better Auth session to dashboard user display fields. */
export function toDashboardUser(session: DashboardSessionSource): DashboardUser {
	const fullName = session.user.name || session.user.username || "Użytkowniku";
	const [firstName, ...rest] = fullName.split(" ");
	const signedInAt = session.session.createdAt;

	return {
		firstName: firstName ?? "",
		lastName: rest.join(" "),
		fullName,
		lastSignIn: signedInAt
			? new Date(signedInAt).toLocaleString("pl-PL", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})
			: null,
	};
}

/** Merges split dashboard payloads into the legacy combined shape. */
export function mergeDashboardData(
	overview: DashboardOverview,
	transactions: DashboardTransactionsPayload,
): DashboardData {
	return {
		linked: overview.linked && transactions.linked,
		user: overview.user,
		accounts: overview.accounts,
		transactions: transactions.transactions,
		summary: overview.summary,
	};
}
