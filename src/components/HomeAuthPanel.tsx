import LoginForm from "#/components/LoginForm";
import { HomeUserSummary } from "#/components/HomeUserSummary";
import { useSession } from "#/lib/auth-client";
import { useTranslation } from "#/lib/i18n";
import {
	type AuthenticatedUser,
	toAuthenticatedUser,
} from "#/lib/session-user";

type HomeAuthPanelProps = {
	initialUser: AuthenticatedUser | null;
};

/** Shows login or a signed-in summary depending on session state. */
export function HomeAuthPanel({ initialUser }: HomeAuthPanelProps) {
	const t = useTranslation();
	const { data: session } = useSession();

	const user = session?.user
		? toAuthenticatedUser({ user: session.user })
		: initialUser;

	if (user) {
		return <HomeUserSummary user={user} />;
	}

	return (
		<LoginForm
			source="home"
			idPrefix="home"
			submitLabel={t("buttons.continue")}
			showHelpLink
		/>
	);
}
