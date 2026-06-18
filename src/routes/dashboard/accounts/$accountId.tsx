import { createFileRoute, Link } from "@tanstack/react-router";
import { usePostHog } from "@posthog/react";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { formatMoney, getDashboardData } from "#/server/plaid";

export const Route = createFileRoute("/dashboard/accounts/$accountId")({
	loader: ({ params }) =>
		getDashboardData().then((data) => {
			const account = data.accounts.find(
				(item) => item.id === params.accountId,
			);

			if (!account) {
				throw new Error("Nie znaleziono rachunku.");
			}

			return { account, transactions: data.transactions };
		}),
	component: AccountDetailsPage,
});

function AccountDetailsPage() {
	const { account, transactions } = Route.useLoaderData();
	const posthog = usePostHog();

	useEffect(() => {
		posthog.capture("account_details_viewed", {
			account_type: account.type,
			account_mask: account.mask,
		});
	}, [posthog, account.type, account.mask]);

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Link
				to="/dashboard"
				className="inline-flex items-center gap-1 text-sm font-medium text-bank-green hover:underline"
			>
				<ChevronLeft className="size-4" />
				Powrót do pulpitu
			</Link>

			<header className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<h1 className="text-2xl font-bold">{account.name}</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					**** {account.mask}
				</p>
				<p className="mt-4 text-3xl font-semibold text-bank-green">
					{formatMoney(account.balance, account.currency)}
				</p>
			</header>

			<section className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<h2 className="text-lg font-semibold">Ostatnie operacje</h2>
				{transactions.length === 0 ? (
					<p className="mt-3 text-sm text-muted-foreground">
						Brak transakcji na tym rachunku.
					</p>
				) : (
					<ul className="mt-4 space-y-3">
						{transactions.map((tx) => (
							<li
								key={tx.id}
								className="flex items-center justify-between gap-4 text-sm"
							>
								<span className="font-medium">{tx.name}</span>
								<span>
									{tx.amount < 0 ? "+" : "-"}
									{formatMoney(Math.abs(tx.amount), tx.currency)}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
