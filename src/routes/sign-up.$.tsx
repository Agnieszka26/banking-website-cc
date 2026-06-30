import { usePostHog } from "@posthog/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "#/components/AuthLayout";
import { signUp } from "#/lib/auth-client";

export const Route = createFileRoute("/sign-up/$")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const posthog = usePostHog();
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
				[firstName, lastName].map((part) => part.trim()).filter(Boolean).join(" ") ||
				normalizedUsername;

			const { error: signUpError } = await signUp.email({
				email: `${normalizedUsername}@example.com`,
				password,
				name: fullName,
				username: normalizedUsername,
			});

			if (signUpError) {
				setError(signUpError.message ?? "Rejestracja nie powiodła się");
				return;
			}

			posthog.capture("user_signed_up");
			posthog.identify(username, { username, firstName, lastName });
			await navigate({ to: "/dashboard" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Rejestracja nie powiodła się",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthLayout id="sign-up">
			<div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
				<h1 className="mb-6 text-xl font-bold text-green-800">Rejestracja</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="sign-up-username" className="mb-2 block text-sm">
							Identyfikator
						</label>
						<input
							id="sign-up-username"
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							className="w-full rounded-md border border-gray-300 p-2"
							autoComplete="username"
							required
						/>
					</div>
					<div>
						<label htmlFor="sign-up-password" className="mb-2 block text-sm">
							Hasło
						</label>
						<input
							id="sign-up-password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="w-full rounded-md border border-gray-300 p-2"
							autoComplete="new-password"
							minLength={8}
							required
						/>
						<p className="mt-1 text-xs text-muted-foreground">
							Minimum 8 znaków
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="sign-up-first-name" className="mb-2 block text-sm">
								Imię
							</label>
							<input
								id="sign-up-first-name"
								type="text"
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								className="w-full rounded-md border border-gray-300 p-2"
								autoComplete="given-name"
							/>
						</div>
						<div>
							<label htmlFor="sign-up-last-name" className="mb-2 block text-sm">
								Nazwisko
							</label>
							<input
								id="sign-up-last-name"
								type="text"
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								className="w-full rounded-md border border-gray-300 p-2"
								autoComplete="family-name"
							/>
						</div>
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
						{isSubmitting ? "Tworzenie konta..." : "Utwórz konto"}
					</button>
				</form>
				<p className="mt-4 text-center text-sm text-muted-foreground">
					Masz już konto?{" "}
					<Link to="/sign-in/$" className="text-green-800 hover:underline">
						Zaloguj się
					</Link>
				</p>
			</div>
		</AuthLayout>
	);
}
