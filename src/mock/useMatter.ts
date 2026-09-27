import { getRouteApi } from "@tanstack/react-router";

const matterRoute = getRouteApi("/_authed/matters/$matterId");

// The layout route's loader has already thrown notFound for an unknown id, so
// every page under it gets a matter
export function useMatter() {
	return matterRoute.useLoaderData();
}
