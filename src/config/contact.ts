const DEFAULT_CONTACT_PHONE = "801 000 000";
const DEFAULT_CONTACT_EMAIL = "kontakt@bank.pl";

export const contactPhone =
	import.meta.env.VITE_CONTACT_PHONE ?? DEFAULT_CONTACT_PHONE;

export const contactEmail =
	import.meta.env.VITE_CONTACT_EMAIL ?? DEFAULT_CONTACT_EMAIL;

export function contactPhoneHref(phone = contactPhone): string {
	return `tel:${phone.replace(/\s/g, "")}`;
}
