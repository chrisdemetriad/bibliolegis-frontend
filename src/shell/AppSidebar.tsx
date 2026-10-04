import { UserButton } from "@clerk/tanstack-react-start";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	BookMarkedIcon,
	BriefcaseIcon,
	CalendarClockIcon,
	FilesIcon,
	HistoryIcon,
	HouseIcon,
	LibraryIcon,
	LifeBuoyIcon,
	type LucideIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	NotebookPenIcon,
	ScaleIcon,
	SearchIcon,
	SettingsIcon,
	SparklesIcon,
	UsersIcon,
} from "lucide-react";
import { Kbd } from "#/components/ui/kbd";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";
import { useAllMatters } from "#/matters/queries";
import { currentUser } from "#/mock/data";

type NavItem = {
	label: string;
	to: string;
	icon: LucideIcon;
	badge?: string | number;
};

function firmNav(openMatters: number): NavItem[] {
	return [
		{ label: "Overview", to: "/overview", icon: HouseIcon },
		{
			label: "Matters",
			to: "/matters",
			icon: BriefcaseIcon,
			badge: openMatters,
		},
		{ label: "Library", to: "/library", icon: LibraryIcon },
		{ label: "Press", to: "/press", icon: NewspaperIcon },
	];
}

function matterNav(
	matterId: string,
	documents: number,
	press?: number,
): NavItem[] {
	const base = `/matters/${matterId}`;
	return [
		{ label: "Overview", to: `${base}/overview`, icon: SparklesIcon },
		{ label: "Files", to: `${base}/files`, icon: FilesIcon, badge: documents },
		{ label: "Chronology", to: `${base}/chronology`, icon: HistoryIcon },
		{
			label: "Hearings and deadlines",
			to: `${base}/hearings`,
			icon: CalendarClockIcon,
		},
		{ label: "Parties", to: `${base}/parties`, icon: UsersIcon },
		{ label: "Research", to: `${base}/research`, icon: BookMarkedIcon },
		{ label: "Notes", to: `${base}/notes`, icon: NotebookPenIcon },
		{ label: "Press", to: `${base}/press`, icon: NewspaperIcon, badge: press },
		{ label: "Activity", to: `${base}/activity`, icon: MessageSquareTextIcon },
	];
}

function NavList({ items }: { items: NavItem[] }) {
	const { pathname } = useLocation();

	return (
		<SidebarMenu>
			{items.map((item) => (
				<SidebarMenuItem key={item.to}>
					<SidebarMenuButton
						asChild
						isActive={
							pathname === item.to || pathname.startsWith(`${item.to}/`)
						}
						tooltip={item.label}
						className="data-active:bg-background data-active:shadow-[0_0_0_1px_var(--sidebar-border)]"
					>
						{/* The routes are typed but these paths are built from data, so
						they go through as plain strings */}
						<Link to={item.to}>
							<item.icon />
							<span>{item.label}</span>
						</Link>
					</SidebarMenuButton>
					{item.badge !== undefined && (
						<SidebarMenuBadge className="text-muted-foreground">
							{item.badge.toLocaleString("en-GB")}
						</SidebarMenuBadge>
					)}
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	);
}

export function AppSidebar() {
	const { matterId } = useParams({ strict: false });
	const { matters } = useAllMatters();
	const matter = matterId
		? matters.find((candidate) => candidate.id === matterId)
		: undefined;
	const pinned = matters.filter((candidate) => candidate.pinned);
	const openMatters = matters.filter((candidate) => !candidate.closed).length;

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader className="gap-3">
				<Link
					to="/overview"
					className="flex items-center gap-2.5 rounded-md px-1.5 py-1"
				>
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
						<ScaleIcon className="size-4" />
					</span>
					<span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
						<span className="font-logo text-2xl tracking-tight">
							bibliolegis
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{currentUser.firm}
						</span>
					</span>
				</Link>
				<button
					type="button"
					className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm text-muted-foreground shadow-xs hover:text-foreground group-data-[collapsible=icon]:hidden"
				>
					<SearchIcon className="size-4" />
					<span className="flex-1 text-left">Search</span>
					<Kbd>⌘K</Kbd>
				</button>
			</SidebarHeader>

			<SidebarContent>
				{matter ? (
					<>
						<SidebarGroup>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										tooltip="All matters"
										className="text-muted-foreground"
									>
										<Link to="/matters">
											<ArrowLeftIcon />
											<span>All matters</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroup>
						<SidebarGroup className="pt-0">
							<div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
								<p className="text-sm leading-snug font-medium">
									{matter.title}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{matter.reference}
								</p>
							</div>
							<SidebarGroupContent>
								<NavList
									items={matterNav(matter.id, matter.documents, matter.press)}
								/>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				) : (
					<>
						<SidebarGroup>
							<SidebarGroupContent>
								<NavList items={firmNav(openMatters)} />
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarGroup>
							<SidebarGroupLabel>Pinned matters</SidebarGroupLabel>
							<SidebarGroupContent>
								{pinned.length === 0 && (
									<p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
										Pin a matter from its row on Matters to keep it here.
									</p>
								)}
								<SidebarMenu>
									{pinned.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton asChild tooltip={item.title}>
												<Link
													to="/matters/$matterId/overview"
													params={{ matterId: item.id }}
												>
													<span className="ml-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				)}
			</SidebarContent>

			<SidebarFooter>
				<NavList
					items={[
						{ label: "Help", to: "/help", icon: LifeBuoyIcon },
						{ label: "Settings", to: "/settings", icon: SettingsIcon },
					]}
				/>
				<div className="mt-1 flex items-center gap-2.5 border-t px-1 pt-3">
					{/* Clerk's own button, so signing out stays Clerk's UI. The name
					beside it is sample data until the api returns one */}
					<UserButton />
					<div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
						<p className="truncate text-sm font-medium">{currentUser.name}</p>
						<p className="truncate text-xs text-muted-foreground">
							{currentUser.role}
						</p>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
