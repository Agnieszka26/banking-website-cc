import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { useFontScale } from "#/components/FontScaleProvider";
import { LanguageSwitcher } from "#/components/LanguageSwitcher";
import { Label } from "@/components/ui/label";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import { cn } from "@/lib/utils";
import logo from "../../public/assets/logo.png";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

const NavbarLogo = () => {
	const localize = useLocalizedPath();
	const t = useTranslation();

	return (
		<Link to={localize("/")} className="shrink-0 p-0">
			<img
				src={logo}
				alt={t("navigation.home")}
				className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
			/>
		</Link>
	);
};

const BiggerSmallerFont = ({ compact = false }: { compact?: boolean }) => {
	const { decrease, increase, canDecrease, canIncrease } = useFontScale();
	const t = useTranslation();

	return (
		<div
			className={cn(
				"flex items-center gap-2",
				compact && "w-full justify-between",
			)}
		>
			{compact && (
				<span className="text-sm font-medium text-muted-foreground">
					{t("accessibility.fontSize")}
				</span>
			)}
			<ButtonGroup>
				<Button
					type="button"
					variant="outline"
					size={compact ? "sm" : "default"}
					aria-label={t("accessibility.decreaseFont")}
					disabled={!canDecrease}
					onClick={() => {
						decrease();
					}}
				>
					A-
				</Button>
				<Button
					type="button"
					variant="outline"
					size={compact ? "sm" : "default"}
					aria-label={t("accessibility.increaseFont")}
					disabled={!canIncrease}
					onClick={() => {
						increase();
					}}
				>
					A+
				</Button>
			</ButtonGroup>
		</div>
	);
};

const HighContrastToggle = ({ compact = false }: { compact?: boolean }) => {
	const t = useTranslation();

	return (
		<div
			className={cn(
				"flex items-center gap-2 sm:gap-3",
				compact && "w-full justify-between",
			)}
		>
			<div className="flex items-center gap-2 sm:gap-3">
				<Switch id={compact ? "high-contrast-mobile" : "high-contrast"} />
				<Label
					htmlFor={compact ? "high-contrast-mobile" : "high-contrast"}
					className="text-sm sm:text-base cursor-pointer"
				>
					{t("accessibility.highContrast")}
				</Label>
			</div>
		</div>
	);
};

const InfoLine = ({
	compact = false,
	iconOnly = false,
}: {
	compact?: boolean;
	iconOnly?: boolean;
}) => {
	const t = useTranslation();

	return (
		<a
			href="tel:800000000"
			className={cn(
				"flex items-center gap-2 text-sm sm:text-base text-foreground hover:text-green-800 transition-colors",
				compact && "w-full py-1",
				iconOnly && "p-2 rounded-lg hover:bg-muted",
			)}
		>
			<Phone className="text-green-800 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
			{!iconOnly && (
				<span className={cn(compact ? "inline" : "hidden xl:inline")}>
					{t("navigation.helpline", { phone: "800 000 000" })}
				</span>
			)}
			{!compact && !iconOnly && (
				<span className="xl:hidden font-medium">800 000 000</span>
			)}
		</a>
	);
};

function NavbarControls({ layout }: { layout: "desktop" | "mobile" }) {
	const compact = layout === "mobile";

	if (compact) {
		return (
			<div className="flex flex-col gap-4 sm:gap-5">
				<InfoLine compact />
				<Separator />
				<BiggerSmallerFont compact />
				<HighContrastToggle compact />
				<LanguageSwitcher compact />
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3 xl:gap-4 flex-wrap justify-end">
			<BiggerSmallerFont />
			<div className="hidden md:block">
				<HighContrastToggle />
			</div>
			<InfoLine />
			<LanguageSwitcher />
		</div>
	);
}

export const Navbar = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const t = useTranslation();

	return (
		<nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm shadow-sm">
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-0">
					<div className="flex items-center justify-between gap-3 sm:gap-4 min-h-16 sm:min-h-18 lg:min-h-24 py-2 sm:py-3">
						<NavbarLogo />

						<div className="hidden lg:flex items-center gap-3 xl:gap-4 flex-wrap justify-end">
							<NavbarControls layout="desktop" />
						</div>

						<div className="flex lg:hidden items-center gap-1 sm:gap-2 shrink-0">
							<InfoLine iconOnly />
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="shrink-0"
								aria-label={
									mobileOpen
										? t("accessibility.closeMenu")
										: t("accessibility.openMenu")
								}
								aria-expanded={mobileOpen}
								onClick={() => setMobileOpen((open) => !open)}
							>
								{mobileOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</Button>
						</div>
					</div>

					{mobileOpen && (
						<div className="lg:hidden border-t border-border py-4 sm:py-5 pb-5 sm:pb-6">
							<NavbarControls layout="mobile" />
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};
