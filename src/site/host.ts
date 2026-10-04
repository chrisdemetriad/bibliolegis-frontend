import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost, getRequestUrl } from "@tanstack/react-start/server";

// bibliolegis.com and app.bibliolegis.com are the same service, the host is
// the only thing telling the homepage and the app apart. Locally that's
// localhost:4000 and app.localhost:4000, browsers resolve any *.localhost
// name to this machine without touching /etc/hosts
export const isAppHost = createIsomorphicFn()
	.server(() => getRequestHost().startsWith("app."))
	.client(() => window.location.hostname.startsWith("app."));

const currentOrigin = createIsomorphicFn()
	.server(() => getRequestUrl().origin)
	.client(() => window.location.origin);

// Turns a path into an absolute url on this same deploy's app host, so a
// redirect started on the root host lands on app. rather than staying on the
// marketing one. A path already on app. keeps its own origin
export function appHostUrl(path: string): string {
	const url = new URL(currentOrigin());
	if (!url.hostname.startsWith("app.")) {
		url.hostname = `app.${url.hostname}`;
	}
	return new URL(path, url).toString();
}
