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
import { PressFeed, type PressView, ViewToggle } from "#/press/PressFeed";
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
	validateSearch: (search: Record<string, unknown>): { view?: "cards" } =>
		search.view === "cards" ? { view: "cards" } : {},
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
	const { view: chosen } = Route.useSearch();
	const view: PressView = chosen ?? "list";
	const navigate = useNavigate({ from: Route.fullPath });
	const sources = usePressSources(projectRef);
	const searching = isSearching(sources.data);
	const { data, isPending, isError } = useMatterPress(projectRef, {
		searching,
	});
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
										search: next === "cards" ? { view: "cards" } : {},
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
					newest first. They're searched back to the matter's earliest date when
					added and for anything new every few hours.
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
					<PressFeed
						mentions={data}
						view={view}
						empty={
							searching
								? "Searching, articles appear here as they're found."
								: "Nothing found yet. Add a source on the right, BBC or All news outlets say, and it searches straight away."
						}
					/>
				)}
			</div>
			<aside className="space-y-6">
				<WatchTerms projectRef={projectRef} />
				<MatterSources projectRef={projectRef} />
			</aside>
		</div>
	);
}
