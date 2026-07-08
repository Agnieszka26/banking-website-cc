import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { authenticateRouteUser } from "#/lib/auth-guard";
import {
	getSafeRedirectPath,
	getSafeRedirectTarget,
} from "#/lib/redirect-safety";

describe("getSafeRedirectTarget (SSR)", () => {
	it("returns fallback when redirect is missing", () => {
		expect(getSafeRedirectTarget(undefined)).toEqual({
			pathname: "/dashboard",
			search: {},
		});
	});

	it("parses an internal path with query and hash", () => {
		expect(getSafeRedirectTarget("/settings?tab=1#profile")).toEqual({
			pathname: "/settings",
			search: { tab: "1" },
			hash: "profile",
		});
	});

	it("rejects protocol-relative paths", () => {
		expect(getSafeRedirectTarget("//evil.example/path")).toEqual({
			pathname: "/dashboard",
			search: {},
		});
	});

	it("rejects paths containing backslashes", () => {
		expect(getSafeRedirectTarget("/\\evil.example")).toEqual({
			pathname: "/dashboard",
			search: {},
		});
	});

	it("rejects javascript: and data: URI schemes", () => {
		expect(getSafeRedirectTarget("javascript:alert(1)")).toEqual({
			pathname: "/dashboard",
			search: {},
		});
		expect(
			getSafeRedirectTarget("data:text/html,<script>alert(1)</script>"),
		).toEqual({
			pathname: "/dashboard",
			search: {},
		});
	});
});

/**
 * @vitest-environment jsdom
 */
describe("getSafeRedirectTarget (client)", () => {
	it("normalizes same-origin absolute URLs", () => {
		const target = getSafeRedirectTarget(
			`${window.location.origin}/dashboard/accounts?id=1#top`,
		);

		expect(target).toEqual({
			pathname: "/dashboard/accounts",
			search: { id: "1" },
			hash: "top",
		});
	});

	it("rejects external origins", () => {
		expect(getSafeRedirectTarget("https://evil.example/steal")).toEqual({
			pathname: "/dashboard",
			search: {},
		});
	});
});

describe("getSafeRedirectPath", () => {
	it("serializes pathname, search, and hash", () => {
		expect(getSafeRedirectPath("/reports?month=3#summary")).toBe(
			"/reports?month=3#summary",
		);
	});
});

describe("authenticateRouteUser", () => {
	it("returns the authenticated user when a session exists", () => {
		const user = authenticateRouteUser(
			{
				user: {
					id: "user-1",
					name: "Jane Doe",
					email: "jane@example.com",
				},
			},
			{
				href: "http://localhost/en/dashboard/settings",
				pathname: "/en/dashboard/settings",
			},
		);

		expect(user).toEqual({
			id: "user-1",
			name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("redirects unauthenticated users to the localized sign-in route", () => {
		try {
			authenticateRouteUser(null, {
				href: "http://localhost/fr/dashboard/settings",
				pathname: "/fr/dashboard/settings",
			});
			expect.unreachable("Expected authenticateRouteUser to redirect");
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			expect(error).toMatchObject({
				options: {
					to: "/$locale/sign-in/$",
					params: { locale: "fr" },
					search: {
						redirect: "http://localhost/fr/dashboard/settings",
					},
				},
			});
		}
	});
});
