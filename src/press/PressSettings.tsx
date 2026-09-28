import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	errorMessage,
	type PressSource,
	type PressSourceCreate,
	type PressTerms,
} from "#/api/client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Panel, SectionTitle } from "#/shell/page";
import { OUTLETS } from "./outlets";
import { pressDate } from "./PressFeed";
import {
	useAddPressSource,
	useDeletePressSource,
	usePressSources,
	usePressTerms,
	useSetPressTerms,
	useUpdatePressSource,
} from "./queries";
import { Switch } from "./Switch";

const termKinds = [
	{
		kind: "watch",
		title: "Watching for",
		help: "Any one of these finds an article.",
	},
	{
		kind: "require",
		title: "Must also mention",
		help: "If set, an article needs one of these too. Narrows a common name.",
	},
	{
		kind: "exclude",
		title: "Leave out",
		help: "An article mentioning any of these is skipped.",
	},
] as const;

function TermGroup({
	title,
	help,
	terms,
	note,
	onChange,
	saving,
}: {
	title: string;
	help: string;
	terms: string[];
	note?: string;
	onChange: (terms: string[]) => void;
	saving: boolean;
}) {
	const [draft, setDraft] = useState("");
	return (
		<div>
			<p className="text-xs font-medium">{title}</p>
			<p className="text-xs text-muted-foreground">{note ?? help}</p>
			<div className="mt-1.5 flex flex-wrap gap-1">
				{terms.map((term) => (
					<span
						key={term}
						className="inline-flex items-center gap-1 rounded-md border bg-background py-0.5 pr-1 pl-2 text-xs"
					>
						{term}
						<button
							type="button"
							aria-label={`Remove ${term}`}
							disabled={saving}
							onClick={() => onChange(terms.filter((t) => t !== term))}
							className="rounded-sm text-muted-foreground hover:text-foreground"
						>
							<XIcon className="size-3" />
						</button>
					</span>
				))}
			</div>
			<form
				className="mt-1.5"
				onSubmit={(event) => {
					event.preventDefault();
					const term = draft.trim();
					if (!term) return;
					onChange([...terms, term]);
					setDraft("");
				}}
			>
				<Input
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					placeholder="Add and press Enter"
					aria-label={`Add to ${title.toLowerCase()}`}
					className="h-7 text-xs"
					disabled={saving}
				/>
			</form>
		</div>
	);
}

export function WatchTerms({ projectRef }: { projectRef: string }) {
	const { data, isPending } = usePressTerms(projectRef);
	const save = useSetPressTerms(projectRef);

	if (isPending || !data) return <Skeleton className="h-40" />;

	const update = (next: Partial<PressTerms>) =>
		save.mutate(
			{
				// Empty keeps the parties as the watch list, so changing another
				// group doesn't freeze them as they are today
				watch: data.watch_is_default ? [] : data.watch,
				require: data.require,
				exclude: data.exclude,
				...next,
			},
			{
				onError: (error) =>
					toast.error(errorMessage(error, "Couldn't save the terms.")),
			},
		);

	return (
		<section>
			<SectionTitle>What's searched for</SectionTitle>
			<Panel className="space-y-4 p-3">
				{termKinds.map(({ kind, title, help }) => (
					<TermGroup
						key={kind}
						title={title}
						help={help}
						note={
							kind === "watch" && data.watch_is_default
								? "Taken from the parties until you change it."
								: undefined
						}
						terms={data[kind]}
						saving={save.isPending}
						onChange={(terms) => update({ [kind]: terms })}
					/>
				))}
			</Panel>
		</section>
	);
}

