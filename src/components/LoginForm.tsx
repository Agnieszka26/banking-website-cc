import { usePostHog } from "@posthog/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyholeOpen } from "lucide-react";
import { useState } from "react";
import { signIn } from "#/lib/auth-client";

const LoginForm = () => {
	const posthog = usePostHog();
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const { error: signInError } = await signIn.username({
				username,
				password,
			});

			if (signInError) {
				setError(signInError.message ?? "Logowanie nie powiodło się");
				return;
			}

			posthog.capture("login_started");
			posthog.identify(username, { username });
			await navigate({ to: "/dashboard" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Logowanie nie powiodło się",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="w-full lg:w-80 xl:w-96 shrink-0 p-5 sm:p-6 rounded-lg border border-gray-200 bg-card shadow-sm">
			<h1 className="font-bold text-lg sm:text-xl mb-4 sm:mb-5 text-green-800">
				Logowanie
			</h1>
			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label htmlFor="username" className="block mb-2">
						Identyfikator
					</label>
					<input
						type="text"
						id="username"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						className="w-full p-2 rounded-md border border-gray-300"
						placeholder="Podaj identyfikator"
						autoComplete="username"
						required
					/>
				</div>
				<div className="mb-4">
					<label htmlFor="password" className="block mb-2">
						Hasło
					</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="w-full p-2 rounded-md border border-gray-300"
						placeholder="Podaj hasło"
						autoComplete="current-password"
						required
					/>
				</div>
				{error && (
					<p className="mb-4 text-sm text-red-600" role="alert">
						{error}
					</p>
				)}
				<button
					type="submit"
					disabled={isSubmitting}
					className="block w-full bg-green-800 text-white p-2.5 sm:p-3 rounded-md font-medium hover:bg-green-900 transition-colors text-center disabled:opacity-60"
				>
					{isSubmitting ? "Logowanie..." : "Dalej"}
				</button>
			</form>

			<Link
				to="/sign-in/$"
				onClick={() => posthog.capture("login_help_clicked")}
			>
				<p className="flex items-center gap-2 text-sm text-gray-500 pt-4 sm:pt-5">
					<LockKeyholeOpen className="text-green-800" /> pomoc w logowaniu
				</p>
			</Link>
		</div>
	);
};

export default LoginForm;
