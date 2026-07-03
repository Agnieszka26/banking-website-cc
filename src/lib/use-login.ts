import { usePostHog } from "@posthog/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginWithIdentifier } from "#/lib/auth-client";
import { getSafeRedirectTarget } from "#/lib/auth-guard";

export type LoginSource = "home" | "sign-in";

type UseLoginOptions = {
	redirectTo?: string;
	source: LoginSource;
};

/** Shared sign-in state, submit handler, and post-login redirect. */
export function useLogin({ redirectTo, source }: UseLoginOptions) {
	const navigate = useNavigate();
	const posthog = usePostHog();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const { error: signInError } = await loginWithIdentifier({
				identifier: username,
				password,
			});

			if (signInError) {
				setError(signInError.message ?? "Logowanie nie powiodło się");
				return;
			}

			posthog.capture("user_logged_in", { source });
			posthog.identify(username, { username });

			const { pathname, search, hash } = getSafeRedirectTarget(redirectTo);
			await navigate({
				to: pathname,
				search,
				...(hash ? { hash } : {}),
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Logowanie nie powiodło się",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		username,
		setUsername,
		password,
		setPassword,
		error,
		isSubmitting,
		handleSubmit,
	};
}