// What a source has done for the matter being looked at, or for the firm
function sourceStatus(source: PressSource): { text: string; error?: boolean } {
	const search = source.search;
	if (search) {
		if (search.status === "pending") return { text: "Waiting to search" };
		if (search.status === "running")
			return { text: `Searching… ${search.found} found so far` };
		if (search.status === "failed")
			return { text: search.last_error ?? "The search failed", error: true };
		const since = search.searched_from
			? ` since ${pressDate(search.searched_from)}`
			: "";
		const note = search.last_error ? ` · ${search.last_error}` : "";
		return { text: `${search.found} found${since}${note}` };
	}
	if (source.searching) return { text: "Searching…" };
	if (source.last_error) return { text: source.last_error, error: true };
	if (source.kind === "rss") {
		const read = source.last_fetched_at
			? `Feed, read ${pressDate(source.last_fetched_at)}`
			: "Feed, not read yet";
		return {
			text:
				source.article_count > 0
					? `${read} · ${source.article_count} found`
					: read,
		};
	}
	return {
		text:
			source.article_count > 0
				? `${source.article_count} found`
				: source.kind === "google_news"
					? "Every outlet Google News knows"
					: (source.domain ?? ""),
	};
}

export function SourceRow({
	source,
	canChange,
}: {
	source: PressSource;
	canChange: boolean;
}) {
	const updateSource = useUpdatePressSource();
	const deleteSource = useDeletePressSource();
	const status = sourceStatus(source);
	return (
		<div className="flex items-center gap-3 px-3 py-2">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{source.name}</p>
				<p
					className={`truncate text-xs ${status.error ? "text-destructive" : "text-muted-foreground"}`}
					title={status.text}
				>
					{status.text}
				</p>
			</div>
			{canChange && (
				<button
					type="button"
					aria-label={`Remove ${source.name}`}
					onClick={() => deleteSource.mutate(source.id)}
					className="text-muted-foreground hover:text-destructive"
				>
					<Trash2Icon className="size-3.5" />
				</button>
			)}
			<Switch
				checked={source.enabled}
				label={`Search ${source.name}`}
				disabled={!canChange || updateSource.isPending}
				onChange={(enabled) =>
					updateSource.mutate(
						{ id: source.id, enabled },
						{
							onError: (error) =>
								toast.error(
									errorMessage(error, "Couldn't change that source."),
								),
						},
					)
				}
			/>
		</div>
	);
}

// How /press groups the firm's sources
export const SOURCE_CATEGORIES = [
	"Wire",
	"Broadcaster",
	"National",
	"Business",
	"Legal",
	"Local",
] as const;

// Pick an outlet, type a website, or for the few who want it, a feed. Each
// outlet starts searching as soon as it's added, back to the matter's
// earliest date
export function AddSource({
	projectRef,
	existing,
	onDone,
}: {
	projectRef?: string;
	existing: PressSource[];
	onDone: () => void;
}) {
	const add = useAddPressSource();
	const [website, setWebsite] = useState("");
	const [feed, setFeed] = useState(false);
	const taken = new Set(existing.map((source) => source.domain));
	const hasEvery = existing.some((source) => source.kind === "google_news");

	const addSource = (body: PressSourceCreate) =>
		add.mutate(
			{ ...body, project: projectRef },
			{
				onSuccess: (source) =>
					toast.success(
						source.kind === "rss"
							? `${source.name} added`
							: `${source.name} added, searching now`,
					),
				onError: (error) =>
					toast.error(errorMessage(error, "Couldn't add that source.")),
			},
		);

	if (feed) {
		return (
			<AddFeed
				projectRef={projectRef}
				onDone={() => {
					setFeed(false);
					onDone();
				}}
			/>
		);
	}

	return (
		<div className="space-y-3 p-3">
			<button
				type="button"
				disabled={hasEvery || add.isPending}
				onClick={() =>
					addSource({ name: "All news outlets", kind: "google_news" })
				}
				className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
			>
				<span className="font-medium">All news outlets</span>
				<span className="block text-xs text-muted-foreground">
					{hasEvery
						? "Already searching every outlet"
						: "Everything Google News has, BBC to local papers"}
				</span>
			</button>
			<div>
				<p className="mb-1.5 text-xs text-muted-foreground">
					Or pick outlets one by one
				</p>
				<div className="flex flex-wrap gap-1.5">
					{OUTLETS.map((outlet) => (
						<button
							key={outlet.domain}
							type="button"
							disabled={taken.has(outlet.domain) || add.isPending}
							onClick={() =>
								addSource({
									name: outlet.name,
									kind: "site",
									domain: outlet.domain,
									category: outlet.category,
								})
							}
							className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted disabled:border-dashed disabled:opacity-50"
						>
							{taken.has(outlet.domain) ? "✓ " : "+ "}
							{outlet.name}
						</button>
					))}
				</div>
			</div>
			<form
				className="flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					const domain = website.trim();
					if (!domain) return;
					addSource({
						name: domain
							.replace(/^https?:\/\/(www\.)?/, "")
							.replace(/\/.*$/, ""),
						kind: "site",
						domain,
					});
					setWebsite("");
				}}
			>
				<Input
					value={website}
					onChange={(event) => setWebsite(event.target.value)}
					placeholder="Another website, e.g. kentonline.co.uk"
					aria-label="Another outlet's website"
					className="h-8"
				/>
				<Button
					size="sm"
					type="submit"
					variant="outline"
					disabled={add.isPending}
				>
					Add
				</Button>
			</form>
			<div className="flex justify-between">
				<button
					type="button"
					onClick={() => setFeed(true)}
					className="text-xs text-muted-foreground underline-offset-2 hover:underline"
				>
					Add an RSS feed instead
				</button>
				<button
					type="button"
					onClick={onDone}
					className="text-xs text-muted-foreground hover:text-foreground"
				>
					Done
				</button>
			</div>
		</div>
	);
}

