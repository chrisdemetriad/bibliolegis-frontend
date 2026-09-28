import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Activity } from "#/api/client";
import { updatedAgo } from "#/matters/adapt";
import { Panel } from "#/shell/page";

function initials(name: string) {
	const parts = name.split(/[\s@.]+/).filter(Boolean);
	return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// One entry as a sentence. The api folds a run of the same thing into one
// entry, so count says whether it's one file or several
function describe(item: Activity, withMatter: boolean): ReactNode {
	const documentLabel =
		item.count > 1 ? (
			<span className="font-medium">{item.count} files</span>
		) : item.document ? (
			item.document.exists ? (
				<Link
					to="/documents/$documentId"
					params={{ documentId: item.document.id }}
					className="font-medium hover:underline"
				>
					{item.document.filename}
				</Link>
			) : (
				<span className="font-medium">{item.document.filename}</span>
			)
		) : (
			<span className="font-medium">a document</span>
		);
	const matter =
		withMatter && item.matter ? (
			<Link
				to="/matters/$matterId/overview"
				params={{ matterId: item.matter.slug }}
				className="font-medium hover:underline"
			>
				{item.matter.name}
			</Link>
		) : null;
	const muted = (text: string) => (
		<span className="text-muted-foreground">{text}</span>
	);

	switch (item.action) {
		case "document_uploaded":
			return (
				<>
					{muted("uploaded")} {documentLabel}
					{matter && (
						<>
							{" "}
							{muted("to")} {matter}
						</>
					)}
				</>
			);
		case "document_read":
			return (
				<>
					{muted("finished reading")} {documentLabel}
					{item.pages ? muted(`, ${item.pages} pages`) : null}
					{matter && (
						<>
							{" "}
							{muted("in")} {matter}
						</>
					)}
				</>
			);
		case "document_deleted":
			return (
				<>
					{muted("deleted")} {documentLabel}
					{matter && (
						<>
							{" "}
							{muted("from")} {matter}
						</>
					)}
				</>
			);
		case "matter_opened":
			return matter ? (
				<>
					{muted("opened a new matter,")} {matter}
				</>
			) : (
				muted("opened this matter from the files dropped in")
			);
		default:
			return muted(item.action.replaceAll("_", " "));
	}
}

export function ActivityFeed({
	items,
	withMatter = true,
}: {
	items: Activity[];
	// Off on a matter's own page, where naming the matter every line is noise
	withMatter?: boolean;
}) {
	return (
		<Panel className="divide-y">
			{items.map((item) => {
				const name = item.actor?.name ?? "Bibliolegis";
				return (
					<div key={item.id} className="flex items-start gap-3 px-4 py-3">
						<span
							title={name}
							className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-[0.65rem] font-medium text-muted-foreground"
						>
							{item.actor ? initials(name) : "BL"}
						</span>
						<p className="flex-1 text-sm leading-relaxed">
							<span className="font-medium">{name}</span>{" "}
							{describe(item, withMatter)}
						</p>
						<time
							dateTime={item.created_at}
							className="shrink-0 text-xs text-muted-foreground"
						>
							{updatedAgo(item.created_at)}
						</time>
					</div>
				);
			})}
		</Panel>
	);
}
