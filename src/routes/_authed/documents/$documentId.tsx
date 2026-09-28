import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, QuoteIcon } from "lucide-react";
import { ApiError } from "#/api/client";
import { DeleteDocument } from "#/documents/DeleteDocument";
import { DocumentStatus } from "#/documents/DocumentStatus";
import { formatUploadedAt } from "#/documents/format";
import { useDocument, usePassage } from "#/documents/queries";
import { useProjects } from "#/matters/queries";
import { Page } from "#/shell/page";

export const Route = createFileRoute("/_authed/documents/$documentId")({
	// ?passage= is the chunk a citation in an answer pointed at
	validateSearch: (search: Record<string, unknown>): { passage?: number } => {
		const passage = Number(search.passage);
		return Number.isInteger(passage) && passage >= 0 ? { passage } : {};
	},
	component: DocumentPage,
});

function DocumentPage() {
	const { documentId } = Route.useParams();
	const { passage } = Route.useSearch();
	const { data: document, isPending, error } = useDocument(documentId);
	const { data: projects } = useProjects();

	const project = document?.project_id
		? projects?.find((candidate) => candidate.id === document.project_id)
		: undefined;

	return (
		<Page>
			<Link
				to="/documents"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" />
				Documents
			</Link>

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
						<CitedPassage documentId={documentId} chunkIndex={passage} />
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
// what the answer said about it
function CitedPassage({
	documentId,
	chunkIndex,
}: {
	documentId: string;
	chunkIndex: number;
}) {
	const { data, isPending, isError } = usePassage(documentId, chunkIndex);
	const pages =
		data?.page_start == null
			? null
			: data.page_end && data.page_end !== data.page_start
				? `Pages ${data.page_start} to ${data.page_end}`
				: `Page ${data.page_start}`;

	return (
		<figure className="mt-6 rounded-lg border-l-4 border-primary bg-muted/60 px-4 py-3">
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
				<blockquote className="text-sm leading-relaxed whitespace-pre-wrap">
					<mark className="bg-transparent text-foreground">{data.text}</mark>
				</blockquote>
			)}
		</figure>
	);
}
