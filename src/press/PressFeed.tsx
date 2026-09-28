import { Link } from "@tanstack/react-router";
import {
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
function ArticleImage({
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

function Title({ mention }: { mention: PressMention }) {
	return (
		<a
			href={mention.article.url}
			target="_blank"
			rel="noreferrer"
			className="font-medium hover:underline"
		>
			{mention.article.title}
			<ExternalLinkIcon className="ml-1 inline size-3 align-baseline text-muted-foreground" />
		</a>
	);
}

function Byline({
	mention,
	showMatter,
}: {
	mention: PressMention;
	showMatter: boolean;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
			<span className="font-medium text-foreground">
				{mention.article.outlet_name}
			</span>
			<span>·</span>
			<span>{pressDate(mention.article.published_at)}</span>
			{mention.status === "new" && (
				<span className="rounded-md border px-1.5 py-px">New</span>
			)}
			{showMatter && (
				<Link
					to="/matters/$matterId/press"
					params={{ matterId: mention.project.slug }}
					className="ml-auto hover:text-foreground"
				>
					{mention.project.name}
				</Link>
			)}
		</div>
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
				<Byline mention={mention} showMatter={showMatter} />
				<div className="mt-1.5">
					<Title mention={mention} />
				</div>
				{mention.article.excerpt && (
					<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
						{mention.article.excerpt}
					</p>
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
				<Byline mention={mention} showMatter={showMatter} />
				<Title mention={mention} />
				{mention.article.excerpt && (
					<p className="line-clamp-3 text-sm text-muted-foreground">
						{mention.article.excerpt}
					</p>
				)}
			</div>
		</Panel>
	);
}

// Articles newest first as the api sends them, with a chip per outlet to
// narrow the list down
export function PressFeed({
	mentions,
	view,
	showMatter = false,
	empty = "Nothing found yet.",
}: {
	mentions: PressMention[];
	view: PressView;
	showMatter?: boolean;
	empty?: string;
}) {
	const [outlet, setOutlet] = useState<string | null>(null);
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
		return [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
	}, [mentions]);
	const shown = outlet
		? mentions.filter((m) => m.article.outlet_slug === outlet)
		: mentions;

	if (mentions.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">{empty}</p>
		);
	}

	return (
		<div>
			{outlets.length > 1 && (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{[
						[null, { name: "All", count: mentions.length }] as const,
						...outlets,
					].map(([slug, { name, count }]) => (
						<button
							key={slug ?? "all"}
							type="button"
							aria-pressed={outlet === slug}
							onClick={() => setOutlet(slug)}
							className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground aria-pressed:border-foreground aria-pressed:text-foreground"
						>
							{name} <span className="opacity-60">{count}</span>
						</button>
					))}
				</div>
			)}
			{view === "cards" ? (
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
