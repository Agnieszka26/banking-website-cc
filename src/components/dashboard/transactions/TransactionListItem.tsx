import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight, Building2, ShoppingCart } from "lucide-react";
import { useTranslation } from "#/lib/i18n";
import type { TransactionListItemViewModel } from "#/lib/transaction-list-model";
import { getTransactionFlow } from "#/lib/transactions";
import { formatMoney, formatPlDate } from "#/server/plaid";
import { cn } from "@/lib/utils";

function getTransactionIcon(
	isIncome: boolean,
	isTransfer: boolean,
): LucideIcon {
	if (isTransfer) {
		return ArrowLeftRight;
	}
	return isIncome ? Building2 : ShoppingCart;
}

type TransactionListItemProps = {
	transaction: TransactionListItemViewModel;
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
	const t = useTranslation();
	const isIncome = getTransactionFlow(transaction.amount) === "income";
	const Icon = getTransactionIcon(isIncome, transaction.isTransfer);

	return (
		<li>
			<div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
				<div className="w-16 shrink-0 text-xs text-muted-foreground sm:w-20">
					{formatPlDate(transaction.date)}
				</div>
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
					<Icon className="size-4 text-bank-green" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{transaction.name}</p>
					{transaction.isTransfer && (
						<p className="truncate text-xs text-muted-foreground">
							{t("dashboard.transactions.transferLabel")}
						</p>
					)}
				</div>
				<span
					className={cn(
						"shrink-0 text-sm font-semibold",
						isIncome ? "text-bank-green" : "text-foreground",
					)}
				>
					{isIncome ? "+" : "-"}
					{formatMoney(Math.abs(transaction.amount), transaction.currency)}
				</span>
			</div>
		</li>
	);
}
