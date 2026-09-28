import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseIcon, FilterIcon, PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";
import { IntakeZone } from "#/matters/IntakeZone";
import { PinButton } from "#/matters/PinButton";
import { useAllMatters } from "#/matters/queries";
import { daysUntil, formatDate, type Matter, practiceAreas } from "#/mock/data";
import { Page, PageHeader, PersonAvatar, SampleBadge } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/")({
	component: MattersPage,
});

function MattersPage() {
	const { matters, projects } = useAllMatters();
	const open = matters.filter((matter) => !matter.closed);

	const tabs = [
		{ value: "all", label: "All open", matters: open },
		...practiceAreas.map((area) => ({
			value: area,
			label: area,
			matters: open.filter((matter) => matter.area === area),
		})),
		{
			value: "closed",
			label: "Closed",
			matters: matters.filter((matter) => matter.closed),
		},
	];

	return (
		<Page>
			<PageHeader
				title="Matters"
				sample={false}
				description="Every file the firm is working on. A matter holds its documents, research, dates and notes in one place."
				actions={
					<>
						<Button variant="outline" size="sm">
							<FilterIcon /> Filter
						</Button>
						<Button size="sm">
							<PlusIcon /> New matter
						</Button>
					</>
				}
			/>

			<IntakeZone />

			{projects.isError && (
				<p className="mb-4 text-sm text-destructive">
					Couldn't load your matters from the api, only sample ones are shown.
				</p>
			)}

			<Tabs defaultValue="all">
				<div className="overflow-x-auto border-b">
					<TabsList variant="line" className="h-10!">
						{tabs.map((tab) => (
							<TabsTrigger key={tab.value} value={tab.value}>
								{tab.label}
								<span className="text-xs text-muted-foreground">
									{tab.matters.length}
								</span>
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				{tabs.map((tab) => (
					<TabsContent key={tab.value} value={tab.value} className="mt-4">
						<MatterList matters={tab.matters} loading={projects.isPending} />
					</TabsContent>
				))}
			</Tabs>
		</Page>
	);
}

function MatterList({
	matters,
	loading,
}: {
	matters: Matter[];
	loading: boolean;
}) {
	const real = matters.filter((matter) => matter.projectId);
	const sample = matters.filter((matter) => !matter.projectId);

	if (!loading && matters.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				No matters here yet.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{loading && <Skeleton className="h-[5.5rem] rounded-xl" />}
			{real.map((matter) => (
				<MatterRow key={matter.id} matter={matter} />
			))}
			{sample.length > 0 && (
				<>
					<div
						className={cn(
							"flex items-center gap-2 pb-1",
							(real.length > 0 || loading) && "pt-6",
						)}
					>
						<SampleBadge />
						<p className="text-xs text-muted-foreground">
							Made up matters, here until the firm's own fill the list
						</p>
					</div>
					{sample.map((matter) => (
						<MatterRow key={matter.id} matter={matter} />
					))}
				</>
			)}
		</div>
	);
}

function nextDateText(matter: Matter) {
	if (!matter.nextDate) return matter.closed ? "Closed" : null;
	if (matter.closed) return `Closed ${formatDate(matter.nextDate.date)}`;
	const days = daysUntil(matter.nextDate.date);
	return days === 0
		? `${matter.nextDate.label} today`
		: `${matter.nextDate.label} in ${days}d`;
}

export function MatterRow({ matter }: { matter: Matter }) {
	const next = nextDateText(matter);
	const details = [
		matter.reference,
		matter.court,
		`${matter.documents.toLocaleString("en-GB")} ${matter.documents === 1 ? "document" : "documents"}`,
	].filter(Boolean);

	return (
		// The title link stretches over the whole card, so the card reads as one
		// link while the pin button beside it stays its own control
		<div className="relative flex items-start gap-4 rounded-xl border bg-card px-4 py-3.5 hover:bg-muted/40">
			<BriefcaseIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<Link
						to="/matters/$matterId/overview"
						params={{ matterId: matter.id }}
						className="font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
					>
						{matter.title}
					</Link>
					{matter.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-md border px-1.5 py-px text-xs text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
				{matter.summary && (
					<p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
						{matter.summary}
					</p>
				)}
				<p className="mt-1.5 text-xs text-muted-foreground">
					{details.join(" · ")}
				</p>
			</div>
			<div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
				<div className="flex items-center gap-1">
					{matter.team.map((id) => (
						<PersonAvatar key={id} id={id} className="size-6 text-[0.55rem]" />
					))}
				</div>
				{next && <p className="text-xs text-muted-foreground">{next}</p>}
			</div>
			{matter.projectId && (
				<PinButton
					projectId={matter.projectId}
					pinned={Boolean(matter.pinned)}
					title={matter.title}
					className="relative -my-1 -mr-2"
				/>
			)}
		</div>
	);
}
