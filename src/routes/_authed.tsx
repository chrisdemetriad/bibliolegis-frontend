import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { TooltipProvider } from "#/components/ui/tooltip";
import { AppHeader } from "#/shell/AppHeader";
import { AppSidebar } from "#/shell/AppSidebar";

// Runs on the server even when called from a client side navigation, so the
// check reads the session cookie rather than trusting anything in the browser
const getUserId = createServerFn().handler(async () => {
	const { isAuthenticated, userId } = await auth();
	return isAuthenticated ? userId : null;
});

// Every route under this pathless layout needs a signed in user. New pages go
// in src/routes/_authed/ unless they're meant to be public
export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		const userId = await getUserId();
		if (!userId) {
			// Clerk's <SignIn /> reads redirect_url and sends the user back there
			throw redirect({
				href: `/sign-in?redirect_url=${encodeURIComponent(location.href)}`,
			});
		}
		return { userId };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	return (
		<TooltipProvider delayDuration={0}>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className="min-w-0 md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-border">
					<AppHeader />
					<Outlet />
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
