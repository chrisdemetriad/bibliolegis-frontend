import { Link } from "@tanstack/react-router";
import {
	BookmarkCheckIcon,
	ExternalLinkIcon,
	LayoutGridIcon,
	ListIcon,
	NewspaperIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { PressMention } from "#/api/client";
import { cn } from "#/lib/utils";
import { Panel } from "#/shell/page";

export type PressView = "list" | "cards";

// "14 Sep 2026", the way dates are written everywhere else in the app
export function pressDate(iso: string | null | undefined) {
	if (!iso) return "Date unknown";
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function ViewToggle({
	view,
	onChange,
}: {
	view: PressView;
	onChange: (view: PressView) => void;
}) {
	const options = [
		{ value: "list", label: "List", Icon: ListIcon },
		{ value: "cards", label: "Cards", Icon: LayoutGridIcon },
	] as const;
	return (
		<div className="inline-flex rounded-md border p-0.5">
			{options.map(({ value, label, Icon }) => (
				<button
					key={value}
					type="button"
					aria-pressed={view === value}
					aria-label={label}
					title={label}
					onClick={() => onChange(value)}
					className="rounded-sm p-1 text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
				>
					<Icon className="size-4" />
				</button>
			))}
		</div>
	);
}

// Outlets' own pictures, loaded from their servers. no-referrer because some
// image hosts refuse a request that says it came from somewhere else, and a
// broken image falls back to the placeholder rather than a torn icon
export function ArticleImage({
	src,
	className,
}: {
	src: string | null | undefined;
	className?: string;
}) {
	const [broken, setBroken] = useState(false);
	if (!src || broken) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted text-muted-foreground",
					className,
				)}
			>
				<NewspaperIcon className="size-5" />
			</div>
		);
	}
	return (
		<img
			src={src}
			alt=""
			loading="lazy"
			referrerPolicy="no-referrer"
			onError={() => setBroken(true)}
			className={cn("bg-muted object-cover", className)}
		/>
	);
}

// The headline opens our page for the article, the icon goes straight to the
// outlet's
function Title({ mention }: { mention: PressMention }) {
	const { article, project } = mention;
	return (
		<span>
			<Link
				to="/matters/$matterId/press/$outlet/$slug"
				params={{
					matterId: project.slug,
					outlet: article.outlet_slug,
					slug: article.slug,
				}}
				className="font-medium hover:underline"
			>
				{article.title}
			</Link>
			<a
				href={article.url}
				target="_blank"
				rel="noreferrer"
				aria-label={`Open on ${article.outlet_name}`}
				title={`Open on ${article.outlet_name}`}
				className="ml-1 inline-block align-baseline text-muted-foreground hover:text-foreground"
			>
				<ExternalLinkIcon className="size-3" />
			</a>
		</span>
	);
}

function Byline({ mention }: { mention: PressMention }) {
	return (
		<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
			<span className="font-medium text-foreground">
				{mention.article.outlet_name}
			</span>
			<span>·</span>
			<span>{pressDate(mention.article.published_at)}</span>
			<span>·</span>
			<span title="When it was put on the matter">
				Added {pressDate(mention.created_at)}
			</span>
			{mention.status === "new" && (
				<span className="rounded-md border px-1.5 py-px">New</span>
			)}
			{mention.status === "kept" && (
				<span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-foreground">
					<BookmarkCheckIcon className="size-3" /> Kept
				</span>
			)}
		</div>
	);
}

// Which matter an article is on, for lists that cover more than one
function MatterLink({ mention }: { mention: PressMention }) {
	return (
		<Link
			to="/matters/$matterId/press"
			params={{ matterId: mention.project.slug }}
			className="text-xs text-muted-foreground hover:text-foreground"
		>
			{mention.project.name}
		</Link>
	);
}

function ListItem({
	mention,
	showMatter,
}: {
	mention: PressMention;
	showMatter: boolean;
}) {
	return (
		<Panel className="flex gap-4 px-4 py-3.5">
			<div className="min-w-0 flex-1">
				<Byline mention={mention} />
				<div className="mt-1.5">
					<Title mention={mention} />
				</div>
				{mention.article.excerpt && (
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{mention.article.excerpt}
					</p>
				)}
				{showMatter && (
					<div className="mt-2">
						<MatterLink mention={mention} />
					</div>
				)}
			</div>
			<ArticleImage
				src={mention.article.image_url}
				className="hidden aspect-[4/3] w-28 shrink-0 rounded-md sm:flex"
			/>
		</Panel>
	);
}

function Card({
	mention,
	showMatter,
}: {
	mention: PressMention;
	showMatter: boolean;
}) {
	return (
		<Panel className="flex flex-col overflow-hidden">
			<ArticleImage
				src={mention.article.image_url}
				className="aspect-video w-full"
			/>
			<div className="flex flex-1 flex-col gap-1.5 p-4">
				<Byline mention={mention} />
				<Title mention={mention} />
				{mention.article.excerpt && (
					<p className="line-clamp-3 text-sm text-muted-foreground">
						{mention.article.excerpt}
					</p>
				)}
				{showMatter && (
					<div className="mt-auto pt-1">
						<MatterLink mention={mention} />
					</div>
				)}
			</div>
		</Panel>
	);
}

export type PressSort = "added" | "published" | "oldest";

