import type { LucideIcon } from "lucide-react";
import { Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { contactEmail, contactPhone, contactPhoneHref } from "#/config/contact";

export const companyName = "Bank";

export type FooterNavLink = {
	labelKey: string;
	to: string;
};

export const resourceLinks: FooterNavLink[] = [
	{ labelKey: "footer.security", to: "/" },
	{ labelKey: "footer.terms", to: "/" },
	{ labelKey: "footer.privacy", to: "/" },
	{ labelKey: "footer.accessibilityStatement", to: "/" },
	{ labelKey: "navigation.news", to: "/news" },
];

export type FooterContactItem = {
	id: string;
	labelKey: string;
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
		labelKey: "footer.email",
		value: contactEmail,
		href: `mailto:${contactEmail}`,
		icon: Mail,
	},
	{
		id: "phone",
		labelKey: "footer.phone",
		value: contactPhone,
		href: contactPhoneHref(),
		icon: Phone,
	},
	{
		id: "address",
		labelKey: "footer.address",
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
