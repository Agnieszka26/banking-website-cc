import { UserButton } from "@clerk/tanstack-react-start";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	CreditCard,
	FileText,
	HandCoins,
	Landmark,
	LayoutDashboard,
	Mail,
	Phone,
	PiggyBank,
	Settings,
	Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{
	label: string;
	to: string;
	icon: typeof LayoutDashboard;
	exact?: boolean;
}> = [
	{ label: "Pulpit", to: "/dashboard", icon: LayoutDashboard, exact: true },
	{ label: "Rachunki", to: "/dashboard/accounts", icon: Wallet },
	{ label: "Przelewy", to: "/dashboard/payments", icon: Landmark },
	{ label: "Karty", to: "/dashboard/cards", icon: CreditCard },
	{ label: "Lokaty", to: "/dashboard/deposits", icon: PiggyBank },
	{ label: "Kredyty", to: "/dashboard/loans", icon: HandCoins },
	{ label: "Wnioski i dyspozycje", to: "/dashboard/applications", icon: FileText },
	{ label: "Ustawienia", to: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card lg:w-60">
			<nav className="flex flex-1 flex-col gap-1 p-4">
				{navItems.map(({ label, to, icon: Icon, exact }) => {
					const isActive = exact
						? pathname === to || pathname === `${to}/`
						: pathname.startsWith(to);

					return (
						<Link
							key={label}
							to={to}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
								isActive
									? "bg-bank-green text-white"
									: "text-foreground hover:bg-bank-green-light",
							)}
						>
							<Icon
								className={cn(
									"size-5 shrink-0",
									isActive ? "text-white" : "text-bank-green",
								)}
							/>
							<span className="leading-tight">{label}</span>
						</Link>
					);
				})}
			</nav>

			<div className="px-4 pb-2">
				<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
					<UserButton />
					<span className="text-sm font-medium text-foreground">Moje konto</span>
				</div>
			</div>

			<div className="m-4 mt-auto rounded-xl border border-border bg-muted/40 p-4">
				<p className="text-sm font-semibold text-foreground">
					Potrzebujesz pomocy?
				</p>
				<a
					href="tel:801000000"
					className="mt-3 flex items-center gap-2 text-sm font-medium text-bank-green hover:underline"
				>
					<Phone className="size-4 shrink-0" />
					801 000 000
				</a>
				<a
					href="mailto:kontakt@bank.pl"
					className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-bank-green hover:underline"
				>
					<Mail className="size-4 shrink-0" />
					Napisz do nas
				</a>
			</div>
		</aside>
	);
}
