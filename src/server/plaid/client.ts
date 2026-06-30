import "@tanstack/react-start/server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidEnv = process.env.PLAID_ENV ?? "sandbox";

const basePath =
	plaidEnv === "production"
		? PlaidEnvironments.production
		: plaidEnv === "development"
			? PlaidEnvironments.development
			: PlaidEnvironments.sandbox;

const plaidClientId = process.env.PLAID_CLIENT_ID;
const plaidSecret = process.env.PLAID_SECRET;

if (!plaidClientId || !plaidSecret) {
	throw new Error(
		"Missing Plaid credentials. Set PLAID_CLIENT_ID and PLAID_SECRET in your .env file.",
	);
}

/** Configured Plaid API client for the current environment. */
export const plaidClient = new PlaidApi(
	new Configuration({
		basePath,
		baseOptions: {
			timeout: 10_000,
			headers: {
				"PLAID-CLIENT-ID": plaidClientId,
				"PLAID-SECRET": plaidSecret,
			},
		},
	}),
);
