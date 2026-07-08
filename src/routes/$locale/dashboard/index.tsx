import { usePostHog } from "@posthog/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	ArrowLeftRight,
	Building2,
	ChevronRight,
	FileText,
	Lock,
	Mail,
	PiggyBank,
	ShoppingCart,
	User,
	Wallet,
} from "lucide-react";
import { ConnectBankAccount } from "#/components/dashboard/ConnectBankAccount";
import { DashboardPanel } from "#/components/dashboard/DashboardPanel";
import { QuickTransfer } from "#/components/dashboard/transfers/QuickTransfer";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import type { DashboardAccount, DashboardData } from "#/server/plaid";
import {
	ACCOUNTS_CACHE_TTL_MS,
	formatMoney,
	formatPlDate,
	getDashboardData,
} from "#/server/plaid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$locale/dashboard/")({
	loader: async (): Promise<DashboardData> => getDashboardData(),
	staleTime: ACCOUNTS_CACHE_TTL_MS,
	component: DashboardHome,
});

// TODO: Replace hardcoded dates with dynamic data.
const messages = [
	{ titleKey: "dashboard.messages.securityNotice", date: "24.04.2025" },
	{ titleKey: "dashboard.messages.transferConfirmation", date: "23.04.2025" },
	{ titleKey: "dashboard.messages.newDepositOffer", date: "20.04.2025" },
] as const;

const shortcuts = [
	{ labelKey: "dashboard.shortcuts.changeCardLimit", icon: ArrowLeftRight },
	{ labelKey: "dashboard.shortcuts.blockCard", icon: Lock },
	{ labelKey: "dashboard.shortcuts.openDeposit", icon: PiggyBank },
	{ labelKey: "dashboard.shortcuts.submitApplication", icon: FileText },
] as const;

function getAccountIcon(account: DashboardAccount): LucideIcon {
	if (account.type.includes("savings")) return PiggyBank;
	if (account.type.includes("checking")) return Wallet;
	return User;
}

function getTransactionIcon(amount: number): LucideIcon {
	return amount < 0 ? Building2 : ShoppingCart;
}

function DashboardHome() {
	const t = useTranslation();
	const data: DashboardData = Route.useLoaderData();
	const posthog = usePostHog();
	const localize = useLocalizedPath();

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<header>
				<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					{t("dashboard.greeting", { name: data.user.fullName })}
				</h1>
				{data.user.lastSignIn && (
					<p className="mt-1 text-sm text-muted-foreground">
						{t("dashboard.lastSignIn", { date: data.user.lastSignIn })}
					</p>
				)}
			</header>

			{!data.linked && <ConnectBankAccount />}

			<div className="grid gap-5 lg:grid-cols-3">
				<DashboardPanel title={t("dashboard.panels.myAccounts")} showAllLink>
					{data.accounts.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.empty.noAccounts")}
						</p>
					) : (
						<ul className="space-y-1">
							{data.accounts.map((account) => {
								const Icon = getAccountIcon(account);

								return (
									<li key={account.id}>
										<Link
											to={localize(`/dashboard/accounts/${encodeURIComponent(account.id)}`)}
											className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60"
										>
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
												<Icon className="size-4 text-bank-green" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{account.name}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													**** {account.mask}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												<span className="text-sm font-semibold text-bank-green">
													{formatMoney(account.balance, account.currency)}
												</span>
												<ChevronRight className="size-4 text-muted-foreground" />
											</div>
										</Link>
									</li>
								);
							})}
						</ul>
					)}
				</DashboardPanel>

				<DashboardPanel title={t("dashboard.panels.quickTransfer")}>
					<QuickTransfer accounts={data.accounts} />
					<Link
						className="mt-3 w-full text-center text-sm font-medium text-bank-green hover:underline"
						onClick={() => posthog.capture("transfer_history_viewed")}
						to={localize(`/dashboard/transfers`)}
					>
						{t("dashboard.transfer.history")}
					</Link>
				</DashboardPanel>

				<DashboardPanel title={t("dashboard.panels.messages")} showAllLink>
					<ul className="space-y-1">
						{messages.map((message) => (
							<li key={message.titleKey}>
								<button
									type="button"
									className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60"
									onClick={() =>
										posthog.capture("dashboard_message_opened", {
											message_title: message.titleKey,
										})
									}
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
										<Mail className="size-4 text-bank-green" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{t(message.titleKey)}
										</p>
										<p className="text-xs text-muted-foreground">
											{message.date}
										</p>
									</div>
									<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
								</button>
							</li>
						))}
					</ul>
				</DashboardPanel>

				<DashboardPanel
					title={t("dashboard.panels.recentTransactions")}
					showAllLink
					showAllTo={localize("/dashboard/transactions")}
				>
					{data.transactions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.empty.noTransactions")}
						</p>
					) : (
						<ul className="space-y-1">
							{data.transactions.map((tx) => {
								const Icon = getTransactionIcon(tx.amount);
								const isCredit = tx.amount < 0;

								return (
									<li key={tx.id}>
										<div className="flex items-center gap-3 rounded-lg px-2 py-3">
											<div className="w-16 shrink-0 text-xs text-muted-foreground">
												{formatPlDate(tx.date)}
											</div>
											<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
												<Icon className="size-4 text-bank-green" />
											</div>
											<p className="min-w-0 flex-1 truncate text-sm font-medium">
												{tx.name}
											</p>
											<span
												className={cn(
													"shrink-0 text-sm font-semibold",
													isCredit ? "text-bank-green" : "text-foreground",
												)}
											>
												{isCredit ? "+" : "-"}
												{formatMoney(Math.abs(tx.amount), tx.currency)}
											</span>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</DashboardPanel>

				<DashboardPanel title={t("dashboard.panels.mySummary")}>
					{data.summary ? (
						<>
							<dl className="space-y-4">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-sm text-muted-foreground">
										{t("dashboard.summary.availableFunds")}
									</dt>
									<dd className="text-sm font-semibold text-bank-green">
										{formatMoney(
											data.summary.totalAvailable,
											data.summary.currency,
										)}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-sm text-muted-foreground">
										{t("dashboard.summary.savings")}
									</dt>
									<dd className="text-sm font-semibold">
										{formatMoney(data.summary.savings, data.summary.currency)}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-sm text-muted-foreground">
										{t("dashboard.summary.linkedAccounts")}
									</dt>
									<dd className="text-sm font-semibold">
										{t("dashboard.summary.activeAccounts", {
											count: data.accounts.length,
										})}
									</dd>
								</div>
							</dl>
							<Button
								variant="outline"
								className="mt-6 w-full border-bank-green text-bank-green hover:bg-bank-green hover:text-white"
							>
								{t("dashboard.summary.viewFull")}
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.empty.connectForSummary")}
						</p>
					)}
				</DashboardPanel>

				<DashboardPanel title={t("dashboard.panels.shortcuts")}>
					<ul className="space-y-1">
						{shortcuts.map((shortcut) => (
							<li key={shortcut.labelKey}>
								<button
									type="button"
									className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60"
									onClick={() =>
										posthog.capture("dashboard_shortcut_clicked", {
											shortcut_label: shortcut.labelKey,
										})
									}
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
										<shortcut.icon className="size-4 text-bank-green" />
									</div>
									<span className="flex-1 text-sm font-medium">
										{t(shortcut.labelKey)}
									</span>
									<ChevronRight className="size-4 text-muted-foreground" />
								</button>
							</li>
						))}
					</ul>
				</DashboardPanel>
			</div>
		</div>
	);
}
