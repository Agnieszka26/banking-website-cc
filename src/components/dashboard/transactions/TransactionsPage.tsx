import { usePostHog } from "@posthog/react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConnectBankAccount } from "#/components/dashboard/ConnectBankAccount";
import { TransactionListItem } from "#/components/dashboard/transactions/TransactionListItem";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import {
	type AmountSortOrder,
	type DateSortOrder,
	processTransactions,
	type TransactionListQuery,
	type TransactionTypeFilter,
	type TypeSortOrder,
} from "#/lib/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DashboardTransactionsPayload } from "#/server/plaid/types";

type TransactionsPageProps = {
	data: DashboardTransactionsPayload;
};

export function TransactionsPage({ data }: TransactionsPageProps) {
	const t = useTranslation();
	const localize = useLocalizedPath();
	const posthog = usePostHog();

	const [searchInput, setSearchInput] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
	const [dateSort, setDateSort] = useState<DateSortOrder>("desc");
	const [amountSort, setAmountSort] = useState<AmountSortOrder>("none");
	const [typeSort, setTypeSort] = useState<TypeSortOrder>("none");
	const [page, setPage] = useState(1);

	useEffect(() => {
		posthog.capture("transactions_page_viewed", {
			linked: data.linked,
			transaction_count: data.transactions.length,
		});
	}, [posthog, data.linked, data.transactions.length]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(searchInput);
			setPage(1);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [searchInput]);

	const query = useMemo<TransactionListQuery>(
		() => ({
			search: debouncedSearch,
			typeFilter,
			dateSort,
			amountSort,
			typeSort,
			page,
		}),
		[debouncedSearch, typeFilter, dateSort, amountSort, typeSort, page],
	);

	const processed = useMemo(
		() => processTransactions(data.transactions, query),
		[data.transactions, query],
	);

	useEffect(() => {
		if (page !== processed.page) {
			setPage(processed.page);
		}
	}, [page, processed.page]);

	const resetPage = () => setPage(1);

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<Link
				to={localize("/dashboard")}
				className="inline-flex items-center gap-1 text-sm font-medium text-bank-green hover:underline"
			>
				<ChevronLeft className="size-4" />
				{t("dashboard.transactions.backToDashboard")}
			</Link>

			<header>
				<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					{t("dashboard.transactions.title")}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("dashboard.transactions.description")}
				</p>
			</header>

			{!data.linked && <ConnectBankAccount />}

			<section className="rounded-xl border border-border bg-card shadow-sm">
				<div className="space-y-4 border-b border-border p-5">
					<div className="space-y-2">
						<Label htmlFor="transaction-search">
							{t("dashboard.transactions.search")}
						</Label>
						<div className="relative">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="transaction-search"
								type="search"
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder={t("dashboard.transactions.searchPlaceholder")}
								className="pl-8"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<div className="space-y-2">
							<Label htmlFor="transaction-type-filter">
								{t("dashboard.transactions.typeFilter")}
							</Label>
							<Select
								value={typeFilter}
								onValueChange={(value) => {
									setTypeFilter((value ?? "all") as TransactionTypeFilter);
									resetPage();
								}}
							>
								<SelectTrigger id="transaction-type-filter" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{t("dashboard.transactions.typeAll")}
									</SelectItem>
									<SelectItem value="income">
										{t("dashboard.transactions.typeIncome")}
									</SelectItem>
									<SelectItem value="outcome">
										{t("dashboard.transactions.typeOutcome")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="transaction-date-sort">
								{t("dashboard.transactions.dateSort")}
							</Label>
							<Select
								value={dateSort}
								onValueChange={(value) => {
									setDateSort((value ?? "desc") as DateSortOrder);
									resetPage();
								}}
							>
								<SelectTrigger id="transaction-date-sort" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="desc">
										{t("dashboard.transactions.dateNewest")}
									</SelectItem>
									<SelectItem value="asc">
										{t("dashboard.transactions.dateOldest")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="transaction-type-sort">
								{t("dashboard.transactions.typeSort")}
							</Label>
							<Select
								value={typeSort}
								onValueChange={(value) => {
									setTypeSort((value ?? "none") as TypeSortOrder);
									resetPage();
								}}
							>
								<SelectTrigger id="transaction-type-sort" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										{t("dashboard.transactions.sortDefault")}
									</SelectItem>
									<SelectItem value="income-first">
										{t("dashboard.transactions.typeIncomeFirst")}
									</SelectItem>
									<SelectItem value="outcome-first">
										{t("dashboard.transactions.typeOutcomeFirst")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="transaction-amount-sort">
								{t("dashboard.transactions.amountSort")}
							</Label>
							<Select
								value={amountSort}
								onValueChange={(value) => {
									setAmountSort((value ?? "none") as AmountSortOrder);
									resetPage();
								}}
							>
								<SelectTrigger id="transaction-amount-sort" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										{t("dashboard.transactions.sortDefault")}
									</SelectItem>
									<SelectItem value="desc">
										{t("dashboard.transactions.amountHighest")}
									</SelectItem>
									<SelectItem value="asc">
										{t("dashboard.transactions.amountLowest")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<div className="p-5">
					{!data.linked ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.transactions.connectToView")}
						</p>
					) : data.transactions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.empty.noTransactions")}
						</p>
					) : processed.total === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.transactions.noResults")}
						</p>
					) : (
						<>
							<p className="mb-4 text-sm text-muted-foreground">
								{t("dashboard.transactions.resultsCount", {
									count: processed.total,
								})}
							</p>
							<ul className="space-y-1">
								{processed.items.map((transaction) => (
									<TransactionListItem
										key={transaction.id}
										transaction={transaction}
									/>
								))}
							</ul>

							{processed.totalPages > 1 && (
								<div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
									<p className="text-sm text-muted-foreground">
										{t("dashboard.transactions.pageInfo", {
											page: processed.page,
											totalPages: processed.totalPages,
										})}
									</p>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={processed.page <= 1}
											onClick={() => setPage((current) => current - 1)}
										>
											{t("dashboard.transactions.previous")}
										</Button>
										<Button
											variant="outline"
											size="sm"
											disabled={processed.page >= processed.totalPages}
											onClick={() => setPage((current) => current + 1)}
										>
											{t("dashboard.transactions.next")}
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
