export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
};

export type SessionUserSource = {
	user: {
		id: string;
		name: string;
		email: string;
		username?: string | null;
	};
};

/** Maps a Better Auth session to route/UI user fields. */
export function toAuthenticatedUser(session: SessionUserSource): AuthenticatedUser {
	return {
		id: session.user.id,
		name: session.user.name || session.user.username || "Użytkownik",
		email: session.user.email,
	};
}
