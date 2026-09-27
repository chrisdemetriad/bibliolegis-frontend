import { useAuth } from "@clerk/tanstack-react-start";
import { useMemo } from "react";
import { createApi } from "./client";

// The api client for whoever is signed in. Clerk's getToken hands back a
// cached session token and refreshes it once it's close to expiring, so
// calling it before every request costs nothing most of the time
export function useApi() {
	const { getToken } = useAuth();
	return useMemo(() => createApi({ getToken: () => getToken() }), [getToken]);
}
