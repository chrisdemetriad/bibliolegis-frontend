import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { PressFeed, type PressView, ViewToggle } from "#/press/PressFeed";
import { AddFeed, SOURCE_CATEGORIES, SourceRow } from "#/press/PressSettings";
import { useFirmPress, useMe, usePressSources } from "#/press/queries";
import { Page, PageHeader, Panel, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/press")({
	validateSearch: (search: Record<string, unknown>): { view?: "cards" } =>
		search.view === "cards" ? { view: "cards" } : {},
	component: PressPage,
});

function PressPage() {
	const { view: chosen } = Route.useSearch();
	const view: PressView = chosen ?? "list";
	const navigate = useNavigate({ from: Route.fullPath });
	const { data, isPending, isError } = useFirmPress();

	return (
		<Page>
			<PageHeader
				title="Press"
				sample={false}
				description="News about the matters you're on and the people in them, newest first. The firm's feeds on the right are read every few hours for each open matter's parties, and a matter can add feeds and terms of its own on its Press tab."
				actions={
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
			/>

			<div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
				<div className="min-w-0">
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
							showMatter
							empty="Nothing found yet for any of your matters."
						/>
					)}
				</div>
				<aside>
					<FirmSources />
				</aside>
			</div>
		</Page>
	);
}

// Only an admin changes the firm's feeds, the api refuses anyone else, so
// everyone else sees them without the switches working
function FirmSources() {
	const { data: sources, isPending } = usePressSources();
	const { data: me } = useMe();
	const isAdmin = me?.role === "admin";
	const [adding, setAdding] = useState(false);
	const groups = [...SOURCE_CATEGORIES, null].map((category) => ({
		label: category ?? "Other",
		items: (sources ?? []).filter((source) =>
			category
				? source.category === category
				: !SOURCE_CATEGORIES.some((known) => known === source.category),
		),
	}));
	const on = sources?.filter((source) => source.enabled).length ?? 0;

	return (
		<section>
			<SectionTitle
				action={
					isAdmin &&
					!adding && (
						<Button variant="ghost" size="xs" onClick={() => setAdding(true)}>
							<PlusIcon /> Add
						</Button>
					)
				}
			>
				Sources
				{sources && (
					<span className="ml-1.5 font-normal text-muted-foreground">
						{on} of {sources.length}
					</span>
				)}
			</SectionTitle>
			{adding && (
				<Panel className="mb-4">
					<AddFeed onDone={() => setAdding(false)} />
				</Panel>
			)}
			{isPending ? (
				<Skeleton className="h-48" />
			) : sources?.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No feeds yet.{" "}
					{isAdmin ? "Add one to start." : "An admin can add them here."}
				</p>
			) : (
				<div className="space-y-4">
					{groups
						.filter((group) => group.items.length > 0)
						.map((group) => (
							<div key={group.label}>
								<p className="mb-1 text-xs text-muted-foreground">
									{group.label}
								</p>
								<Panel className="divide-y">
									{group.items.map((source) => (
										<SourceRow
											key={source.id}
											source={source}
											canChange={isAdmin}
										/>
									))}
								</Panel>
							</div>
						))}
				</div>
			)}
		</section>
	);
}
