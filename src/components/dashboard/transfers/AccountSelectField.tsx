import type { DashboardAccount } from "#/server/plaid";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AccountSelectFieldProps = {
	id: string;
	label: string;
	value: string;
	placeholder: string;
	accounts: DashboardAccount[];
	onChange: (value: string) => void;
	error?: string;
};

function formatAccountOption(account: DashboardAccount): string {
	return `${account.name} • **** ${account.mask}`;
}

export function AccountSelectField({
	id,
	label,
	value,
	placeholder,
	accounts,
	onChange,
	error,
}: AccountSelectFieldProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value || null} onValueChange={(next) => onChange(next ?? "")}>
				<SelectTrigger
					id={id}
					className={cn("w-full", error && "border-destructive")}
					aria-invalid={Boolean(error)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{accounts.map((account) => (
						<SelectItem key={account.id} value={account.id}>
							{formatAccountOption(account)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
