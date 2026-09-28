import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage, type PressSource, type PressTerms } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Panel, SectionTitle } from "#/shell/page";
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

function SourceRow({
	source,
	canChange,
}: {
	source: PressSource;
	canChange: boolean;
}) {
	const updateSource = useUpdatePressSource();
	const deleteSource = useDeletePressSource();
	const read = source.last_fetched_at
		? `Read ${pressDate(source.last_fetched_at)}`
		: "Not read yet";
	return (
		<div className="flex items-center gap-3 px-3 py-2">
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{source.name}</p>
				<p
					className={`truncate text-xs ${source.last_error ? "text-destructive" : "text-muted-foreground"}`}
					title={source.last_error ?? undefined}
				>
					{source.last_error ?? read}
					{!source.last_error &&
						source.article_count > 0 &&
						` · ${source.article_count} found`}
				</p>
			</div>
			{canChange && source.project_id && (
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
				label={`Read ${source.name}`}
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

export function AddFeed({
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

// The feeds this matter is searched in. Firm wide ones are shown for what
// they are and changed on /press, the matter's own can be added here
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
							<PlusIcon /> Add feed
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
					{(adding || own.length > 0) && (
						<div>
							<p className="mb-1 text-xs text-muted-foreground">
								Just this matter
							</p>
							<Panel className="divide-y">
								{own.map((source) => (
									<SourceRow key={source.id} source={source} canChange />
								))}
								{adding && (
									<AddFeed
										projectRef={projectRef}
										onDone={() => setAdding(false)}
									/>
								)}
							</Panel>
						</div>
					)}
					<div>
						<p className="mb-1 text-xs text-muted-foreground">
							The firm's, changed on the Press page
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
