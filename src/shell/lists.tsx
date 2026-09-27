import { Link } from "@tanstack/react-router";
import { BookmarkIcon, ExternalLinkIcon } from "lucide-react";
import { findMatter, type LibraryItem, type PressItem } from "#/mock/data";
import { Panel } from "./page";

// Dates are written the way they're shown, "27 Sep 2026", which Date parses
const newestFirst = (a: PressItem, b: PressItem) =>
	new Date(b.date).getTime() - new Date(a.date).getTime();

export function PressList({
	items,
	showMatter = true,
}: {
	items: PressItem[];
	showMatter?: boolean;
}) {
	if (items.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				Nothing found yet.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{[...items].sort(newestFirst).map((item) => {
				const matter = item.matterId && findMatter(item.matterId);
				return (
					<Panel key={item.title} className="px-4 py-3.5">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span className="font-medium text-foreground">{item.source}</span>
							<span>·</span>
							<span>{item.date}</span>
							<span className="ml-auto rounded-md border px-1.5 py-px">
								{item.about}
							</span>
						</div>
						<a
							href="#press"
							className="mt-1.5 flex items-start gap-1.5 font-medium hover:underline"
						>
							{item.title}
							<ExternalLinkIcon className="mt-1 size-3 shrink-0 text-muted-foreground" />
						</a>
						<p className="mt-1 text-sm text-muted-foreground">{item.snippet}</p>
						{showMatter && matter && (
							<Link
								to="/matters/$matterId/press"
								params={{ matterId: matter.id }}
								className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground"
							>
								{matter.title}
							</Link>
						)}
					</Panel>
				);
			})}
		</div>
	);
}

const treatmentStyle: Record<string, string> = {
	"Good law": "text-muted-foreground",
	Questioned: "border-warning-border bg-warning text-warning-foreground",
	Distinguished: "border-warning-border bg-warning text-warning-foreground",
};

export function LibraryList({ items }: { items: LibraryItem[] }) {
	if (items.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				Nothing saved yet.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{items.map((item) => (
				<Panel key={item.title} className="flex gap-3 px-4 py-3.5">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<p className="font-medium">{item.title}</p>
							<span className="text-sm text-muted-foreground">
								{item.citation}
							</span>
						</div>
						<p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
						<p className="mt-2 text-xs text-muted-foreground">
							{item.court} · {item.date} · from {item.source}
							{item.usedIn.length > 0 &&
								` · cited in ${item.usedIn.length} ${item.usedIn.length === 1 ? "matter" : "matters"}`}
						</p>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-2">
						{item.treatment && (
							<span
								className={`rounded-md border px-1.5 py-px text-xs ${treatmentStyle[item.treatment]}`}
							>
								{item.treatment}
							</span>
						)}
						<BookmarkIcon className="size-4 text-muted-foreground" />
					</div>
				</Panel>
			))}
		</div>
	);
}
