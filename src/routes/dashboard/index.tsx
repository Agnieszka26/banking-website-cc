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
import type { DashboardAccount } from "#/server/plaid";
import { formatMoney, formatPlDate, getDashboardData } from "#/server/plaid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
	loader: () => getDashboardData(),
	component: DashboardHome,
});
//TODO: Replace hardcoded dates with dynamic data.
const messages = [
	{ title: "Komunikat bezpieczeństwa", date: "24.04.2025" },
	{ title: "Potwierdzenie przelewu", date: "23.04.2025" },
	{ title: "Nowa oferta lokaty", date: "20.04.2025" },
];

const shortcuts = [
	{ label: "Zmień limit karty", icon: ArrowLeftRight },
	{ label: "Zablokuj kartę", icon: Lock },
	{ label: "Otwórz lokatę", icon: PiggyBank },
	{ label: "Złóż wniosek", icon: FileText },
];

function getAccountIcon(account: DashboardAccount): LucideIcon {
	if (account.type.includes("savings")) return PiggyBank;
	if (account.type.includes("checking")) return Wallet;
	return User;
}

function getTransactionIcon(amount: number): LucideIcon {
	return amount < 0 ? Building2 : ShoppingCart;
}

function DashboardHome() {
	//TODO: Add navigation or onClick handlers to interactive buttons.
	const data = Route.useLoaderData();
	const posthog = usePostHog();

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<header>
				<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Dzień dobry, {data.user.fullName}
				</h1>
				{data.user.lastSignIn && (
					<p className="mt-1 text-sm text-muted-foreground">
						Ostatnie logowanie: {data.user.lastSignIn}
					</p>
				)}
			</header>

			{!data.linked && <ConnectBankAccount />}

			<div className="grid gap-5 lg:grid-cols-3">
				<DashboardPanel title="Moje rachunki" showAllLink>
					{data.accounts.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Brak połączonych rachunków.
						</p>
					) : (
						<ul className="space-y-1">
							{data.accounts.map((account) => {
								const Icon = getAccountIcon(account);

								return (
									<li key={account.id}>
										<Link
											to="/dashboard/accounts/$accountId"
											params={{ accountId: account.id }}
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

				<DashboardPanel title="Szybki przelew">
					<div className="grid grid-cols-3 gap-3">
						{[
							{ label: "Na własny rachunek", icon: Wallet },
							{ label: "Do odbiorcy", icon: User },
							{ label: "ZUS / US", icon: Building2 },
						].map((action) => (
							<button
								key={action.label}
								type="button"
								className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 py-4 text-center transition-colors hover:border-bank-green/30 hover:bg-bank-green-light"
								onClick={() =>
									posthog.capture("transfer_type_selected", {
										transfer_type: action.label,
									})
								}
							>
								<div className="flex size-10 items-center justify-center rounded-lg bg-card">
									<action.icon className="size-5 text-bank-green" />
								</div>
								<span className="text-xs font-medium leading-tight text-foreground">
									{action.label}
								</span>
							</button>
						))}
					</div>
					<Button
						className="mt-5 h-11 w-full bg-bank-green text-base font-semibold hover:bg-bank-green/90"
						disabled={!data.linked}
						onClick={() => posthog.capture("transfer_initiated")}
					>
						Wykonaj przelew
					</Button>
					<button
						type="button"
						className="mt-3 w-full text-center text-sm font-medium text-bank-green hover:underline"
						onClick={() => posthog.capture("transfer_history_viewed")}
					>
						Historia przelewów
					</button>
				</DashboardPanel>

				<DashboardPanel title="Wiadomości" showAllLink>
					<ul className="space-y-1">
						{messages.map((message) => (
							<li key={message.title}>
								<button
									type="button"
									className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60"
									onClick={() =>
										posthog.capture("dashboard_message_opened", {
											message_title: message.title,
										})
									}
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
										<Mail className="size-4 text-bank-green" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{message.title}
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

				<DashboardPanel title="Ostatnie operacje" showAllLink>
					{data.transactions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Brak transakcji do wyświetlenia.
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

				<DashboardPanel title="Moje podsumowanie">
					{data.summary ? (
						<>
							<dl className="space-y-4">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-sm text-muted-foreground">
										Dostępne środki
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
										Oszczędności
									</dt>
									<dd className="text-sm font-semibold">
										{formatMoney(data.summary.savings, data.summary.currency)}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-sm text-muted-foreground">
										Połączone rachunki
									</dt>
									<dd className="text-sm font-semibold">
										{data.accounts.length} aktywne
									</dd>
								</div>
							</dl>
							<Button
								variant="outline"
								className="mt-6 w-full border-bank-green text-bank-green hover:bg-bank-green hover:text-white"
							>
								Zobacz pełne podsumowanie
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							Połącz konto bankowe, aby zobaczyć podsumowanie.
						</p>
					)}
				</DashboardPanel>

				<DashboardPanel title="Na skróty">
					<ul className="space-y-1">
						{shortcuts.map((shortcut) => (
							<li key={shortcut.label}>
								<button
									type="button"
									className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60"
									onClick={() =>
										posthog.capture("dashboard_shortcut_clicked", {
											shortcut_label: shortcut.label,
										})
									}
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
										<shortcut.icon className="size-4 text-bank-green" />
									</div>
									<span className="flex-1 text-sm font-medium">
										{shortcut.label}
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
