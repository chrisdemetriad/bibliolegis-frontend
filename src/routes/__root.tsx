import { ClerkProvider } from "@clerk/tanstack-react-start";
import { shadcn } from "@clerk/ui/themes";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { useState } from "react";
import { Analytics } from "#/analytics/Analytics";
import { Toaster } from "#/components/ui/sonner";
import { themeScript } from "#/theme/theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Bibliolegis",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	// One per render tree rather than a module level client, so nothing cached
	// for one user during server rendering can reach another
	const [queryClient] = useState(() => new QueryClient());

	return (
		// The theme script adds the dark class before React hydrates, so the
		// server rendered class list is expected to differ
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed string from our own code, it has to run before first paint */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<HeadContent />
			</head>
			<body>
				{/* Tells Clerk's own components where these pages live, otherwise their
				sign in and sign up links go to Clerk's hosted pages instead */}
				<ClerkProvider
					signInUrl="/sign-in"
					signUpUrl="/sign-up"
					// The root is the public homepage now, so without these a fresh
					// sign in would land back on the marketing page
					signInFallbackRedirectUrl="/overview"
					signUpFallbackRedirectUrl="/overview"
					// Clerk's shadcn theme reads the same CSS variables as our own
					// components, so sign in follows the theme and dark mode too
					appearance={{ theme: shadcn }}
				>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
					<Analytics />
				</ClerkProvider>
				<Toaster />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
