export type User = {
	id: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
	lastSignIn: Date | null;
};

const users = new Map<string, User>();
const usernameIndex = new Map<string, string>();

const demoUser: User = {
	id: "demo-user-id",
	username: "demo",
	password: "demo",
	firstName: "Jan",
	lastName: "Kowalski",
	lastSignIn: null,
};

users.set(demoUser.id, demoUser);
usernameIndex.set(demoUser.username, demoUser.id);

export function findUserById(userId: string): User | undefined {
	return users.get(userId);
}

export function findUserByUsername(username: string): User | undefined {
	const userId = usernameIndex.get(username.toLowerCase());
	return userId ? users.get(userId) : undefined;
}

export function createUser(input: {
	username: string;
	password: string;
	firstName?: string;
	lastName?: string;
}): User {
	const normalizedUsername = input.username.trim().toLowerCase();

	if (!normalizedUsername || !input.password) {
		throw new Error("Identyfikator i hasło są wymagane");
	}

	if (usernameIndex.has(normalizedUsername)) {
		throw new Error("Użytkownik o tym identyfikatorze już istnieje");
	}

	const user: User = {
		id: crypto.randomUUID(),
		username: normalizedUsername,
		password: input.password,
		firstName: input.firstName?.trim() || normalizedUsername,
		lastName: input.lastName?.trim() || "",
		lastSignIn: null,
	};

	users.set(user.id, user);
	usernameIndex.set(normalizedUsername, user.id);

	return user;
}

export function updateLastSignIn(userId: string): void {
	const user = users.get(userId);
	if (!user) return;
	user.lastSignIn = new Date();
}

export function getDashboardUser(userId: string) {
	const user = findUserById(userId);
	if (!user) {
		throw new Error("User not found");
	}

	const fullName =
		[user.firstName, user.lastName].filter(Boolean).join(" ") || "Użytkowniku";

	return {
		firstName: user.firstName,
		lastName: user.lastName,
		fullName,
		lastSignIn: user.lastSignIn
			? user.lastSignIn.toLocaleString("pl-PL", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})
			: null,
	};
}
