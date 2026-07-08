import { usePostHog } from "@posthog/react";
import { Link } from "@tanstack/react-router";
import { LockKeyholeOpen } from "lucide-react";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import { type LoginSource, useLogin } from "#/lib/use-login";

type LoginFormProps = {
	redirectTo?: string;
	source: LoginSource;
	idPrefix?: string;
	submitLabel?: string;
	className?: string;
	showHelpLink?: boolean;
	showSignUpLink?: boolean;
};

const LoginForm = ({
	redirectTo,
	source,
	idPrefix = "login",
	submitLabel,
	className = "w-full lg:w-80 xl:w-96 shrink-0 p-5 sm:p-6 rounded-lg border border-gray-200 bg-card shadow-sm",
	showHelpLink = false,
	showSignUpLink = false,
}: LoginFormProps) => {
	const posthog = usePostHog();
	const t = useTranslation();
	const localize = useLocalizedPath();
	const {
		username,
		setUsername,
		password,
		setPassword,
		error,
		isSubmitting,
		handleSubmit,
	} = useLogin({ redirectTo, source });

	const usernameId = `${idPrefix}-username`;
	const passwordId = `${idPrefix}-password`;
	const resolvedSubmitLabel = submitLabel ?? t("buttons.signIn");

	return (
		<div className={className}>
			<h1 className="mb-4 text-lg font-bold text-green-800 sm:mb-5 sm:text-xl">
				{t("greetings.loginTitle")}
			</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor={usernameId} className="mb-2 block text-sm">
						{t("form.identifier")}
					</label>
					<input
						id={usernameId}
						type="text"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						className="w-full rounded-md border border-gray-300 p-2"
						placeholder={
							source === "home" ? t("form.identifierPlaceholder") : undefined
						}
						autoComplete="username"
						required
					/>
				</div>
				<div>
					<label htmlFor={passwordId} className="mb-2 block text-sm">
						{t("form.password")}
					</label>
					<input
						id={passwordId}
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="w-full rounded-md border border-gray-300 p-2"
						placeholder={
							source === "home" ? t("form.password") : undefined
						}
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
					className="block w-full rounded-md bg-green-800 p-2.5 text-center font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-60 sm:p-3"
				>
					{isSubmitting ? t("loading.signingIn") : resolvedSubmitLabel}
				</button>
			</form>

			{showHelpLink && (
				<Link
					to={localize("/sign-in")}
					onClick={() => posthog.capture("login_help_clicked")}
				>
					<p className="flex items-center gap-2 pt-4 text-sm text-gray-500 sm:pt-5">
						<LockKeyholeOpen className="text-green-800" /> {t("form.loginHelp")}
					</p>
				</Link>
			)}

			{showSignUpLink && (
				<p className="mt-4 text-center text-sm text-muted-foreground">
					{t("form.noAccount")}{" "}
					<Link
						to={localize("/sign-up")}
						className="text-green-800 hover:underline"
					>
						{t("buttons.signUp")}
					</Link>
				</p>
			)}
		</div>
	);
};

export default LoginForm;
