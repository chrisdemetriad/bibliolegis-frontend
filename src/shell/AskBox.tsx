import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ArrowRightIcon,
	BriefcaseIcon,
	CircleAlertIcon,
	QuoteIcon,
	SparklesIcon,
} from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { type Citation, errorMessage, type QueryAnswer } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Panel } from "./page";

// Asks POST /query and shows the answer with every claim linked to the
// passage it came from. With a projectId only that matter's documents are
// searched, without one everything the user can see is
export function AskBox({
	placeholder,
	scope,
	projectId,
}: {
	placeholder: string;
	scope: string;
	projectId?: string;
}) {
	const api = useApi();
	const [question, setQuestion] = useState("");
	const ask = useMutation({
		mutationFn: (text: string) => api.query(text, projectId),
	});

	const submit = () => {
		const text = question.trim() || placeholder;
		if (!ask.isPending) ask.mutate(text);
	};

	return (
		<div className="space-y-3">
			<Panel className="p-4 focus-within:border-ring">
				<textarea
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							submit();
						}
					}}
					rows={2}
					placeholder={placeholder}
					aria-label={`Ask about ${scope}`}
					className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground"
				/>
				<div className="mt-2 flex items-center gap-3">
					<p className="flex-1 text-xs text-muted-foreground">
						Answers come only from the documents you can see, and every claim
						links to where it came from.
					</p>
					<kbd className="rounded border px-1 text-[0.7rem] text-muted-foreground max-sm:hidden">
						⌘↵
					</kbd>
					<Button size="sm" onClick={submit} disabled={ask.isPending}>
						Ask <ArrowRightIcon />
					</Button>
				</div>
			</Panel>

			{ask.isPending && (
				<Panel className="space-y-3 p-4" aria-busy="true">
					<Question text={ask.variables} />
					<p className="text-xs text-muted-foreground">
						Reading the documents…
					</p>
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-2/3" />
				</Panel>
			)}

			{ask.isError && (
				<Panel className="flex items-start gap-2 p-4 text-sm" role="alert">
					<CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
					<p>{errorMessage(ask.error, "Couldn't get an answer, try again.")}</p>
				</Panel>
			)}

			{ask.isSuccess && <Answer question={ask.variables} answer={ask.data} />}
		</div>
	);
}

function Question({ text }: { text: string }) {
	return (
		<div className="flex items-center gap-2 text-sm font-medium">
			<SparklesIcon className="size-4 shrink-0" />
			{text}
		</div>
	);
}

function Answer({
	question,
	answer,
}: {
	question: string;
	answer: QueryAnswer;
}) {
	const byNumber = new Map(
		answer.citations.map((citation) => [citation.number, citation]),
	);

	return (
		<Panel className="p-4" aria-live="polite">
			<Question text={question} />
			<div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
				{blocks(answer.answer).map((block) =>
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

			{answer.citations.length > 0 && (
				<ol className="mt-4 space-y-2">
					{answer.citations.map((citation) => (
						<Source key={citation.number} citation={citation} />
					))}
				</ol>
			)}

			<p className="mt-3 text-xs text-muted-foreground">
				Answered by {answer.model}
			</p>
		</Panel>
	);
}

type Block = { key: string; kind: "list" | "paragraph"; lines: string[] };

// The model is asked for plain paragraphs and dash lists, nothing else, so
// that's all this reads. Anything else comes through as a paragraph
function blocks(text: string): Block[] {
	const out: Block[] = [];
	for (const [i, chunk] of text.split(/\n\s*\n/).entries()) {
		const lines = chunk
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		if (lines.length === 0) continue;
		if (lines.every((line) => /^[-•*]\s/.test(line))) {
			out.push({
				key: `${i}`,
				kind: "list",
				lines: lines.map((line) => line.replace(/^[-•*]\s+/, "")),
			});
		} else {
			out.push({ key: `${i}`, kind: "paragraph", lines: [lines.join(" ")] });
		}
	}
	return out;
}

// Turns each [3] in the answer into a link to the passage it cites. A number
// the api didn't return a citation for is left out rather than shown as a
// link to nothing
function withCitations(text: string, byNumber: Map<number, Citation>) {
	const parts: ReactNode[] = [];
	for (const [i, part] of text.split(/(\[\d+\])/).entries()) {
		const match = /^\[(\d+)\]$/.exec(part);
		if (!match) {
			parts.push(<Fragment key={i}>{part}</Fragment>);
			continue;
		}
		const citation = byNumber.get(Number(match[1]));
		if (!citation) continue;
		parts.push(
			<sup key={i} className="px-0.5">
				<Link
					to="/documents/$documentId"
					params={{ documentId: citation.document_id }}
					search={{ passage: citation.chunk_index ?? undefined }}
					title={`${citation.filename}${pages(citation)}`}
					className="font-medium text-muted-foreground hover:text-foreground hover:underline"
				>
					{citation.number}
				</Link>
			</sup>,
		);
	}
	return parts;
}

function pages(citation: Pick<Citation, "page_start" | "page_end">) {
	if (citation.page_start == null) return "";
	return citation.page_end && citation.page_end !== citation.page_start
		? `, pp. ${citation.page_start} to ${citation.page_end}`
		: `, p. ${citation.page_start}`;
}

function Source({ citation }: { citation: Citation }) {
	return (
		<li className="rounded-lg bg-muted px-3 py-2 text-xs">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<QuoteIcon className="size-3 shrink-0 text-muted-foreground" />
				<span className="font-medium">{citation.number}.</span>
				<Link
					to="/documents/$documentId"
					params={{ documentId: citation.document_id }}
					search={{ passage: citation.chunk_index ?? undefined }}
					className="font-medium hover:underline"
				>
					{citation.filename}
					{pages(citation)}
				</Link>
				{citation.project_slug && (
					<Link
						to="/matters/$matterId/overview"
						params={{ matterId: citation.project_slug }}
						className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
					>
						<BriefcaseIcon className="size-3" />
						{citation.project_name}
					</Link>
				)}
			</div>
			<p className="mt-1 line-clamp-2 text-muted-foreground">{citation.text}</p>
		</li>
	);
}
