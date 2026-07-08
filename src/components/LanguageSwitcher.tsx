import { useLocation, useNavigate } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getLocaleLabel,
	LOCALE_OPTIONS,
	switchLocaleInPathname,
	useLocale,
	useTranslation,
	writeLocaleCookie,
	type Locale,
} from "#/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
	compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
	const t = useTranslation();
	const locale = useLocale();
	const navigate = useNavigate();
	const { pathname, search, hash } = useLocation();

	const handleChange = (nextLocale: string | null) => {
		if (!nextLocale) {
			return;
		}

		const targetLocale = nextLocale as Locale;
		writeLocaleCookie(targetLocale);

		const nextPath = switchLocaleInPathname(pathname, targetLocale);
		void navigate({
			to: nextPath,
			search,
			hash,
			replace: true,
		});
	};

	return (
		<Select value={locale} onValueChange={handleChange}>
			<SelectTrigger
				className={cn(compact && "w-full")}
				aria-label={t("language.label")}
			>
				<SelectValue>
					<div className="flex items-center gap-2">
						<Globe className="size-4 shrink-0 text-bank-green" aria-hidden />
						<span className="truncate">
							{compact ? (
								getLocaleLabel(locale)
							) : (
								<>
									<span className="hidden xl:inline">
										{getLocaleLabel(locale)}
									</span>
									<span className="xl:hidden">{t("language.short")}</span>
								</>
							)}
						</span>
					</div>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{LOCALE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
