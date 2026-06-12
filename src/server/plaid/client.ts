import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidEnv = process.env.PLAID_ENV ?? "sandbox";

const basePath =
	plaidEnv === "production"
		? PlaidEnvironments.production
		: plaidEnv === "development"
			? PlaidEnvironments.development
			: PlaidEnvironments.sandbox;

export const plaidClient = new PlaidApi(
	new Configuration({
		basePath,
		baseOptions: {
			headers: {
				"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
				"PLAID-SECRET": process.env.PLAID_SECRET!,
			},
		},
	}),
);
