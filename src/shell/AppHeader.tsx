import { Link, useLocation } from "@tanstack/react-router";
import { BellIcon, ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { findMatter } from "#/mock/data";
import { ThemeToggle } from "#/theme/ThemeToggle";

const labels: Record<string, string> = {
	overview: "Overview",
	matters: "Matters",
	documents: "Documents",
	library: "Library",
	press: "Press",
	help: "Help",
	settings: "Settings",
	files: "Files",
	chronology: "Chronology",
	hearings: "Hearings and deadlines",
	parties: "Parties",
	research: "Research",
	notes: "Notes",
	activity: "Activity",
};

// Built from the path rather than declared per route, since every segment
// either has a fixed label or is a matter or document id
function useCrumbs() {
	const { pathname } = useLocation();
	const segments = pathname.split("/").filter(Boolean);

	return segments.map((segment, i) => {
		const href = `/${segments.slice(0, i + 1).join("/")}`;
		const matter = segments[i - 1] === "matters" ? findMatter(segment) : null;
		const label =
			labels[segment] ??
			matter?.title ??
			(segments[i - 1] === "documents" ? "Document" : segment);
		return { href, label };
	});
}

export function AppHeader() {
	const crumbs = useCrumbs();

	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger className="-ml-1 text-muted-foreground" />
			<Separator orientation="vertical" className="mr-1 h-4!" />
			<nav
				aria-label="Breadcrumb"
				className="flex min-w-0 items-center gap-1.5"
			>
				{crumbs.map((crumb, i) => (
					<Fragment key={crumb.href}>
						{i > 0 && (
							<ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground max-sm:hidden" />
						)}
						{i === crumbs.length - 1 ? (
							<span className="truncate text-sm font-medium">
								{crumb.label}
							</span>
						) : (
							<Link
								to={crumb.href}
								className="truncate text-sm text-muted-foreground hover:text-foreground max-sm:hidden"
							>
								{crumb.label}
							</Link>
						)}
					</Fragment>
				))}
			</nav>
			<div className="ml-auto flex items-center gap-1">
				<ThemeToggle />
				<Button
					variant="ghost"
					size="icon"
					aria-label="Notifications, 3 unread"
					className="relative"
				>
					<BellIcon />
					<span className="absolute top-2 right-2 size-1.5 rounded-full bg-warning-foreground" />
				</Button>
			</div>
		</header>
	);
}