function AddFeed({
	projectRef,
	onDone,
}: {
	projectRef?: string;
	onDone: () => void;
}) {
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const add = useAddPressSource();
	return (
		<form
			className="space-y-2 p-3"
			onSubmit={(event) => {
				event.preventDefault();
				add.mutate(
					{ name, url, kind: "rss", project: projectRef },
					{
						onSuccess: () => {
							toast.success(`${name} added`);
							onDone();
						},
					},
				);
			}}
		>
			<Input
				required
				placeholder="Name, e.g. Kent Online"
				value={name}
				onChange={(event) => setName(event.target.value)}
				className="h-8"
			/>
			<Input
				required
				type="url"
				placeholder="Feed address (RSS or Atom)"
				value={url}
				onChange={(event) => setUrl(event.target.value)}
				className="h-8"
			/>
			{add.isError && (
				<p className="text-xs text-destructive">
					{errorMessage(add.error, "Couldn't add that feed.")}
				</p>
			)}
			<div className="flex gap-2">
				<Button size="sm" type="submit" disabled={add.isPending}>
					{add.isPending ? "Checking the feed…" : "Add feed"}
				</Button>
				<Button size="sm" type="button" variant="ghost" onClick={onDone}>
					Cancel
				</Button>
			</div>
		</form>
	);
}

// Where this matter's press comes from. The firm's sources are searched for
// every matter and changed on /press, a matter can add its own here
export function MatterSources({ projectRef }: { projectRef: string }) {
	const { data, isPending } = usePressSources(projectRef);
	const [adding, setAdding] = useState(false);
	const own = data?.filter((source) => source.project_id) ?? [];
	const firm = data?.filter((source) => !source.project_id) ?? [];

	return (
		<section>
			<SectionTitle
				action={
					!adding && (
						<Button variant="ghost" size="xs" onClick={() => setAdding(true)}>
							<PlusIcon /> Add source
						</Button>
					)
				}
			>
				Sources
			</SectionTitle>
			{isPending ? (
				<Skeleton className="h-32" />
			) : (
				<div className="space-y-3">
					{adding && (
						<Panel>
							<AddSource
								projectRef={projectRef}
								existing={data ?? []}
								onDone={() => setAdding(false)}
							/>
						</Panel>
					)}
					{own.length > 0 && (
						<div>
							<p className="mb-1 text-xs text-muted-foreground">
								Just this matter
							</p>
							<Panel className="divide-y">
								{own.map((source) => (
									<SourceRow key={source.id} source={source} canChange />
								))}
							</Panel>
						</div>
					)}
					<div>
						<p className="mb-1 text-xs text-muted-foreground">
							The firm's, for every matter, changed on the Press page
						</p>
						{firm.length === 0 ? (
							<p className="text-xs text-muted-foreground">None set up yet.</p>
						) : (
							<Panel className="divide-y">
								{firm.map((source) => (
									<SourceRow
										key={source.id}
										source={source}
										canChange={false}
									/>
								))}
							</Panel>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
