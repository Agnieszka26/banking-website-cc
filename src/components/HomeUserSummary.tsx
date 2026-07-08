import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { buttonVariants } from "#/components/ui/button";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import type { AuthenticatedUser } from "#/lib/session-user";
import { cn } from "@/lib/utils";

type HomeUserSummaryProps = {
	user: AuthenticatedUser;
};

export function HomeUserSummary({ user }: HomeUserSummaryProps) {
	const t = useTranslation();
	const localize = useLocalizedPath();

	return (
		<div className="w-full lg:w-80 xl:w-96 shrink-0 rounded-lg border border-gray-200 bg-card p-5 shadow-sm sm:p-6">
			<div className="mb-4 flex items-center gap-3 sm:mb-5">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bank-green text-sm font-semibold text-white">
					{user.name.charAt(0).toUpperCase() || (
						<User className="size-5" aria-hidden />
					)}
				</div>
				<div className="min-w-0">
					<h1 className="truncate text-lg font-bold text-green-800 sm:text-xl">
						{t("greetings.welcomeBack", { name: user.name })}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("greetings.signedInLead")}
					</p>
				</div>
			</div>

			<dl className="space-y-3 text-sm">
				<div>
					<dt className="font-medium text-muted-foreground">
						{t("home.signedInAs")}
					</dt>
					<dd className="mt-0.5 truncate text-foreground">{user.name}</dd>
				</div>
				<div>
					<dt className="font-medium text-muted-foreground">
						{t("home.email")}
					</dt>
					<dd className="mt-0.5 truncate text-foreground">{user.email}</dd>
				</div>
			</dl>

			<Link
				to={localize("/dashboard")}
				className={cn(
					buttonVariants({ variant: "default" }),
					"mt-5 w-full bg-green-800 text-white hover:bg-green-900",
				)}
			>
				{t("home.openDashboard")}
			</Link>
		</div>
	);
}
