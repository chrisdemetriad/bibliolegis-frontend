import { createFileRoute, redirect } from "@tanstack/react-router";
import { HomePage } from "#/site/HomePage";
import { isAppHost } from "#/site/host";

// Public, unlike everything under _authed. On the app host the root goes
// straight into the product, which signs the user in first if it needs to
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		if (isAppHost()) {
			throw redirect({ to: "/overview" });
		}
	},
	head: () => ({
		meta: [
			{ title: "Bibliolegis, ask your case files anything" },
			{
				name: "description",
				content:
					"AI for UK law firms that reads every document in every matter and answers with the exact passage it came from.",
			},
		],
	}),
	component: HomePage,
});
