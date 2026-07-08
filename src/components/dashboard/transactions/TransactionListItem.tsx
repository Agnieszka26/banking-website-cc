import type { LucideIcon } from "lucide-react";
import { Building2, ShoppingCart } from "lucide-react";
import type { DashboardTransaction } from "#/server/plaid";
import { formatMoney, formatPlDate } from "#/server/plaid";
import { getTransactionFlow } from "#/lib/transactions";
import { cn } from "@/lib/utils";

function getTransactionIcon(isIncome: boolean): LucideIcon {
	return isIncome ? Building2 : ShoppingCart;
}

type TransactionListItemProps = {
	transaction: DashboardTransaction;
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
	const isIncome = getTransactionFlow(transaction.amount) === "income";
	const Icon = getTransactionIcon(isIncome);

	return (
		<li>
			<div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60">
				<div className="w-16 shrink-0 text-xs text-muted-foreground sm:w-20">
					{formatPlDate(transaction.date)}
				</div>
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bank-green-light">
					<Icon className="size-4 text-bank-green" />
				</div>
				<p className="min-w-0 flex-1 truncate text-sm font-medium">
					{transaction.name}
				</p>
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
