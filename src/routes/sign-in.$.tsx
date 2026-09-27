import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

// A splat route because Clerk moves through its own sub paths during sign in,
// /sign-in/factor-one and so on
export const Route = createFileRoute("/sign-in/$")({ component: SignInPage });

function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-8">
			<SignIn />
		</main>
	);
}
