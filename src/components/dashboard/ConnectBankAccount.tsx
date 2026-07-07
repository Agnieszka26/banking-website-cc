import { usePostHog } from "@posthog/react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { type PlaidLinkOnSuccess, usePlaidLink } from "react-plaid-link";
import { useTranslation } from "#/lib/i18n";
import { createLinkToken, exchangePublicToken } from "#/server/plaid";
import { Button } from "@/components/ui/button";

/** Plaid Link flow for connecting a bank account to the dashboard. */
export function ConnectBankAccount() {
	const t = useTranslation();
	const router = useRouter();
	const posthog = usePostHog();
	const createLinkTokenFn = useServerFn(createLinkToken);
	const exchangePublicTokenFn = useServerFn(exchangePublicToken);
	const [linkToken, setLinkToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLinking, setIsLinking] = useState(false);

	useEffect(() => {
		createLinkTokenFn()
			.then((data) => setLinkToken(data.linkToken))
			.catch(() => {
				setError(t("dashboard.connectBank.linkTokenError"));
			});
	}, [createLinkTokenFn, t]);

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (publicToken) => {
			setIsLinking(true);
			setError(null);

			try {
				await exchangePublicTokenFn({ data: { publicToken } });
				posthog.capture("bank_account_connected");
				await router.invalidate();
			} catch {
				setError(t("dashboard.connectBank.connectError"));
				posthog.capture("bank_account_connect_failed");
			} finally {
				setIsLinking(false);
			}
		},
		[exchangePublicTokenFn, router, posthog, t],
	);

	const { open, ready } = usePlaidLink({
		token: linkToken,
		onSuccess,
	});

	return (
		<div className="rounded-xl border border-dashed border-bank-green/40 bg-bank-green-light/50 p-6">
			<h2 className="text-lg font-semibold text-foreground">
				{t("dashboard.connectBank.title")}
			</h2>
			<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
				{t("dashboard.connectBank.description")}
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
			<Button
				className="mt-4 bg-bank-green hover:bg-bank-green/90"
				disabled={!ready || !linkToken || isLinking}
				onClick={() => {
					posthog.capture("bank_account_connect_opened");
					open();
				}}
			>
				{isLinking
					? t("dashboard.connectBank.connecting")
					: t("dashboard.connectBank.connectButton")}
			</Button>
		</div>
	);
}
