import { usePostHog } from "@posthog/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import type {
	DashboardAccount,
	DashboardTransaction,
} from "#/server/plaid";
import {
	ACCOUNTS_CACHE_TTL_MS,
	formatMoney,
	getDashboardData,
} from "#/server/plaid";

type AccountDetailsLoaderData = {
	account: DashboardAccount;
	transactions: DashboardTransaction[];
};

export const Route = createFileRoute("/$locale/dashboard/accounts/$accountId")({
	loader: async ({
		params,
	}): Promise<AccountDetailsLoaderData> => {
		const data = await getDashboardData();
		const account = data.accounts.find((item) => item.id === params.accountId);

		if (!account) {
			throw notFound();
		}

		return { account, transactions: data.transactions };
	},
	staleTime: ACCOUNTS_CACHE_TTL_MS,
	component: AccountDetailsPage,
});

function AccountDetailsPage() {
	const t = useTranslation();
	const { account, transactions }: AccountDetailsLoaderData =
		Route.useLoaderData();
	const posthog = usePostHog();
	const localize = useLocalizedPath();

	useEffect(() => {
		posthog.capture("account_details_viewed", {
			account_type: account.type,
			account_mask: account.mask,
		});
	}, [posthog, account.type, account.mask]);

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Link
				to={localize("/dashboard")}
				className="inline-flex items-center gap-1 text-sm font-medium text-bank-green hover:underline"
			>
				<ChevronLeft className="size-4" />
				{t("dashboard.account.backToDashboard")}
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
				<h2 className="text-lg font-semibold">
					{t("dashboard.account.recentTransactions")}
				</h2>
				{transactions.length === 0 ? (
					<p className="mt-3 text-sm text-muted-foreground">
						{t("dashboard.empty.noAccountTransactions")}
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
