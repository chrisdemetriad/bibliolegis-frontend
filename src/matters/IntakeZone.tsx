import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ArrowRightIcon,
	FileTextIcon,
	LoaderCircleIcon,
	UploadIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	type Document,
	errorMessage,
	type Intake,
	type IntakeMatter,
} from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
import { progressColour } from "#/components/ui/progress";
import { StatusIcon } from "#/components/ui/status-icon";
import { useDuplicateCheck } from "#/documents/duplicates";
import { documentKeys } from "#/documents/queries";
import { cn } from "#/lib/utils";
import { matterKeys } from "./queries";

// The api checks this too. Checking here means a wrong file is refused
// straight away rather than after it's been sent
const ACCEPTED = [".pdf", ".docx"];

const POLL_MS = 1500;

// Upload is the quick part for most files, reading is what takes the time,
// so it gets most of each file's share of the bar
const UPLOAD_SHARE = 0.25;

// Grouping is one call at the end, held back so the bar doesn't sit at 100%
// while it runs
const GROUPING_SHARE = 0.05;

// How far through reading each stage is, and what it's called on screen.
// Stages come from the api's documents.ingestion_stage
const STAGES: Record<string, { at: number; label: string }> = {
	queued: { at: 0, label: "Waiting to be read" },
	extracting: { at: 0.15, label: "Reading the text" },
	embedding: { at: 0.45, label: "Indexing it for search" },
	reading: { at: 0.75, label: "Working out the matter" },
	done: { at: 1, label: "Read" },
};

// Kept so a batch still being read carries on showing if the page is left
// and come back to. Session only, a batch from yesterday is long finished
const ACTIVE_KEY = "bibliolegis:active-intake";

type FileRow = {
	key: string;
	name: string;
	upload: number;
	state: "uploading" | "uploaded" | "refused" | "failed";
	documentId?: string;
	error?: string;
};

