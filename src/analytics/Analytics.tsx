import { useUser } from "@clerk/tanstack-react-start";
import posthog, { type CaptureResult, type Properties } from "posthog-js";
import { useEffect, useRef } from "react";
import { looksLikeUrl, maskUrl } from "./urls";

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

// Every string property that holds an address, ours or a referrer, gets
// masked. Heatmap data is keyed by the page's address rather than holding it
// as a value, so its keys go through the same thing
function maskProperties(properties: Properties | undefined): void {
	if (!properties) return;
	for (const [key, value] of Object.entries(properties)) {
		if (looksLikeUrl(value)) properties[key] = maskUrl(value);
	}
	const heatmap = properties.$heatmap_data;
	if (heatmap && typeof heatmap === "object") {
		properties.$heatmap_data = Object.fromEntries(
			Object.entries(heatmap).map(([url, points]) => [maskUrl(url), points]),
		);
	}
}

function maskEvent(event: CaptureResult | null): CaptureResult | null {
	if (!event) return event;
	maskProperties(event.properties);
	maskProperties(event.$set);
	maskProperties(event.$set_once);
	return event;
}

// Attributes that can carry a case name in a replay. Class and style stay so
// the replay still looks like the page
const TEXT_ATTRIBUTES = new Set([
	"title",
	"alt",
	"aria-label",
	"placeholder",
	"value",
]);

function maskAttribute(name: string, value: string): string {
	if (name === "href" || name === "src" || name === "action") {
		return maskUrl(value);
	}
	if (TEXT_ATTRIBUTES.has(name) || name.startsWith("data-")) {
		return "*".repeat(value.length);
	}
	return value;
}

function start() {
	posthog.init(KEY, {
		api_host: HOST,
		defaults: "2026-08-30",
		// Nothing written to cookies or storage, so there's nothing to ask
		// consent for under PECR. A signed in user is still followed across
		// reloads by their Clerk id, an anonymous visitor isn't
		persistence: "memory",
		person_profiles: "identified_only",
		// Feature flags aren't used. Their request carries the address someone
		// first landed on with its query string, and before_send never sees it
		advanced_disable_feature_flags: true,
		// Clicks are kept without the text or attributes of what was clicked,
		// which on a matter's pages is a client's name or a document title
		mask_all_text: true,
		mask_all_element_attributes: true,
		capture_exceptions: true,
		enable_heatmaps: true,
		session_recording: {
			// Shows where someone went and what they clicked, never what was on
			// screen. Images and canvases are blocked outright, the PDF viewer
			// draws onto a canvas and a scanned document is an image
			maskAllInputs: true,
			maskTextSelector: "*",
			blockSelector: "img, canvas, video, iframe, svg image",
			maskAttributeFn: maskAttribute,
			recordHeaders: false,
			recordBody: false,
			maskCapturedNetworkRequestFn: (request) => ({
				...request,
				name: maskUrl(request.name),
			}),
		},
		before_send: maskEvent,
	});
}

// Renders nothing. Sits inside ClerkProvider so it knows who's signed in.
// Without a key, local development and preview builds, PostHog never starts
export function Analytics() {
	const { isLoaded, isSignedIn, user } = useUser();
	const identified = useRef<string | null>(null);

	useEffect(() => {
		if (KEY) start();
	}, []);

	useEffect(() => {
		if (!KEY || !isLoaded) return;
		// Keyed on the Clerk id, with the email so a person's sessions and
		// errors can be found by who they are. The terms say so
		if (isSignedIn && user && identified.current !== user.id) {
			posthog.identify(user.id, {
				email: user.primaryEmailAddress?.emailAddress,
			});
			identified.current = user.id;
		} else if (!isSignedIn && identified.current) {
			posthog.reset();
			identified.current = null;
		}
	}, [isLoaded, isSignedIn, user]);

	return null;
}
