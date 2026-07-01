import { usePostHog } from "@posthog/react";
import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "#/components/AuthLayout";
import { getSafeRedirectPath } from "#/lib/auth-guard";
import { loginWithIdentifier } from "#/lib/auth-client";

export const Route = createFileRoute("/sign-in/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const location = useLocation();
	const redirectTo =
		typeof (location.search as Record<string, unknown>).redirect === "string"
			? ((location.search as Record<string, unknown>).redirect as string)
			: undefined;	const posthog = usePostHog();
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

			posthog.capture("user_logged_in");
			posthog.identify(username, { username });
			await navigate({ to: getSafeRedirectPath(redirectTo) });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Logowanie nie powiodło się",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthLayout id="sign-in">
			<div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
				<h1 className="mb-6 text-xl font-bold text-green-800">Logowanie</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="sign-in-username" className="mb-2 block text-sm">
							Identyfikator
						</label>
						<input
							id="sign-in-username"
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							className="w-full rounded-md border border-gray-300 p-2"
							autoComplete="username"
							required
						/>
					</div>
					<div>
						<label htmlFor="sign-in-password" className="mb-2 block text-sm">
							Hasło
						</label>
						<input
							id="sign-in-password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="w-full rounded-md border border-gray-300 p-2"
							autoComplete="current-password"
							required
						/>
					</div>
					{error && (
						<p className="text-sm text-red-600" role="alert">
							{error}
						</p>
					)}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-md bg-green-800 p-2.5 font-medium text-white hover:bg-green-900 disabled:opacity-60"
					>
						{isSubmitting ? "Logowanie..." : "Zaloguj się"}
					</button>
				</form>
				<p className="mt-4 text-center text-sm text-muted-foreground">
					Nie masz konta?{" "}
					<Link to="/sign-up/$" className="text-green-800 hover:underline">
						Zarejestruj się
					</Link>
				</p>
			</div>
		</AuthLayout>
	);
}
