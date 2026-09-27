import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	type PressItem,
	type PressSource,
	press,
	pressSchedule,
	pressSources,
} from "#/mock/data";
import { PressList } from "#/shell/lists";
import { Page, PageHeader, Panel, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/press")({
	component: PressPage,
});

const abouts: PressItem["about"][] = [
	"Our matter",
	"Our client",
	"Other side",
	"Sector",
];

const tabs = [
	{ value: "all", label: "All", items: press },
	...abouts.map((about) => ({
		value: about,
		label: about,
		items: press.filter((item) => item.about === about),
	})),
];

const kinds: PressSource["kind"][] = [
	"Wire",
	"Broadcaster",
	"National",
	"Business",
	"Legal",
	"Local",
];

function PressPage() {
	return (
		<Page className="max-w-6xl">
			<PageHeader
				title="Press"
				description="News about your matters, your clients and the people on the other side. Every source on the right is searched on a schedule for the parties, case names and references of every open matter."
				actions={
					<Button variant="outline" size="sm">
						<RefreshCwIcon /> Search now
					</Button>
				}
			/>

			<div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
				<Tabs defaultValue="all" className="min-w-0">
					<div className="overflow-x-auto border-b">
						<TabsList variant="line" className="h-10!">
							{tabs.map((tab) => (
								<TabsTrigger key={tab.value} value={tab.value}>
									{tab.label}
									<span className="text-xs text-muted-foreground">
										{tab.items.length}
									</span>
								</TabsTrigger>
							))}
						</TabsList>
					</div>
					{tabs.map((tab) => (
						<TabsContent key={tab.value} value={tab.value} className="mt-4">
							<PressList items={tab.items} />
						</TabsContent>
					))}
				</Tabs>

				<aside className="space-y-6">
					<Panel className="p-4 text-sm">
						<p className="font-medium">{pressSchedule.every}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Last searched {pressSchedule.lastRun}. Next{" "}
							{pressSchedule.nextRun}.
						</p>
					</Panel>
					<Sources />
				</aside>
			</div>
		</Page>
	);
}

// The switches only change local state for now. Once the search exists they
// save which sources the firm wants read
function Sources() {
	const [on, setOn] = useState(
		() => new Set(pressSources.filter((s) => s.on).map((s) => s.name)),
	);

	const toggle = (name: string) =>
		setOn((current) => {
			const next = new Set(current);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});

	return (
		<section>
			<SectionTitle
				action={
					<Button variant="ghost" size="xs">
						<PlusIcon /> Add
					</Button>
				}
			>
				Sources
				<span className="ml-1.5 font-normal text-muted-foreground">
					{on.size} of {pressSources.length}
				</span>
			</SectionTitle>
			<div className="space-y-4">
				{kinds.map((kind) => (
					<div key={kind}>
						<p className="mb-1 text-xs text-muted-foreground">{kind}</p>
						<Panel className="divide-y">
							{pressSources
								.filter((source) => source.kind === kind)
								.map((source) => (
									<div
										key={source.name}
										className="flex items-center gap-3 px-3 py-2"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm">{source.name}</p>
											<p className="truncate text-xs text-muted-foreground">
												{source.domain}
												{source.found > 0 && ` · ${source.found} found`}
											</p>
										</div>
										<button
											type="button"
											role="switch"
											aria-checked={on.has(source.name)}
											aria-label={`Search ${source.name}`}
											onClick={() => toggle(source.name)}
											className="relative h-5 w-9 shrink-0 rounded-full bg-input transition-colors aria-checked:bg-primary"
										>
											<span
												className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform ${on.has(source.name) ? "translate-x-4" : ""}`}
											/>
										</button>
									</div>
								))}
						</Panel>
					</div>
				))}
			</div>
		</section>
	);
}
