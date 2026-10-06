import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseIcon, FlagIcon } from "lucide-react";
import type { Citation, QueryHistoryItem } from "#/api/client";
import { useQueryHistory } from "#/history/queries";
import { updatedAgo } from "#/matters/adapt";
import { blocks, Source, withCitations } from "#/shell/AskBox";
import { Page, PageHeader, Panel } from "#/shell/page";

export const Route = createFileRoute("/_authed/history")({
	component: HistoryPage,
});

function HistoryPage() {
	const { data, isPending, isError } = useQueryHistory();

	return (
		<Page>
			<PageHeader
				title="Query history"
				description="Your own past questions and the answers they got. Nobody else sees this."
				sample={false}
			/>

			{isPending && <p className="text-muted-foreground">Loading…</p>}
			{isError && (
				<p className="text-destructive">
					Couldn't load your query history from the api.
				</p>
			)}
			{data?.length === 0 && (
				<p className="text-muted-foreground">
					Questions you ask will show up here.
				</p>
			)}

			<div className="space-y-4">
				{data?.map((item) => (
					<HistoryEntry key={item.id} item={item} />
				))}
			</div>
		</Page>
	);
}

function HistoryEntry({ item }: { item: QueryHistoryItem }) {
	const byNumber = new Map<number, Citation>(
		item.citations.map((citation) => [citation.number, citation]),
	);

	return (
		<Panel className="p-4">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<p className="text-sm font-medium">{item.question}</p>
				<time
					dateTime={item.created_at}
					className="shrink-0 text-xs text-muted-foreground"
				>
					{updatedAgo(item.created_at)}
				</time>
			</div>

			<div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
				{blocks(item.answer).map((block) =>
					block.kind === "list" ? (
						<ul key={block.key} className="list-disc space-y-1 pl-5">
							{block.lines.map((line) => (
								<li key={line}>{withCitations(line, byNumber)}</li>
							))}
						</ul>
					) : (
						<p key={block.key}>{withCitations(block.lines[0], byNumber)}</p>
					),
				)}
			</div>

			{item.citations.length > 0 && (
				<ol className="mt-4 space-y-2">
					{item.citations.map((citation) => (
						<Source key={citation.number} citation={citation} />
					))}
				</ol>
			)}

			<div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
				<span>Answered by {item.model}</span>
				{item.project && (
					<Link
						to="/matters/$matterId/overview"
						params={{ matterId: item.project.slug }}
						className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
					>
						<BriefcaseIcon className="size-3" />
						{item.project.name}
					</Link>
				)}
				{item.flagged && (
					<span className="inline-flex items-center gap-1 text-warning-foreground">
						<FlagIcon className="size-3" />
						Some lines here don't cite a source
					</span>
				)}
			</div>
		</Panel>
	);
}
