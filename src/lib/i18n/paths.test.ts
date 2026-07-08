/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import { LOCALE_COOKIE } from "#/lib/i18n/locales";
import {
	buildLocalizedPathname,
	localizeRedirectTarget,
	resolveAppLocale,
	stripLocaleFromPathname,
} from "#/lib/i18n/paths";

describe("resolveAppLocale", () => {
	beforeEach(() => {
		document.cookie = `${LOCALE_COOKIE}=;path=/;max-age=0`;
	});

	it("prefers the locale encoded in the pathname", () => {
		expect(resolveAppLocale("/fr/dashboard")).toBe("fr");
	});

	it("falls back to the locale cookie when the path has no prefix", () => {
		document.cookie = `${LOCALE_COOKIE}=en;path=/`;
		expect(resolveAppLocale("/dashboard")).toBe("en");
	});

	it("uses the default locale when neither path nor cookie provide one", () => {
		expect(resolveAppLocale("/dashboard")).toBe("pl");
	});
});

describe("localizeRedirectTarget", () => {
	it("prefixes the post-login fallback dashboard path", () => {
		expect(
			localizeRedirectTarget({ pathname: "/dashboard", search: {} }, "en"),
		).toEqual({
			pathname: "/en/dashboard",
			search: {},
		});
	});

	it("normalizes already-localized redirect paths", () => {
		expect(
			localizeRedirectTarget(
				{ pathname: "/pl/settings", search: { tab: "1" }, hash: "profile" },
				"fr",
			),
		).toEqual({
			pathname: "/fr/settings",
			search: { tab: "1" },
			hash: "profile",
		});
	});
});

describe("buildLocalizedPathname", () => {
	it("preserves nested paths after login", () => {
		expect(buildLocalizedPathname("en", "/dashboard/accounts/abc")).toBe(
			"/en/dashboard/accounts/abc",
		);
	});
});

describe("dashboard navigation paths", () => {
	it("localizes profile sub-routes for sidebar links", () => {
		expect(buildLocalizedPathname("fr", "/dashboard/settings")).toBe(
			"/fr/dashboard/settings",
		);
	});

	it("matches active state against locale-stripped paths", () => {
		expect(stripLocaleFromPathname("/en/dashboard/settings")).toBe(
			"/dashboard/settings",
		);
	});
});
