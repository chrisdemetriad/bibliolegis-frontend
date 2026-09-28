import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
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
import { useMatterPress, useRefreshPress } from "#/press/queries";
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
	const { data, isPending, isError } = useMatterPress(projectRef);
	const refresh = useRefreshPress(projectRef);
	const [adding, setAdding] = useState(false);

	const searchNow = () =>
		refresh.mutate(undefined, {
			onSuccess: ({ mentions_added, sources_failed }) => {
				const found =
					mentions_added === 0
						? "Nothing new"
						: `${mentions_added} new ${mentions_added === 1 ? "article" : "articles"}`;
				const failed =
					sources_failed > 0
						? `, ${sources_failed} ${sources_failed === 1 ? "source" : "sources"} couldn't be read`
						: "";
				toast.success(`${found}${failed}`);
			},
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
								variant="outline"
								disabled={refresh.isPending}
								onClick={searchNow}
							>
								<RefreshCwIcon
									className={refresh.isPending ? "animate-spin" : undefined}
								/>
								{refresh.isPending ? "Searching…" : "Search now"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setAdding(true)}
							>
								<PlusIcon /> Add article
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
					News about this matter and its parties, newest first. Sources are read
					every few hours, or now with Search now.
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
						empty="Nothing found yet. Try Search now, or add an article by its link."
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
