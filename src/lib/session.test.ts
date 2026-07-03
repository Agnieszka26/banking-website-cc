import { describe, expect, it } from "vitest";
import { toAuthenticatedUser } from "#/lib/session-user";

describe("toAuthenticatedUser", () => {
	it("prefers display name when present", () => {
		const user = toAuthenticatedUser({
			user: {
				id: "user-1",
				name: "Jan Kowalski",
				username: "jan",
				email: "jan@example.com",
			},
		} as Parameters<typeof toAuthenticatedUser>[0]);

		expect(user).toEqual({
			id: "user-1",
			name: "Jan Kowalski",
			email: "jan@example.com",
		});
	});

	it("falls back to username when name is empty", () => {
		const user = toAuthenticatedUser({
			user: {
				id: "user-2",
				name: "",
				username: "jkowalski",
				email: "jk@example.com",
			},
		} as Parameters<typeof toAuthenticatedUser>[0]);

		expect(user.name).toBe("jkowalski");
	});

	it("uses default label when name and username are missing", () => {
		const user = toAuthenticatedUser({
			user: {
				id: "user-3",
				name: "",
				username: null,
				email: "anon@example.com",
			},
		} as Parameters<typeof toAuthenticatedUser>[0]);

		expect(user.name).toBe("Użytkownik");
	});
});