function extensionOf(name: string) {
	const dot = name.lastIndexOf(".");
	return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function readStorage(): string | null {
	try {
		return sessionStorage.getItem(ACTIVE_KEY);
	} catch {
		return null;
	}
}

function writeStorage(intakeId: string | null) {
	try {
		if (intakeId) sessionStorage.setItem(ACTIVE_KEY, intakeId);
		else sessionStorage.removeItem(ACTIVE_KEY);
	} catch {
		// Private windows can refuse storage, the batch just won't resume
	}
}

// One file's progress from 0 to 1, and what to call where it's got to
function fileProgress(row: FileRow, document?: Document) {
	if (row.state === "refused" || row.state === "failed") {
		return { value: 1, label: row.error ?? "Couldn't upload", failed: true };
	}
	if (row.state === "uploading") {
		return {
			value: row.upload * UPLOAD_SHARE,
			label: `Uploading ${Math.round(row.upload * 100)}%`,
			failed: false,
		};
	}
	if (document?.status === "failed") {
		return {
			value: 1,
			label: document.error_message ?? "Couldn't be read",
			failed: true,
		};
	}
	const stage =
		STAGES[
			document?.status === "done"
				? "done"
				: (document?.ingestion_stage ?? "queued")
		] ?? STAGES.queued;
	return {
		value: UPLOAD_SHARE + stage.at * (1 - UPLOAD_SHARE),
		label: stage.label,
		failed: false,
	};
}

export function IntakeZone() {
	const api = useApi();
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [rows, setRows] = useState<FileRow[]>([]);
	const [intakeId, setIntakeId] = useState<string | null>(null);
	const [intake, setIntake] = useState<Intake | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [checking, setChecking] = useState(false);
	const duplicates = useDuplicateCheck();

	const finished = intake?.status === "done" || intake?.status === "failed";
	const busy =
		checking || ((rows.length > 0 || intakeId !== null) && !finished && !error);

	// Pick up a batch left running when the page was last open
	useEffect(() => {
		const saved = readStorage();
		if (saved) setIntakeId(saved);
	}, []);

	// Poll the batch until it's grouped. Only once every upload has gone,
	// before that the rows above say more than the api can
	const uploading = rows.some((row) => row.state === "uploading");
	useEffect(() => {
		if (!intakeId || uploading || finished) return;
		let cancelled = false;
		const tick = async () => {
			try {
				const next = await api.getIntake(intakeId);
				if (cancelled) return;
				setIntake(next);
				if (next.status === "done" || next.status === "failed") {
					writeStorage(null);
					// The new matters go straight into the list below and the
					// documents page, without waiting for either to refetch
					await queryClient.invalidateQueries({ queryKey: matterKeys.all });
					await queryClient.invalidateQueries({ queryKey: documentKeys.all });
				}
			} catch (caught) {
				if (!cancelled) {
					writeStorage(null);
					setError(
						errorMessage(caught, "Lost track of the upload, try again."),
					);
				}
			}
		};
		void tick();
		const timer = setInterval(tick, POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [api, intakeId, uploading, finished, queryClient]);

	const update = (key: string, change: Partial<FileRow>) =>
		setRows((current) =>
			current.map((row) => (row.key === key ? { ...row, ...change } : row)),
		);

	async function start(files: File[]) {
		if (files.length === 0 || busy) return;

		// Asked before anything is shown or sent, so going to the matter
		// instead leaves nothing half started behind
		setChecking(true);
		const carryOn = await duplicates.confirm(
			files.filter((file) => ACCEPTED.includes(extensionOf(file.name))),
		);
		setChecking(false);
		if (!carryOn) return;

		setIntake(null);
		setError(null);

		const fresh: FileRow[] = files.map((file) => {
			const extension = extensionOf(file.name);
			const refused = !ACCEPTED.includes(extension);
			return {
				key: crypto.randomUUID(),
				name: file.name,
				upload: 0,
				state: refused ? "refused" : "uploading",
				error: refused
					? `${extension || "Files with no extension"} can't be read, only PDF and DOCX`
					: undefined,
			};
		});
		setRows(fresh);
		const accepted = fresh
			.map((row, i) => ({ row, file: files[i] }))
			.filter(({ row }) => row.state === "uploading");
		if (accepted.length === 0) return;

		let batch: Intake;
		try {
			batch = await api.createIntake();
		} catch (caught) {
			setRows([]);
			setError(errorMessage(caught, "Couldn't start the upload, try again."));
			return;
		}
		writeStorage(batch.id);

		await Promise.all(
			accepted.map(async ({ row, file }) => {
				try {
					const document = await api.addIntakeDocument(
						batch.id,
						file,
						(upload) => update(row.key, { upload }),
					);
					update(row.key, {
						state: "uploaded",
						upload: 1,
						documentId: document.id,
					});
				} catch (caught) {
					update(row.key, {
						state: "failed",
						error: errorMessage(caught, "The upload failed"),
					});
				}
			}),
		);

		// Sealed even when some uploads failed, so the ones that made it still
		// become matters. A batch with none at all is sealed and comes back
		// done with nothing in it
		try {
			await api.sealIntake(batch.id);
		} catch (caught) {
			setError(errorMessage(caught, "Couldn't finish the upload, try again."));
			writeStorage(null);
			return;
		}
		setIntakeId(batch.id);
	}

	function reset() {
		setRows([]);
		setIntake(null);
		setIntakeId(null);
		setError(null);
	}

	// Rows come from what was dropped, or from the api when a batch is picked
	// up again after the page was left
	const documents = new Map(intake?.documents.map((doc) => [doc.id, doc]));
	const shown: FileRow[] =
		rows.length > 0
			? rows
			: (intake?.documents.map((doc) => ({
					key: doc.id,
					name: doc.filename,
					upload: 1,
					state: "uploaded" as const,
					documentId: doc.id,
				})) ?? []);
	const progress = shown.map((row) =>
		fileProgress(
			row,
			row.documentId ? documents.get(row.documentId) : undefined,
		),
	);
	const reading =
		progress.length > 0 && progress.every((item) => item.value >= 1);
	const overall =
		finished || (intake && shown.length === 0)
			? 1
			: progress.length === 0
				? 0
				: (progress.reduce((sum, item) => sum + item.value, 0) /
						progress.length) *
					(1 - GROUPING_SHARE);
	const percent = Math.round(overall * 100);
	const failedCount = progress.filter((item) => item.failed).length;

	const headline = error
		? error
		: finished
			? intake?.status === "failed"
				? (intake.error_message ??
					"The files were read but couldn't be sorted into matters.")
				: summary(
						intake?.matters ?? [],
						shown.length - failedCount,
						failedCount,
					)
			: uploading
				? `Uploading ${shown.length === 1 ? "1 file" : `${shown.length} files`}`
				: reading || intake?.status === "grouping"
					? "Sorting the files into matters"
					: "Reading the files";

	const idle = shown.length === 0 && !intakeId && !error;
	const single = shown.length === 1;

	return (
		<section aria-label="Open matters from case files" className="mb-8">
			{duplicates.dialog}
			{/* A div rather than a label, so a click on the progress or the results
			once files are in doesn't open the file picker. The button inside is
			the keyboard way in, a click anywhere else on the empty zone is a
			shortcut for pointer users */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: the Choose files button is the accessible control, this only widens its target */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: same */}
			<div
				onClick={idle ? () => inputRef.current?.click() : undefined}
				onDragOver={(event) => {
					event.preventDefault();
					if (!busy) setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setDragging(false);
					void start(Array.from(event.dataTransfer.files));
				}}
				className={cn(
					"block rounded-xl border border-dashed p-6 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:p-8",
					idle && "cursor-pointer hover:bg-muted/40",
					dragging && "border-primary bg-muted",
				)}
			>
				<input
					ref={inputRef}
					type="file"
					multiple
					disabled={busy}
					accept={ACCEPTED.join(",")}
					aria-label="Choose case files"
					className="sr-only"
					onChange={(event) => {
						void start(Array.from(event.target.files ?? []));
						// Cleared so choosing the same file again still fires
						event.target.value = "";
					}}
				/>

				{idle ? (
					<div className="flex flex-col items-center gap-2 text-center">
						<span className="flex size-10 items-center justify-center rounded-full border bg-background">
							<UploadIcon className="size-4 text-muted-foreground" />
						</span>
						<p className="font-medium">Drop case files here to open matters</p>
						<p className="max-w-lg text-sm text-muted-foreground">
							PDF or DOCX, as many as you like. Each file is read, then files
							from the same case are put together into one matter. A file about
							a matter you already have joins that one.
						</p>
						<Button
							type="button"
							size="sm"
							className="mt-2"
							onClick={(event) => {
								event.stopPropagation();
								inputRef.current?.click();
							}}
						>
							<UploadIcon /> Choose files
						</Button>
					</div>
				) : (
					<div aria-live="polite">
						{/* One file in progress needs no batch headline or batch bar,
						its own row says it all. The headline comes back once it's done
						or if it fails, since that's where the outcome is */}
						{(!single || finished || error) && (
							<div className="mb-5 flex items-end justify-between gap-4">
								<div className="flex min-w-0 items-center gap-2">
									{error || intake?.status === "failed" ? (
										<StatusIcon status="error" />
									) : finished ? (
										<StatusIcon status="success" />
									) : (
										<LoaderCircleIcon className="size-4 shrink-0 animate-spin text-muted-foreground" />
									)}
									<p className="truncate font-medium">{headline}</p>
								</div>
								{!single && (
									<p className="shrink-0 text-2xl font-semibold tracking-tight tabular-nums">
										{percent}%
									</p>
								)}
							</div>
						)}
						{!single && (
							<Bar value={overall} active={busy} className="-mt-2 mb-5 h-2" />
						)}

						<ul className="space-y-3">
							{shown.map((row, i) => (
								<li key={row.key} className="flex items-center gap-3 text-sm">
									<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
									<span className="min-w-0 truncate max-sm:w-40 sm:w-1/2">
										{row.name}
									</span>
									<Bar
										value={progress[i].value}
										active={busy && progress[i].value < 1}
										failed={progress[i].failed}
										className="h-1 min-w-12 flex-1 max-sm:hidden"
									/>
									<span
										className={cn(
											"w-40 truncate text-right text-xs text-muted-foreground max-sm:flex-1",
											progress[i].failed && "text-destructive",
										)}
										title={progress[i].label}
									>
										{progress[i].label}
									</span>
									{single && (
										<span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
											{percent}%
										</span>
									)}
								</li>
							))}
						</ul>

						{finished && (intake?.matters.length ?? 0) > 0 && (
							<ul className="mt-5 space-y-2 border-t pt-5">
								{intake?.matters.map((item) => (
									<MatterResult key={item.matter.id} item={item} />
								))}
							</ul>
						)}

						{(finished || error) && (
							<div className="mt-5 flex justify-end">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={reset}
								>
									<UploadIcon /> Drop more files
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}

function plural(count: number, one: string, many: string) {
	return `${count} ${count === 1 ? one : many}`;
}

// "1 new matter added, 2 existing matters updated". No file count, the rows
// above already list the files, only the ones that couldn't be read get a
// mention
function summary(matters: IntakeMatter[], read: number, failed: number) {
	if (read <= 0) return "None of the files could be read";
	const made = matters.filter((item) => item.is_new).length;
	const joined = matters.length - made;
	const parts = [
		made > 0 && `${plural(made, "new matter", "new matters")} added`,
		joined > 0 &&
			`${plural(joined, "existing matter", "existing matters")} updated`,
		failed > 0 && `${plural(failed, "file", "files")} couldn't be read`,
	].filter(Boolean);
	return parts.join(", ") || "No matters added";
}

function MatterResult({ item }: { item: IntakeMatter }) {
	const files = item.document_ids.length;
	return (
		<li>
			<Link
				to="/matters/$matterId/overview"
				params={{ matterId: item.matter.slug }}
				className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/50"
			>
				<span className="rounded-md border px-1.5 py-px text-xs text-muted-foreground">
					{item.is_new ? "New" : "Updated"}
				</span>
				<span className="min-w-0 flex-1 truncate text-sm font-medium">
					{item.matter.name}
				</span>
				<span className="text-xs text-muted-foreground max-sm:hidden">
					{[
						item.matter.practice_area,
						`${files} ${files === 1 ? "file" : "files"}`,
					]
						.filter(Boolean)
						.join(" · ")}
				</span>
				<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
			</Link>
		</li>
	);
}

// A progress bar that eases between values and from red to green as it
// fills, with a sheen running along it while there's still work going on
function Bar({
	value,
	active,
	failed = false,
	className,
}: {
	value: number;
	active: boolean;
	failed?: boolean;
	className?: string;
}) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(value * 100)}
			className={cn("overflow-hidden rounded-full bg-muted", className)}
		>
			<div
				className={cn(
					"relative h-full overflow-hidden rounded-full transition-[width,background-color] duration-700 ease-out",
					failed && "bg-destructive/60",
				)}
				style={{
					width: `${Math.max(value, active ? 0.02 : 0) * 100}%`,
					backgroundColor: failed ? undefined : progressColour(value),
				}}
			>
				{active && (
					<span className="absolute inset-0 animate-[progress-sheen_1.6s_linear_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent motion-reduce:hidden" />
				)}
			</div>
		</div>
	);
}
