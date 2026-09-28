import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

// bibliolegis.com and app.bibliolegis.com are the same service, the host is
// the only thing telling the homepage and the app apart. Locally that's
// localhost:4000 and app.localhost:4000, browsers resolve any *.localhost
// name to this machine without touching /etc/hosts
export const isAppHost = createIsomorphicFn()
	.server(() => getRequestHost().startsWith("app."))
	.client(() => window.location.hostname.startsWith("app."));
