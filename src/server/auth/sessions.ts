import "@tanstack/react-start/server-only";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";

const SESSION_COOKIE = "bank_session";
const sessions = new Map<string, { userId: string }>();

export function getSessionUserId(): string | null {
	const sessionId = getCookie(SESSION_COOKIE);
	if (!sessionId) return null;

	return sessions.get(sessionId)?.userId ?? null;
}

export function createSession(userId: string): void {
	const sessionId = crypto.randomUUID();
	sessions.set(sessionId, { userId });
	setCookie(SESSION_COOKIE, sessionId, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 7,
	});
}

export function destroySession(): void {
	const sessionId = getCookie(SESSION_COOKIE);
	if (sessionId) {
		sessions.delete(sessionId);
	}
	deleteCookie(SESSION_COOKIE, { path: "/" });
}
