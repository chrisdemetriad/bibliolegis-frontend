import { useUser } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";
import type { UserProfile } from "#/api/client";
import { useApi } from "#/api/useApi";

type ProfileState =
	| { status: "loading" }
	| { status: "ready"; profile: UserProfile }
	| { status: "error"; error: unknown };

// Clerk knows who someone is, the backend knows their role and firm. The role
// comes from GET /users/me rather than Clerk's own org roles, since the
// backend enforces against its local users table and not against Clerk
export function useCurrentUser() {
	const { isLoaded, isSignedIn, user } = useUser();
	const api = useApi();
	const [state, setState] = useState<ProfileState>({ status: "loading" });
	const userId = user?.id;

	useEffect(() => {
		if (!isSignedIn || !userId) return;
		let cancelled = false;
		setState({ status: "loading" });
		api.me().then(
			(profile) => {
				if (!cancelled) setState({ status: "ready", profile });
			},
			(error: unknown) => {
				if (!cancelled) setState({ status: "error", error });
			},
		);
		return () => {
			cancelled = true;
		};
	}, [api, isSignedIn, userId]);

	const profile = state.status === "ready" ? state.profile : undefined;

	return {
		isLoaded: isLoaded && (!isSignedIn || state.status !== "loading"),
		isSignedIn: isSignedIn ?? false,
		user: user ?? null,
		profile,
		role: profile?.role,
		error: state.status === "error" ? state.error : undefined,
	};
}