// Kept in the address so going into an article and back, or sharing the
// link, keeps them. Defaults aren't written out
export type PressFilters = {
	sort?: "published" | "oldest";
	outlet?: string;
	from?: string;
	to?: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function validatePressFilters(
	search: Record<string, unknown>,
): PressFilters {
	const text = (value: unknown) =>
		typeof value === "string" && value ? value : undefined;
	const day = (value: unknown) =>
		typeof value === "string" && DAY.test(value) ? value : undefined;
	return {
		...(search.sort === "published" || search.sort === "oldest"
			? { sort: search.sort }
			: {}),
		...(text(search.outlet) ? { outlet: text(search.outlet) } : {}),
		...(day(search.from) ? { from: day(search.from) } : {}),
		...(day(search.to) ? { to: day(search.to) } : {}),
	};
}

const SORTS: { value: PressSort; label: string }[] = [
	{ value: "added", label: "Date added" },
	{ value: "published", label: "Article date, newest" },
	{ value: "oldest", label: "Article date, oldest" },
];

// The day in the reader's own time zone, as YYYY-MM-DD so it compares with a
// date input's value as text
function localDay(iso: string) {
	return new Date(iso).toLocaleDateString("en-CA");
}

function byDate(
	field: (m: PressMention) => string | null,
	newestFirst: boolean,
) {
	// Undated last whichever way round
	return (a: PressMention, b: PressMention) => {
		const x = field(a);
		const y = field(b);
		if (!x || !y) return x ? -1 : y ? 1 : 0;
		return newestFirst ? y.localeCompare(x) : x.localeCompare(y);
	};
}

const selectClass =
	"h-8 rounded-md border bg-background px-2 text-sm text-foreground";

function FilterBar({
	filters,
	onChange,
	outlets,
	total,
}: {
	filters: PressFilters;
	onChange: (filters: PressFilters) => void;
	outlets: [string, { name: string; count: number }][];
	total: number;
}) {
	const sort: PressSort = filters.sort ?? "added";
	const set = (next: Partial<PressFilters>) =>
		onChange({ ...filters, ...next });
	const filtered = Boolean(filters.outlet || filters.from || filters.to);
	return (
		<div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
			<select
				aria-label="Sort by"
				value={sort}
				onChange={(event) => {
					const value = event.target.value as PressSort;
					set({ sort: value === "added" ? undefined : value });
				}}
				className={selectClass}
			>
				{SORTS.map(({ value, label }) => (
					<option key={value} value={value}>
						{label}
					</option>
				))}
			</select>
			<select
				aria-label="Publication"
				value={filters.outlet ?? ""}
				onChange={(event) => set({ outlet: event.target.value || undefined })}
				className={cn(selectClass, "max-w-56")}
			>
				<option value="">All publications ({total})</option>
				{outlets.map(([slug, { name, count }]) => (
					<option key={slug} value={slug}>
						{name} ({count})
					</option>
				))}
			</select>
			<span className="text-muted-foreground">
				{sort === "added" ? "Added" : "Published"} from
			</span>
			<input
				type="date"
				aria-label="From"
				value={filters.from ?? ""}
				max={filters.to}
				onChange={(event) => set({ from: event.target.value || undefined })}
				className={selectClass}
			/>
			<span className="text-muted-foreground">to</span>
			<input
				type="date"
				aria-label="To"
				value={filters.to ?? ""}
				min={filters.from}
				onChange={(event) => set({ to: event.target.value || undefined })}
				className={selectClass}
			/>
			{filtered && (
				<button
					type="button"
					onClick={() => onChange(filters.sort ? { sort: filters.sort } : {})}
					className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
				>
					Clear filters
				</button>
			)}
		</div>
	);
}

// Newest added first unless asked otherwise, narrowed by publication and a
// date range. The range is on whichever date the list is sorted by
export function PressFeed({
	mentions,
	view,
	filters,
	onFiltersChange,
	showMatter = false,
	empty = "Nothing found yet.",
}: {
	mentions: PressMention[];
	view: PressView;
	filters: PressFilters;
	onFiltersChange: (filters: PressFilters) => void;
	showMatter?: boolean;
	empty?: string;
}) {
	const outlets = useMemo(() => {
		const counts = new Map<string, { name: string; count: number }>();
		for (const { article } of mentions) {
			const entry = counts.get(article.outlet_slug);
			if (entry) entry.count += 1;
			else
				counts.set(article.outlet_slug, {
					name: article.outlet_name,
					count: 1,
				});
		}
		return [...counts.entries()].sort(
			(a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name),
		);
	}, [mentions]);

	const shown = useMemo(() => {
		const sort: PressSort = filters.sort ?? "added";
		const date = (m: PressMention) =>
			sort === "added" ? m.created_at : m.article.published_at;
		return mentions
			.filter((m) => {
				if (filters.outlet && m.article.outlet_slug !== filters.outlet)
					return false;
				if (!filters.from && !filters.to) return true;
				const when = date(m);
				// An undated article can't be said to fall inside a range
				if (!when) return false;
				const day = localDay(when);
				return (
					(!filters.from || day >= filters.from) &&
					(!filters.to || day <= filters.to)
				);
			})
			.sort(byDate(date, sort !== "oldest"));
	}, [mentions, filters]);

	if (mentions.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">{empty}</p>
		);
	}

	return (
		<div>
			<FilterBar
				filters={filters}
				onChange={onFiltersChange}
				outlets={outlets}
				total={mentions.length}
			/>
			{shown.length === 0 ? (
				<p className="py-12 text-center text-sm text-muted-foreground">
					Nothing matches these filters.
				</p>
			) : view === "cards" ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{shown.map((mention) => (
						<Card key={mention.id} mention={mention} showMatter={showMatter} />
					))}
				</div>
			) : (
				<div className="space-y-2">
					{shown.map((mention) => (
						<ListItem
							key={mention.id}
							mention={mention}
							showMatter={showMatter}
						/>
					))}
				</div>
			)}
		</div>
	);
}
