import { Globe, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import logo from "../../public/assets/logo.png";
import { Button } from "./ui/button";

import { ButtonGroup } from "./ui/button-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

const NavbarLogo = () => {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink>
				<img src={logo} alt="Logo" className="w-20 h-20" />
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
};

const HighContrastToggle = () => {
	return (
		<NavigationMenuItem>
			<div className="flex items-center space-x-2">
				<Switch id="high-contrast" />
				<Label htmlFor="high-contrast">Wysoki kontrast</Label>
			</div>
		</NavigationMenuItem>
	);
};
const Placeholder = () => {
	return (
		<div className="flex items-center gap-2">
			<Globe className="text-green-800" />
			<p>Wybierz język</p>
		</div>
	);
};
const LanguageSelect = () => {
	return (
		<NavigationMenuItem>
			<Select>
				<SelectTrigger>
					<SelectValue placeholder={<Placeholder />} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem>Polski</SelectItem>
					<SelectItem>Angielski</SelectItem>
					<SelectItem>Niemiecki</SelectItem>
					<SelectItem>Hiszpański</SelectItem>
					<SelectItem>Francuski</SelectItem>
					<SelectItem>Włoski</SelectItem>
				</SelectContent>
			</Select>
		</NavigationMenuItem>
	);
};

const InfoLine = () => {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink>
				{" "}
				<Phone className="text-green-800" /> Infolinia: 800 000 000
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
};

const BiggerSmallerFont = () => {
	return (
		<NavigationMenuItem className="flex items-center gap-2">
			<ButtonGroup>
				<Button variant="outline">
					<p className="text-md">A-</p>
				</Button>
				<Button variant="outline">
					<p className="text-xl">A+</p>
				</Button>
			</ButtonGroup>
		</NavigationMenuItem>
	);
};

export const Navbar = () => {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<div className="flex items-center justify-between">
					<NavbarLogo />
					<div className="flex items-center gap-2">
						<BiggerSmallerFont />
						<HighContrastToggle />
						<InfoLine />
						<LanguageSelect />
					</div>
				</div>
			</NavigationMenuList>
		</NavigationMenu>
	);
};
