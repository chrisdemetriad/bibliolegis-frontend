import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { appHostUrl, isAppHost } from "#/site/host";

export const Route = createFileRoute("/sign-up/$")({
	// Sign up only exists on app., same reasoning as /sign-in/$
	beforeLoad: ({ location }) => {
		if (!isAppHost()) {
			throw redirect({ href: appHostUrl(location.href) });
		}
	},
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-8">
			<SignUp />
		</main>
	);
}
