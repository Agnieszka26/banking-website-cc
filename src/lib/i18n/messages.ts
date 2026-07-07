import type en from "../../../locales/en.json";
import enMessages from "../../../locales/en.json";
import frMessages from "../../../locales/fr.json";
import plMessages from "../../../locales/pl.json";
import type { Locale } from "#/lib/i18n/locales";

export type Messages = typeof en;

const catalogs: Record<Locale, Messages> = {
	en: enMessages,
	pl: plMessages,
	fr: frMessages,
};

export function getMessages(locale: Locale): Messages {
	return catalogs[locale];
}

type InterpolationValues = Record<string, string | number>;

/** Resolves dot-separated keys and replaces `{{name}}` placeholders. */
export function translate(
	messages: Messages,
	key: string,
	values?: InterpolationValues,
): string {
	const parts = key.split(".");
	let current: unknown = messages;

	for (const part of parts) {
		if (current === null || typeof current !== "object") {
			return key;
		}
		current = (current as Record<string, unknown>)[part];
	}

	if (typeof current !== "string") {
		return key;
	}

	if (!values) {
		return current;
	}

	return current.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
		const value = values[token];
		return value === undefined ? `{{${token}}}` : String(value);
	});
}
