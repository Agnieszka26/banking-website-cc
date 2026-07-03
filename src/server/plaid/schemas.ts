const PUBLIC_TOKEN_MIN_LENGTH = 8;

/** Validates Plaid Link public token exchange input. */
export function parsePublicTokenInput(data: unknown): { publicToken: string } {
	if (!data || typeof data !== "object") {
		throw new Error("Invalid public token");
	}

	const publicToken = (data as { publicToken?: unknown }).publicToken;

	if (typeof publicToken !== "string") {
		throw new Error("Invalid public token");
	}

	const trimmed = publicToken.trim();

	if (trimmed.length < PUBLIC_TOKEN_MIN_LENGTH) {
		throw new Error("Invalid public token");
	}

	return { publicToken: trimmed };
}
