import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useMatter } from "#/matters/context";
import { press } from "#/mock/data";
import { PressFeed, type PressView, ViewToggle } from "#/press/PressFeed";
import { useMatterPress } from "#/press/queries";
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

	return (
		<div>
			<SectionTitle
				action={
					<ViewToggle
						view={view}
						onChange={(next) =>
							void navigate({
								search: next === "cards" ? { view: "cards" } : {},
								replace: true,
							})
						}
					/>
				}
			>
				Press
			</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				News about this matter and its parties, newest first. Each article links
				to where it was published.
			</p>
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
					empty="Nothing found yet. Sources are read every few hours."
				/>
			)}
		</div>
	);
}
