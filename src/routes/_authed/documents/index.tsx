import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { DocumentStatus } from "#/documents/DocumentStatus";
import { formatUploadedAt } from "#/documents/format";
import { useDocuments } from "#/documents/queries";
import { UploadZone } from "#/documents/UploadZone";

export const Route = createFileRoute("/_authed/documents/")({
	component: DocumentsPage,
});

function DocumentsPage() {
	const { data: documents, isPending, isError } = useDocuments();

	return (
		<main className="mx-auto max-w-5xl p-8">
			<h1 className="text-2xl font-semibold">Documents</h1>

			<div className="mt-6">
				<UploadZone />
			</div>

			{isPending && <p className="mt-6 text-muted-foreground">Loading…</p>}
			{isError && (
				<p className="mt-6 text-destructive">
					Couldn't load the documents from the api.
				</p>
			)}
			{documents?.length === 0 && (
				<p className="mt-6 text-muted-foreground">No documents yet.</p>
			)}

			{documents && documents.length > 0 && (
				<Table className="mt-6">
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Uploaded</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{documents.map((document) => (
							<TableRow key={document.id}>
								<TableCell className="font-medium">
									<Link
										to="/documents/$documentId"
										params={{ documentId: document.id }}
										className="hover:underline"
									>
										{document.filename}
									</Link>
								</TableCell>
								<TableCell>
									<DocumentStatus status={document.status} />
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatUploadedAt(document.uploaded_at)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</main>
	);
}
