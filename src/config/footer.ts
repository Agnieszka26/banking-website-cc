import type { LucideIcon } from "lucide-react";
import { Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { contactEmail, contactPhone, contactPhoneHref } from "#/config/contact";

export const companyName = "Bank";
export const companyTagline =
	"Nowoczesne bankowości online — bezpiecznie, przejrzyście i zawsze pod ręką.";

export type FooterNavLink = {
	label: string;
	to: string;
};

export const resourceLinks: FooterNavLink[] = [
	{ label: "Bezpieczeństwo", to: "/" },
	{ label: "Regulaminy", to: "/" },
	{ label: "Polityka prywatności", to: "/" },
	{ label: "Deklaracja dostępności", to: "/" },
	{ label: "Aktualności", to: "/news" },
];

export type FooterContactItem = {
	id: string;
	label: string;
	value: string;
	href: string;
	icon: LucideIcon;
};

export const contactAddress =
	import.meta.env.VITE_CONTACT_ADDRESS ??
	"ul. Finansowa 12, 00-001 Warszawa, Polska";

export const contactItems: FooterContactItem[] = [
	{
		id: "email",
		label: "E-mail",
		value: contactEmail,
		href: `mailto:${contactEmail}`,
		icon: Mail,
	},
	{
		id: "phone",
		label: "Telefon",
		value: contactPhone,
		href: contactPhoneHref(),
		icon: Phone,
	},
	{
		id: "address",
		label: "Adres",
		value: contactAddress,
		href: `https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`,
		icon: MapPin,
	},
];

export type FooterSocialLink = {
	label: string;
	href: string;
	icon: LucideIcon;
};

export const socialLinks: FooterSocialLink[] = [
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com",
		icon: Linkedin,
	},
];
