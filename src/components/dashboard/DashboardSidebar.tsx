import { usePostHog } from "@posthog/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	CreditCard,
	FileText,
	HandCoins,
	Landmark,
	LayoutDashboard,
	LogOut,
	Mail,
	Phone,
	PiggyBank,
	Settings,
	User,
	Wallet,
} from "lucide-react";
import {
	contactEmail,
	contactPhone,
	contactPhoneHref,
} from "#/config/contact";
import { signOut } from "#/lib/auth-client";
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

type DashboardSidebarProps = {
	userName: string;
};

export function DashboardSidebar({ userName }: DashboardSidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const posthog = usePostHog();

	const handleSignOut = async () => {
		await signOut();
		posthog.reset();
		await navigate({ to: "/" });
	};

	const initials = userName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");

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
					<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bank-green text-xs font-semibold text-white">
						{initials || <User className="size-4" />}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-foreground">
							{userName}
						</p>
						<button
							type="button"
							onClick={handleSignOut}
							className="flex items-center gap-1 text-xs text-muted-foreground hover:text-bank-green"
						>
							<LogOut className="size-3" />
							Wyloguj
						</button>
					</div>
				</div>
			</div>

			<div className="m-4 mt-auto rounded-xl border border-border bg-muted/40 p-4">
				<p className="text-sm font-semibold text-foreground">
					Potrzebujesz pomocy?
				</p>
				<a
					href={contactPhoneHref()}
					className="mt-3 flex items-center gap-2 text-sm font-medium text-bank-green hover:underline"
				>
					<Phone className="size-4 shrink-0" />
					{contactPhone}
				</a>
				<a
					href={`mailto:${contactEmail}`}
					className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-bank-green hover:underline"
				>
					<Mail className="size-4 shrink-0" />
					Napisz do nas
				</a>
			</div>
		</aside>
	);
}
