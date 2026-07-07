import { usePostHog } from "@posthog/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, loginWithIdentifier } from "#/lib/auth-client";
import { getSafeRedirectTarget } from "#/lib/auth-guard";
import { useTranslation } from "#/lib/i18n";

export type LoginSource = "home" | "sign-in";

type UseLoginOptions = {
	redirectTo?: string;
	source: LoginSource;
};

/** Shared sign-in state, submit handler, and post-login redirect. */
export function useLogin({ redirectTo, source }: UseLoginOptions) {
	const navigate = useNavigate();
	const posthog = usePostHog();
	const t = useTranslation();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const { data, error: signInError } = await loginWithIdentifier({
				identifier: username,
				password,
			});

			if (signInError) {
				setError(signInError.message ?? t("errors.loginFailed"));
				return;
			}

			posthog.capture("user_logged_in", { source });

			const session = await authClient.getSession();
			const userId = data?.user?.id ?? session.data?.user?.id;
			if (userId) {
				posthog.identify(userId, { source });
			}

			const { pathname, search, hash } = getSafeRedirectTarget(redirectTo);
			await navigate({
				to: pathname,
				search,
				...(hash ? { hash } : {}),
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : t("errors.loginFailed"),
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
