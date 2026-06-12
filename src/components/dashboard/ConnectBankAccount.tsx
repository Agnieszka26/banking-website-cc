import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
	type PlaidLinkOnSuccess,
	usePlaidLink,
} from "react-plaid-link";
import { createLinkToken, exchangePublicToken } from "#/server/plaid";
import { Button } from "@/components/ui/button";

export function ConnectBankAccount() {
	const router = useRouter();
	const createLinkTokenFn = useServerFn(createLinkToken);
	const exchangePublicTokenFn = useServerFn(exchangePublicToken);
	const [linkToken, setLinkToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLinking, setIsLinking] = useState(false);

	useEffect(() => {
		createLinkTokenFn()
			.then((data) => setLinkToken(data.linkToken))
			.catch(() => {
				setError("Nie udało się przygotować połączenia z bankiem.");
			});
	}, [createLinkTokenFn]);

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (publicToken) => {
			setIsLinking(true);
			setError(null);

			try {
				await exchangePublicTokenFn({ data: { publicToken } });
				await router.invalidate();
			} catch {
				setError("Nie udało się połączyć konta bankowego.");
			} finally {
				setIsLinking(false);
			}
		},
		[exchangePublicTokenFn, router],
	);

	const { open, ready } = usePlaidLink({
		token: linkToken,
		onSuccess,
	});

	return (
		<div className="rounded-xl border border-dashed border-bank-green/40 bg-bank-green-light/50 p-6">
			<h2 className="text-lg font-semibold text-foreground">
				Połącz konto bankowe
			</h2>
			<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
				Aby wyświetlić rachunki i transakcje, połącz konto przez bezpieczny
				moduł Plaid. W środowisku sandbox możesz użyć danych testowych Plaid.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
			<Button
				className="mt-4 bg-bank-green hover:bg-bank-green/90"
				disabled={!ready || !linkToken || isLinking}
				onClick={() => open()}
			>
				{isLinking ? "Łączenie..." : "Połącz konto przez Plaid"}
			</Button>
		</div>
	);
}
