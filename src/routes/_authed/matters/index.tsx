import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseIcon, FilterIcon, PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	daysUntil,
	formatDate,
	type Matter,
	matters,
	practiceAreas,
} from "#/mock/data";
import { Page, PageHeader, PersonAvatar } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/")({
	component: MattersPage,
});

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

function MattersPage() {
	return (
		<Page>
			<PageHeader
				title="Matters"
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
						{tab.matters.length === 0 ? (
							<p className="py-12 text-center text-sm text-muted-foreground">
								No matters here yet.
							</p>
						) : (
							<div className="space-y-2">
								{tab.matters.map((matter) => (
									<MatterRow key={matter.id} matter={matter} />
								))}
							</div>
						)}
					</TabsContent>
				))}
			</Tabs>
		</Page>
	);
}

function MatterRow({ matter }: { matter: Matter }) {
	const days = daysUntil(matter.nextDate.date);

	return (
		<Link
			to="/matters/$matterId/overview"
			params={{ matterId: matter.id }}
			className="flex items-start gap-4 rounded-xl border bg-card px-4 py-3.5 hover:bg-muted/40"
		>
			<BriefcaseIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<p className="font-medium">{matter.title}</p>
					{matter.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-md border px-1.5 py-px text-xs text-muted-foreground"
						>
							{tag}
						</span>
					))}
				</div>
				<p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
					{matter.summary}
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground">
					{matter.reference} · {matter.court} ·{" "}
					{matter.documents.toLocaleString("en-GB")} documents
				</p>
			</div>
			<div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
				<div className="flex gap-1">
					{matter.team.map((id) => (
						<PersonAvatar key={id} id={id} className="size-6 text-[0.55rem]" />
					))}
				</div>
				<p className="text-xs text-muted-foreground">
					{matter.closed
						? `Closed ${formatDate(matter.nextDate.date)}`
						: `${matter.nextDate.label} in ${days}d`}
				</p>
			</div>
		</Link>
	);
}
