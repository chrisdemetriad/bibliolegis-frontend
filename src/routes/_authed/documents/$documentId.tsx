import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { ApiError } from "#/api/client";
import { DeleteDocument } from "#/documents/DeleteDocument";
import { DocumentStatus } from "#/documents/DocumentStatus";
import { formatUploadedAt } from "#/documents/format";
import { useDocument } from "#/documents/queries";
import { useProjects } from "#/matters/queries";
import { Page } from "#/shell/page";

export const Route = createFileRoute("/_authed/documents/$documentId")({
	component: DocumentPage,
});

function DocumentPage() {
	const { documentId } = Route.useParams();
	const { data: document, isPending, error } = useDocument(documentId);
	const { data: projects } = useProjects();

	const matter = document?.project_id
		? (projects?.find((project) => project.id === document.project_id)?.name ??
			"A matter you belong to")
		: "Whole firm";

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

					<dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
						<dt className="text-muted-foreground">Uploaded</dt>
						<dd>{formatUploadedAt(document.uploaded_at)}</dd>
						<dt className="text-muted-foreground">Visible to</dt>
						<dd>{matter}</dd>
					</dl>
				</>
			)}
		</Page>
	);
}
