import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardSecurityBanner() {
	return (
		<div className="border-t border-bank-green/15 bg-bank-green-light px-6 py-4 lg:px-8">
			<div className="mx-auto flex max-w-7xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3 sm:items-center">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bank-green/10">
						<Shield className="size-5 text-bank-green" />
					</div>
					<p className="text-sm leading-relaxed text-foreground sm:text-base">
						<span className="font-semibold">
							Bezpieczeństwo jest dla nas najważniejsze.
						</span>{" "}
						Nigdy nie podawaj danych logowania przez telefon ani e-mail.
						Zawsze sprawdzaj adres strony banku.
					</p>
				</div>
				<Link
					to="/"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"shrink-0 border-bank-green text-bank-green hover:bg-bank-green hover:text-white",
					)}
				>
					Dowiedz się więcej
				</Link>
			</div>
		</div>
	);
}
