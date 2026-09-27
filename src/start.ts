import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

// Reads the Clerk session off every request so auth() works in server
// functions. It doesn't protect anything itself, the _authed layout does that
export const startInstance = createStart(() => ({
	requestMiddleware: [clerkMiddleware()],
}));
