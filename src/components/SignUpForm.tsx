import { Link } from "@tanstack/react-router";
import { useLocalizedPath, useTranslation } from "#/lib/i18n";
import { useSignUp } from "#/lib/use-sign-up";

type SignUpFormProps = {
	idPrefix?: string;
	className?: string;
};

const SignUpForm = ({
	idPrefix = "sign-up",
	className = "w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm",
}: SignUpFormProps) => {
	const t = useTranslation();
	const localize = useLocalizedPath();
	const {
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
	} = useSignUp();

	const usernameId = `${idPrefix}-username`;
	const passwordId = `${idPrefix}-password`;
	const firstNameId = `${idPrefix}-first-name`;
	const lastNameId = `${idPrefix}-last-name`;

	return (
		<div className={className}>
			<h1 className="mb-6 text-xl font-bold text-green-800">
				{t("greetings.signUpTitle")}
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
						placeholder={t("form.identifierPlaceholder")}
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
						autoComplete="new-password"
						minLength={8}
						required
					/>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("form.passwordHint")}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor={firstNameId} className="mb-2 block text-sm">
							{t("form.firstName")}
						</label>
						<input
							id={firstNameId}
							type="text"
							value={firstName}
							onChange={(event) => setFirstName(event.target.value)}
							className="w-full rounded-md border border-gray-300 p-2"
							autoComplete="given-name"
						/>
					</div>
					<div>
						<label htmlFor={lastNameId} className="mb-2 block text-sm">
							{t("form.lastName")}
						</label>
						<input
							id={lastNameId}
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
					className="w-full rounded-md bg-green-800 p-2.5 font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-60"
				>
					{isSubmitting ? t("loading.signingUp") : t("buttons.createAccount")}
				</button>
			</form>
			<p className="mt-4 text-center text-sm text-muted-foreground">
				{t("form.hasAccount")}{" "}
				<Link to={localize("/sign-in")} className="text-green-800 hover:underline">
					{t("buttons.signIn")}
				</Link>
			</p>
		</div>
	);
};

export default SignUpForm;
