import {
	createFileRoute,
	Link,
	useCanGoBack,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeftIcon, QuoteIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { ApiError } from "#/api/client";
import { DeleteDocument } from "#/documents/DeleteDocument";
import { DocumentStatus } from "#/documents/DocumentStatus";
import { formatUploadedAt } from "#/documents/format";
import { useDocument, usePassage } from "#/documents/queries";
import { useProjects } from "#/matters/queries";
import { Highlighted } from "#/shell/excerpt";
import { Page } from "#/shell/page";

export const Route = createFileRoute("/_authed/documents/$documentId")({
	// ?passage= is the chunk a citation in an answer pointed at and
	// ?highlight= the words in it the answer rests on, space separated
	validateSearch: (
		search: Record<string, unknown>,
	): { passage?: number; highlight?: string } => {
		const passage = Number(search.passage);
		const highlight =
			typeof search.highlight === "string" && search.highlight.trim()
				? search.highlight.trim()
				: undefined;
		return Number.isInteger(passage) && passage >= 0
			? { passage, highlight }
			: {};
	},
	component: DocumentPage,
});

function DocumentPage() {
	const { documentId } = Route.useParams();
	const { passage, highlight } = Route.useSearch();
	const { data: document, isPending, error } = useDocument(documentId);
	const { data: projects } = useProjects();
	const router = useRouter();
	const canGoBack = useCanGoBack();

	const project = document?.project_id
		? projects?.find((candidate) => candidate.id === document.project_id)
		: undefined;

	return (
		<Page>
			{/* Back rather than a link, so a citation followed from an answer
			returns to the page with that answer still showing. Opened
			straight from an address there's nothing to go back to, so it
			goes to the document's matter instead */}
			{canGoBack ? (
				<button
					type="button"
					onClick={() => router.history.back()}
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftIcon className="size-4" />
					Back to overview
				</button>
			) : (
				<Link
					to={project ? "/matters/$matterId/overview" : "/overview"}
					params={project ? { matterId: project.slug } : {}}
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftIcon className="size-4" />
					Back to overview
				</Link>
			)}

			{isPending && <p className="mt-6 text-muted-foreground">Loading…</p>}
			{error && (
				<p className="mt-6 text-destructive">
					{error instanceof ApiError && error.status === 404
						? "This document doesn't exist, or you don't have access to it."
						: "Couldn't load this document from the api."}
				</p>
			)}

			{document && (
				<>
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<h1 className="text-2xl font-semibold break-all">
							{document.filename}
						</h1>
						<DocumentStatus status={document.status} />
						<div className="ml-auto">
							<DeleteDocument document={document} />
						</div>
					</div>

					{document.status === "failed" && (
						<div
							role="alert"
							className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
						>
							<p className="font-medium text-destructive">
								This document couldn't be read
							</p>
							<p className="mt-1">
								{document.error_message ?? "The api didn't record a reason."}
							</p>
						</div>
					)}
					{(document.status === "pending" ||
						document.status === "processing") && (
						<p className="mt-6 text-sm text-muted-foreground">
							Still being read. This page updates by itself when it's done.
						</p>
					)}

					{passage !== undefined && (
						<CitedPassage
							documentId={documentId}
							chunkIndex={passage}
							highlight={highlight?.split(" ") ?? []}
						/>
					)}

					<dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
						<dt className="text-muted-foreground">Uploaded</dt>
						<dd>{formatUploadedAt(document.uploaded_at)}</dd>
						<dt className="text-muted-foreground">Visible to</dt>
						<dd>
							{!document.project_id ? (
								"Whole firm"
							) : project ? (
								<Link
									to="/matters/$matterId/overview"
									params={{ matterId: project.slug }}
									className="underline underline-offset-2 hover:text-muted-foreground"
								>
									{project.name}
								</Link>
							) : (
								"A matter you belong to"
							)}
						</dd>
					</dl>
				</>
			)}
		</Page>
	);
}

// The passage an answer cited, quoted in full so it can be checked against
// what the answer said about it. A long passage puts the words the answer
// rested on well below the fold, so the first of them is scrolled to
function CitedPassage({
	documentId,
	chunkIndex,
	highlight,
}: {
	documentId: string;
	chunkIndex: number;
	highlight: string[];
}) {
	const { data, isPending, isError } = usePassage(documentId, chunkIndex);
	const quote = useRef<HTMLQuoteElement>(null);
	useEffect(() => {
		if (data)
			quote.current
				?.querySelector("mark")
				?.scrollIntoView({ block: "center", behavior: "smooth" });
	}, [data]);
	const pages =
		data?.page_start == null
			? null
			: data.page_end && data.page_end !== data.page_start
				? `Pages ${data.page_start} to ${data.page_end}`
				: `Page ${data.page_start}`;

	return (
		<figure className="mt-6 rounded-lg border-l-4 border-foreground/25 bg-muted/60 px-4 py-3">
			<figcaption className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
				<QuoteIcon className="size-3" />
				The passage the answer cited{pages && `, ${pages.toLowerCase()}`}
			</figcaption>
			{isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
			{isError && (
				<p className="text-sm text-destructive">
					Couldn't load the passage. The document may have been read again since
					the answer was written.
				</p>
			)}
			{data && (
				<blockquote
					ref={quote}
					className="text-sm leading-relaxed whitespace-pre-wrap"
				>
					<Highlighted text={data.text} terms={highlight} />
				</blockquote>
			)}
		</figure>
	);
}
