import { usePostHog } from "@posthog/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signUp } from "#/lib/auth-client";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";

/** Shared sign-up state, submit handler, and post-registration redirect. */
export function useSignUp() {
	const navigate = useNavigate();
	const router = useRouter();
	const posthog = usePostHog();
	const t = useTranslation();
	const localize = useLocalizedPath();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const normalizedUsername = username.trim().toLowerCase();
			const fullName =
				[firstName, lastName]
					.map((part) => part.trim())
					.filter(Boolean)
					.join(" ") || normalizedUsername;

			const { error: signUpError } = await signUp.email({
				email: `${normalizedUsername}@example.com`,
				password,
				name: fullName,
				username: normalizedUsername,
			});

			if (signUpError) {
				setError(signUpError.message ?? t("errors.signUpFailed"));
				return;
			}

			posthog.capture("user_signed_up");
			posthog.identify(normalizedUsername, {
				username: normalizedUsername,
				firstName,
				lastName,
			});

			await router.invalidate();
			await navigate({ to: localize("/dashboard") });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : t("errors.signUpFailed"),
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
		firstName,
		setFirstName,
		lastName,
		setLastName,
		error,
		isSubmitting,
		handleSubmit,
	};
}
