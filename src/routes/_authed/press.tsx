import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import type { PressSource } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
	PressFeed,
	type PressFilters,
	type PressView,
	ViewToggle,
	validatePressFilters,
} from "#/press/PressFeed";
import { AddSource, SOURCE_CATEGORIES, SourceRow } from "#/press/PressSettings";
import { useFirmPress, useMe, usePressSources } from "#/press/queries";
import { Page, PageHeader, Panel, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/press")({
	validateSearch: (
		search: Record<string, unknown>,
	): PressFilters & { view?: "cards" } => ({
		...validatePressFilters(search),
		...(search.view === "cards" ? { view: "cards" as const } : {}),
	}),
	component: PressPage,
});

function PressPage() {
	const { view: chosen, ...filters } = Route.useSearch();
	const view: PressView = chosen ?? "list";
	const navigate = useNavigate({ from: Route.fullPath });
	const { data, isPending, isError } = useFirmPress();

	return (
		<Page>
			<PageHeader
				title="Press"
				sample={false}
				description="News about the matters you're on, newest added first. Every source on the right is searched for every open matter, back to the matter's earliest date when it's added and for anything new every few hours. A matter's own terms and sources are on its Press tab."
				actions={
					<ViewToggle
						view={view}
						onChange={(next) =>
							void navigate({
								search: (prev) => ({
									...prev,
									view: next === "cards" ? ("cards" as const) : undefined,
								}),
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
							filters={filters}
							onFiltersChange={(next) =>
								void navigate({
									search: ({ view }) => ({ view, ...next }),
									replace: true,
								})
							}
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

// Only an admin changes the firm's sources, the api refuses anyone else, so
// everyone else sees them without the switches working
function FirmSources() {
	const { data: sources, isPending } = usePressSources();
	const { data: me } = useMe();
	const isAdmin = me?.role === "admin";
	const [adding, setAdding] = useState(false);
	const all = sources ?? [];
	const known = (source: PressSource) =>
		SOURCE_CATEGORIES.some((category) => category === source.category);
	const groups = [
		{
			label: "Every outlet",
			items: all.filter((source) => source.kind === "google_news"),
		},
		...SOURCE_CATEGORIES.map((category) => ({
			label: category,
			items: all.filter(
				(source) =>
					source.kind !== "google_news" && source.category === category,
			),
		})),
		{
			label: "Other outlets",
			items: all.filter((source) => source.kind === "site" && !known(source)),
		},
		{
			label: "Feeds",
			items: all.filter((source) => source.kind === "rss" && !known(source)),
		},
	];
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
					<AddSource existing={sources ?? []} onDone={() => setAdding(false)} />
				</Panel>
			)}
			{isPending ? (
				<Skeleton className="h-48" />
			) : sources?.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No sources yet.{" "}
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
