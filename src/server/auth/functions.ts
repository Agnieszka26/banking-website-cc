import { createServerFn } from "@tanstack/react-start";
import {
	createUser,
	findUserById,
	findUserByUsername,
	updateLastSignIn,
} from "./users";
import { createSession, destroySession, getSessionUserId } from "./sessions";

export const getAuthUserId = createServerFn({ method: "GET" }).handler(
	async () => getSessionUserId(),
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = getSessionUserId();
		if (!userId) return null;

		const user = findUserById(userId);
		if (!user) return null;

		return {
			id: user.id,
			username: user.username,
			email: `${user.username}@example.com`,
			name:
				[user.firstName, user.lastName].filter(Boolean).join(" ") ||
				user.username,
		};
	},
);

export const signIn = createServerFn({ method: "POST" })
	.validator((data: { username: string; password: string }) => {
		if (!data.username?.trim() || !data.password) {
			throw new Error("Identyfikator i hasło są wymagane");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const user = findUserByUsername(data.username.trim());
		if (!user || user.password !== data.password) {
			throw new Error("Nieprawidłowy identyfikator lub hasło");
		}

		updateLastSignIn(user.id);
		createSession(user.id);

		return { success: true };
	});

export const signUp = createServerFn({ method: "POST" })
	.validator(
		(data: {
			username: string;
			password: string;
			firstName?: string;
			lastName?: string;
		}) => {
			if (!data.username?.trim() || !data.password) {
				throw new Error("Identyfikator i hasło są wymagane");
			}
			return data;
		},
	)
	.handler(async ({ data }) => {
		const user = createUser(data);
		updateLastSignIn(user.id);
		createSession(user.id);

		return { success: true };
	});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
	destroySession();
	return { success: true };
});
