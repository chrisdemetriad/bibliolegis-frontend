import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/matters/$matterId/")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: "/matters/$matterId/overview", params });
	},
});
