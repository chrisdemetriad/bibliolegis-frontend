// Addresses in this app carry client names. A matter's slug is the case name
// (r-v-hollis), a file's slug is its title and a press article's slug is its
// headline. Anything sent to PostHog goes through these first, so a page reads
// as /matters/:matter/files/:id there instead.

// Matter tabs are the app's own words, safe to keep. Anything after a tab is a
// file, an outlet or an article
function maskPath(pathname: string): string {
	const segments = pathname.split("/");
	if (segments[1] === "matters" && segments[2]) {
		segments[2] = ":matter";
		for (let i = 4; i < segments.length; i++) {
			if (segments[i]) segments[i] = ":id";
		}
	}
	if (segments[1] === "documents" && segments[2]) {
		segments[2] = ":document";
	}
	return segments.join("/");
}

// Query strings go entirely: press filters, search text and Clerk's redirect
// parameters can all name a matter
export function maskUrl(value: string): string {
	if (value.startsWith("/")) {
		return maskPath(value.split(/[?#]/)[0]);
	}
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return value;
	}
	// Other sites' addresses, a referrer or an outlet's own link, say nothing
	// about our clients' matters beyond what the outlet already published
	if (!isOurs(url.hostname)) return value;
	if (url.origin === apiOrigin())
		return `${url.origin}${maskApiPath(url.pathname)}`;
	return `${url.origin}${maskPath(url.pathname)}`;
}

// The api's paths name matters and documents by slug or id straight after the
// resource, /projects/r-v-hollis/documents, so everything after the first
// segment goes
function maskApiPath(pathname: string): string {
	return pathname
		.split("/")
		.map((segment, i) => (i > 1 && segment ? ":id" : segment))
		.join("/");
}

function apiOrigin(): string | undefined {
	try {
		return new URL(import.meta.env.VITE_API_URL).origin;
	} catch {
		return undefined;
	}
}

// The page's own host covers whatever it's served from, app.localhost in
// development included, rather than relying on this list being complete
function isOurs(hostname: string): boolean {
	return (
		(typeof window !== "undefined" && hostname === window.location.hostname) ||
		hostname === "bibliolegis.com" ||
		hostname.endsWith(".bibliolegis.com") ||
		hostname === "localhost" ||
		hostname.endsWith(".localhost")
	);
}

export function looksLikeUrl(value: unknown): value is string {
	return (
		typeof value === "string" &&
		(value.startsWith("/") ||
			value.startsWith("http://") ||
			value.startsWith("https://"))
	);
}
