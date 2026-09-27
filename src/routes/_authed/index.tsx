import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "#/auth/useCurrentUser";

export const Route = createFileRoute("/_authed/")({ component: Home });

function Home() {
	const { isLoaded, user, role, error } = useCurrentUser();

	return (
		<main className="p-8">
			<h1 className="text-4xl font-bold">Bibliolegis</h1>
			{!isLoaded && <p className="mt-4">Loading…</p>}
			{isLoaded && error !== undefined && (
				<p className="mt-4 text-destructive">
					Couldn't load your account from the api.
				</p>
			)}
			{isLoaded && role && (
				<p className="mt-4 text-lg">
					Signed in as {user?.primaryEmailAddress?.emailAddress}, {role}.
				</p>
			)}
		</main>
	);
}
