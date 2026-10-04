import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { appHostUrl, isAppHost } from "#/site/host";

// A splat route because Clerk moves through its own sub paths during sign in,
// /sign-in/factor-one and so on
export const Route = createFileRoute("/sign-in/$")({
	beforeLoad: ({ location }) => {
		// Sign in only exists on app., bibliolegis.com never carries a session.
		// A stray link or bookmark to the root's /sign-in still ends up in the
		// right place rather than rendering Clerk's form on the marketing host
		if (!isAppHost()) {
			throw redirect({ href: appHostUrl(location.href) });
		}
	},
	component: SignInPage,
});

function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-8">
			<SignIn />
		</main>
	);
}
