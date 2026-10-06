import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellIcon, LinkIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useMatter } from "#/matters/context";
import { press } from "#/mock/data";
import { AddLink } from "#/press/AddLink";
import {
	PressFeed,
	type PressFilters,
	type PressView,
	ViewToggle,
	validatePressFilters,
} from "#/press/PressFeed";
import { MatterSources, WatchTerms } from "#/press/PressSettings";
import {
	isSearching,
	useMatterPress,
	usePressSources,
	useRefreshPress,
} from "#/press/queries";
import { PressList } from "#/shell/lists";
import { SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/press")({
	// In the address so a reload or a shared link keeps the chosen view. List
	// is the default and isn't written out
	validateSearch: (
		search: Record<string, unknown>,
	): PressFilters & { view?: "cards"; show?: "kept" | "dismissed" } => ({
		...validatePressFilters(search),
		...(search.view === "cards" ? { view: "cards" as const } : {}),
		...(search.show === "kept" || search.show === "dismissed"
			? { show: search.show }
			: {}),
	}),
	component: MatterPress,
});

function MatterPress() {
	const matter = useMatter();
	if (matter.projectId) return <RealPress projectRef={matter.id} />;
	const items = press.filter((item) => item.matterId === matter.id);

	return (
		<div>
			<SectionTitle
				action={
					<Button size="sm" variant="outline">
						<BellIcon /> Alert me
					</Button>
				}
			>
				Press
			</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				Coverage of this matter, the parties and the issues it turns on.
				Watching {matter.parties.map((party) => party.name).join(", ")}.
			</p>
			<PressList items={items} showMatter={false} />
		</div>
	);
}

function RealPress({ projectRef }: { projectRef: string }) {
	const { view: chosen, show, ...filters } = Route.useSearch();
	const view: PressView = chosen ?? "list";
	const navigate = useNavigate({ from: Route.fullPath });
	const sources = usePressSources(projectRef);
	const searching = isSearching(sources.data);
	const { data, isPending, isError } = useMatterPress(projectRef, {
		includeDismissed: true,
		searching,
	});
	const counts = {
		all: data?.filter((m) => m.status !== "dismissed").length ?? 0,
		kept: data?.filter((m) => m.status === "kept").length ?? 0,
		dismissed: data?.filter((m) => m.status === "dismissed").length ?? 0,
	};
	const shown =
		data?.filter((m) =>
			show ? m.status === show : m.status !== "dismissed",
		) ?? [];
	const refresh = useRefreshPress(projectRef);
	const [adding, setAdding] = useState(false);

	const searchNow = () =>
		refresh.mutate(undefined, {
			onSuccess: ({ searches_started }) =>
				toast.success(
					searches_started === 0
						? "Checking the feeds. Add a source to search outlets too"
						: `Searching ${searches_started} ${searches_started === 1 ? "source" : "sources"}, articles appear here as they're found`,
				),
			onError: (error) =>
				toast.error(errorMessage(error, "Couldn't search the sources.")),
		});

	return (
		<div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
			<div className="min-w-0">
				<SectionTitle
					action={
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setAdding(true)}
								title="Add one article by its link"
							>
								<LinkIcon /> Paste a link
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={refresh.isPending || searching}
								onClick={searchNow}
							>
								<RefreshCwIcon
									className={searching ? "animate-spin" : undefined}
								/>
								{searching ? "Searching…" : "Search now"}
							</Button>
							<ViewToggle
								view={view}
								onChange={(next) =>
									void navigate({
										search: (prev) => ({
											...prev,
											view: next === "cards" ? "cards" : undefined,
										}),
										replace: true,
									})
								}
							/>
						</div>
					}
				>
					Press
				</SectionTitle>
				<p className="-mt-1 mb-4 text-sm text-muted-foreground">
					Everything the sources on the right have found about this matter,
					newest added first. They're searched back to the matter's earliest
					date when added and for anything new every few hours.
				</p>
				{adding && (
					<AddLink projectRef={projectRef} onDone={() => setAdding(false)} />
				)}
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-24" />
						<Skeleton className="h-24" />
					</div>
				) : isError ? (
					<p className="text-sm text-destructive">Couldn't load the press.</p>
				) : (
					<>
						<div className="mb-3 flex gap-4 border-b text-sm">
							{(
								[
									[undefined, "All", counts.all],
									["kept", "Kept", counts.kept],
									["dismissed", "Dismissed", counts.dismissed],
								] as const
							).map(([value, label, count]) => (
								<button
									key={label}
									type="button"
									aria-pressed={show === value}
									onClick={() =>
										void navigate({
											search: (prev) => ({ ...prev, show: value }),
											replace: true,
										})
									}
									className="-mb-px border-b-2 border-transparent pb-2 text-muted-foreground aria-pressed:border-foreground aria-pressed:text-foreground"
								>
									{label}{" "}
									<span className="text-xs text-muted-foreground">{count}</span>
								</button>
							))}
						</div>
						<PressFeed
							key={show ?? "all"}
							mentions={shown}
							view={view}
							filters={filters}
							onFiltersChange={(next) =>
								void navigate({
									search: ({ view, show }) => ({ view, show, ...next }),
									replace: true,
								})
							}
							empty={
								show === "kept"
									? "Nothing kept yet. Keep an article from its page to shortlist it here."
									: show === "dismissed"
										? "Nothing dismissed."
										: searching
											? "Searching, articles appear here as they're found."
											: "Nothing found yet. Add a source on the right, BBC or All news outlets say, and it searches straight away."
							}
						/>
					</>
				)}
			</div>
			<aside className="space-y-6">
				<WatchTerms projectRef={projectRef} />
				<MatterSources projectRef={projectRef} />
			</aside>
		</div>
	);
}
