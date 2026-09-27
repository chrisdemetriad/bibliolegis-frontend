import { createFileRoute } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { type LibraryItem, library } from "#/mock/data";
import { LibraryList } from "#/shell/lists";
import { Page, PageHeader, Panel } from "#/shell/page";

export const Route = createFileRoute("/_authed/library")({
	component: LibraryPage,
});

const kinds: { value: LibraryItem["kind"]; label: string }[] = [
	{ value: "Judgment", label: "Judgments" },
	{ value: "Sentencing guideline", label: "Sentencing guidelines" },
	{ value: "Legislation", label: "Legislation" },
	{ value: "Precedent", label: "Firm precedents" },
];

const tabs = [
	{ value: "all", label: "All", items: library },
	...kinds.map((kind) => ({
		value: kind.value,
		label: kind.label,
		items: library.filter((item) => item.kind === kind.value),
	})),
];

const sources = [
	{
		name: "Find Case Law",
		detail: "The National Archives, free under the Open Justice Licence",
	},
	{
		name: "legislation.gov.uk",
		detail: "Acts and statutory instruments, as amended",
	},
	{
		name: "Sentencing Council",
		detail: "Definitive guidelines for every court",
	},
	{
		name: "Firm precedents",
		detail: "Harcourt Lane's own templates and past advice",
	},
];

function LibraryPage() {
	return (
		<Page>
			<PageHeader
				title="Library"
				description="Reference material shared across every matter. Judgments, guidelines and legislation from public sources, alongside the firm's own precedents."
			/>

			<label className="mb-6 flex h-11 items-center gap-2 rounded-xl border bg-card px-3 focus-within:border-ring">
				<SearchIcon className="size-4 text-muted-foreground" />
				<input
					placeholder="Search judgments, guidelines and legislation"
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				/>
			</label>

			<div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
				{sources.map((source) => (
					<Panel key={source.name} className="p-4">
						<p className="text-sm font-medium">{source.name}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{source.detail}
						</p>
					</Panel>
				))}
			</div>

			<Tabs defaultValue="all">
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
						<LibraryList items={tab.items} />
					</TabsContent>
				))}
			</Tabs>
		</Page>
	);
}
