import type { TransferAccountOption } from "#/components/dashboard/transfers/types";
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
	accounts: TransferAccountOption[];
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
};

function formatAccountOption(account: TransferAccountOption): string {
	const major = (account.balanceMinor / 100).toFixed(2);
	return `${account.name} • ${major} ${account.currency}`;
}

export function AccountSelectField({
	id,
	label,
	value,
	placeholder,
	accounts,
	onChange,
	error,
	disabled = false,
}: AccountSelectFieldProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Select
				value={value || null}
				onValueChange={(next) => onChange(next ?? "")}
				disabled={disabled}
			>
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
