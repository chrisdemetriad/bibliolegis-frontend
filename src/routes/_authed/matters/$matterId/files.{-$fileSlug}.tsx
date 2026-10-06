import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import {
	DownloadIcon,
	EllipsisIcon,
	InfoIcon,
	PencilIcon,
	Trash2Icon,
	UploadIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Document } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { DocumentStatus } from "#/documents/DocumentStatus";
import { DeleteFileDialog, RenameFileDialog } from "#/documents/FileDialogs";
import { formatUploadedAt } from "#/documents/format";
import { fileSlugs, nameTaken, splitName } from "#/documents/names";
import {
	useDeleteDocument,
	useDocuments,
	useRenameDocument,
} from "#/documents/queries";
import { UploadZone } from "#/documents/UploadZone";
import { FileViewer, useDownload } from "#/documents/viewer/FileViewer";
import { iconFor, kindOf, type ViewerFile } from "#/documents/viewer/kinds";
import { useMatter } from "#/matters/context";
import { fileCategories, type MatterFile, sampleFiles } from "#/mock/data";
import { PersonAvatar, SectionTitle } from "#/shell/page";

// The open file is in the address, /files/letter-before-claim, so it can be
// shared, bookmarked or reopened with back
export const Route = createFileRoute(
	"/_authed/matters/$matterId/files/{-$fileSlug}",
)({
	component: MatterFiles,
});

function MatterFiles() {
	const matter = useMatter();
	if (matter.projectId) return <RealFiles projectId={matter.projectId} />;
	return <SampleFiles />;
}

// Which file the viewer has open, read from and written to the address.
// `ready` is false until the list has loaded, so an address for a file that
// isn't there can be told apart from one that hasn't arrived yet
function useOpenFile(files: { key: string; name: string }[], ready: boolean) {
	const { fileSlug } = Route.useParams();
	const navigate = useNavigate();
	const router = useRouter();
	const slugs = useMemo(() => fileSlugs(files), [files]);
	const openKey = useMemo(() => {
		if (!fileSlug) return null;
		for (const [key, slug] of slugs) if (slug === fileSlug) return key;
		return null;
	}, [slugs, fileSlug]);
	// Set when this page opened the file itself, so closing it can go back
	// to the list rather than adding another entry to step through
	const pushed = useRef(false);

	const go = useCallback(
		(slug: string | undefined, replace: boolean) =>
			navigate({
				to: "/matters/$matterId/files/{-$fileSlug}",
				params: (previous) => ({
					matterId: previous.matterId as string,
					fileSlug: slug,
				}),
				replace,
				resetScroll: false,
			}),
		[navigate],
	);

	// Renamed or deleted since the address was copied
	useEffect(() => {
		if (ready && fileSlug && !openKey) void go(undefined, true);
	}, [ready, fileSlug, openKey, go]);

	const setOpenKey = useCallback(
		(key: string | null) => {
			if (key === null) {
				if (pushed.current) {
					pushed.current = false;
					router.history.back();
				} else {
					void go(undefined, true);
				}
				return;
			}
			// Previous and next replace the open file rather than stacking up
			// history, so back still closes the viewer in one go
			const stepping = openKey !== null;
			if (!stepping) pushed.current = true;
			void go(slugs.get(key), stepping);
		},
		[openKey, slugs, go, router],
	);

	return { openKey, setOpenKey };
}

// Which row's menu asked to rename or delete, so one dialog of each serves
// the whole table
type Pending = { action: "rename" | "delete"; key: string } | null;

type RowActions = {
	onOpen: (key: string) => void;
	onRename: (key: string) => void;
	onDelete: (key: string) => void;
};

// The sample matter has no files behind it, so each row opens a stand in of
// the same kind from public/sample-files. Renames and deletes stay in this
// page and are gone on a reload, there's nothing on the api to change
const sampleExtensions = {
	pdf: "pdf",
	docx: "docx",
	xlsx: "xlsx",
	image: "jpg",
};

type SampleFile = MatterFile & { key: string };

function sampleViewerFile(file: SampleFile): ViewerFile {
	const kind = kindOf(file.name);
	return {
		key: file.key,
		name: file.name,
		load: async () => {
			if (!kind) throw new Error("no sample for this kind of file");
			const response = await fetch(
				`/sample-files/sample.${sampleExtensions[kind]}`,
			);
			if (!response.ok) throw new Error(`sample file ${response.status}`);
			return response.blob();
		},
	};
}

function SampleFiles() {
	const matter = useMatter();
	const [files, setFiles] = useState<SampleFile[]>(() =>
		sampleFiles.map((file, index) => ({ ...file, key: `sample-${index}` })),
	);
	const [tab, setTab] = useState("all");
	const [pending, setPending] = useState<Pending>(null);
	const { openKey, setOpenKey } = useOpenFile(files, true);

	const tabs = [
		{ value: "all", label: "All", files },
		...fileCategories.map((category) => ({
			value: category,
			label: category,
			files: files.filter((file) => file.category === category),
		})),
	];
	// Previous and next step through the tab that's showing, the same order
	// as the table. A file opened from its address may be on another tab, in
	// which case they step through everything
	const showing = (tabs.find((each) => each.value === tab) ?? tabs[0]).files;
	const viewerFiles = (
		openKey && !showing.some((file) => file.key === openKey) ? files : showing
	).map(sampleViewerFile);
	const target = files.find((file) => file.key === pending?.key);

	return (
		<div>
			<SectionTitle
				action={
					<Button size="sm" variant="outline">
						<UploadIcon /> Add files
					</Button>
				}
			>
				Files
			</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				{matter.documents.toLocaleString("en-GB")} documents. Bibliolegis sorts
				new files into these categories as it reads them, and anything it isn't
				sure about waits for someone to confirm.
			</p>
			<Tabs value={tab} onValueChange={setTab}>
				<div className="overflow-x-auto border-b">
					<TabsList variant="line" className="h-10!">
						{tabs.map((tab) => (
							<TabsTrigger key={tab.value} value={tab.value}>
								{tab.label}
								<span className="text-xs text-muted-foreground">
									{tab.files.length}
								</span>
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				{tabs.map((tab) => (
					<TabsContent key={tab.value} value={tab.value}>
						<SampleTable
							files={tab.files}
							onOpen={setOpenKey}
							onRename={(key) => setPending({ action: "rename", key })}
							onDelete={(key) => setPending({ action: "delete", key })}
						/>
					</TabsContent>
				))}
			</Tabs>
			<FileViewer
				files={viewerFiles}
				openKey={openKey}
				onOpenKeyChange={setOpenKey}
			/>
			{target && (
				<FileDialogs
					pending={pending}
					name={target.name}
					onClose={() => setPending(null)}
					isTaken={(filename) => nameTaken(filename, files, target.key)}
					onRename={async (stem) => {
						const { extension } = splitName(target.name);
						setFiles((current) =>
							current.map((file) =>
								file.key === target.key
									? { ...file, name: `${stem}${extension}` }
									: file,
							),
						);
					}}
					onDelete={async () => {
						setFiles((current) =>
							current.filter((file) => file.key !== target.key),
						);
					}}
				/>
			)}
		</div>
	);
}

function SampleTable({
	files,
	...actions
}: { files: SampleFile[] } & RowActions) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="max-md:hidden">Category</TableHead>
					<TableHead className="max-sm:hidden">Pages</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="max-md:hidden">Added</TableHead>
					<TableHead className="w-20" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{files.map((file) => (
					<FileRow
						key={file.key}
						viewer={sampleViewerFile(file)}
						nameWidth="max-w-[18rem]"
						{...actions}
					>
						<TableCell className="text-muted-foreground max-md:hidden">
							{file.category}
						</TableCell>
						<TableCell className="text-muted-foreground max-sm:hidden">
							{file.pages}
						</TableCell>
						<TableCell>
							<span
								className={
									file.status === "Read"
										? "text-muted-foreground"
										: "text-warning-foreground"
								}
							>
								{file.status}
							</span>
						</TableCell>
						<TableCell className="max-md:hidden">
							<div className="flex items-center gap-2 text-muted-foreground">
								<PersonAvatar id={file.by} className="size-5 text-[0.55rem]" />
								{file.added}
							</div>
						</TableCell>
					</FileRow>
				))}
			</TableBody>
		</Table>
	);
}

function RealFiles({ projectId }: { projectId: string }) {
	const api = useApi();
	const { data, isPending, isError } = useDocuments();
	const rename = useRenameDocument();
	const remove = useDeleteDocument();
	const [pending, setPending] = useState<Pending>(null);
	const files = useMemo(
		() => data?.filter((document) => document.project_id === projectId),
		[data, projectId],
	);
	const viewerFiles = useMemo(
		() =>
			(files ?? []).map(
				(document): ViewerFile => ({
					key: document.id,
					name: document.filename,
					load: () => api.getDocumentFile(document.id),
				}),
			),
		[files, api],
	);
	const { openKey, setOpenKey } = useOpenFile(viewerFiles, files !== undefined);
	const byKey = new Map(files?.map((document) => [document.id, document]));
	const target = viewerFiles.find((file) => file.key === pending?.key);

	return (
		<div className="space-y-6">
			<div>
				<SectionTitle>Files</SectionTitle>
				<p className="-mt-1 text-sm text-muted-foreground">
					Everything uploaded to this matter. Only people on the matter can see
					these.
				</p>
			</div>
			<UploadZone projectId={projectId} />
			{isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
			{isError && (
				<p className="text-sm text-destructive">
					Couldn't load the files from the api.
				</p>
			)}
			{files?.length === 0 && (
				<p className="text-sm text-muted-foreground">No files yet.</p>
			)}
			{files && files.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="max-md:hidden">Added</TableHead>
							<TableHead className="w-20" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{viewerFiles.map((viewer) => {
							const file = byKey.get(viewer.key) as Document;
							return (
								<FileRow
									key={viewer.key}
									viewer={viewer}
									nameWidth="max-w-[28rem]"
									onOpen={setOpenKey}
									onRename={(key) => setPending({ action: "rename", key })}
									onDelete={(key) => setPending({ action: "delete", key })}
								>
									<TableCell>
										<DocumentStatus status={file.status} />
									</TableCell>
									<TableCell className="text-muted-foreground max-md:hidden">
										{formatUploadedAt(file.uploaded_at)}
									</TableCell>
								</FileRow>
							);
						})}
					</TableBody>
				</Table>
			)}
			<FileViewer
				files={viewerFiles}
				openKey={openKey}
				onOpenKeyChange={setOpenKey}
				details={(viewer) => (
					<Button variant="ghost" size="sm" asChild>
						<Link
							to="/documents/$documentId"
							params={{ documentId: viewer.key }}
						>
							<InfoIcon /> Details
						</Link>
					</Button>
				)}
			/>
			{target && (
				<FileDialogs
					pending={pending}
					name={target.name}
					onClose={() => setPending(null)}
					isTaken={(filename) => nameTaken(filename, viewerFiles, target.key)}
					onRename={(name) => rename.mutateAsync({ id: target.key, name })}
					onDelete={() => remove.mutateAsync(target.key)}
				/>
			)}
		</div>
	);
}

function FileDialogs({
	pending,
	name,
	onClose,
	isTaken,
	onRename,
	onDelete,
}: {
	pending: Pending;
	name: string;
	onClose: () => void;
	isTaken: (filename: string) => boolean;
	onRename: (stem: string) => Promise<unknown>;
	onDelete: () => Promise<unknown>;
}) {
	return (
		<>
			<RenameFileDialog
				// Keyed so each opening starts from the file's current name
				key={`rename:${pending?.key}`}
				name={name}
				open={pending?.action === "rename"}
				onOpenChange={(open) => !open && onClose()}
				isTaken={isTaken}
				onRename={onRename}
			/>
			<DeleteFileDialog
				name={name}
				open={pending?.action === "delete"}
				onOpenChange={(open) => !open && onClose()}
				onDelete={onDelete}
			/>
		</>
	);
}

// A row opens its file in the viewer. The name is the button, so keyboard and
// screen reader users get one stop per file, and the rest of the row is a
// larger target for a mouse
function FileRow({
	viewer,
	nameWidth,
	children,
	onOpen,
	onRename,
	onDelete,
}: {
	viewer: ViewerFile;
	nameWidth: string;
	children: React.ReactNode;
} & RowActions) {
	const download = useDownload();
	const Icon = iconFor(viewer.name);
	return (
		<TableRow
			className="group cursor-pointer"
			onClick={() => onOpen(viewer.key)}
		>
			<TableCell>
				<button
					type="button"
					className="flex items-center gap-2 text-left outline-none group-hover:underline focus-visible:underline"
					onClick={(event) => {
						event.stopPropagation();
						onOpen(viewer.key);
					}}
				>
					<Icon className="size-4 shrink-0 text-muted-foreground" />
					<span className={`${nameWidth} truncate`}>{viewer.name}</span>
				</button>
			</TableCell>
			{children}
			{/* Clicks in here are the buttons' own, not a click on the row */}
			<TableCell
				className="py-0 text-right whitespace-nowrap"
				onClick={(event) => event.stopPropagation()}
			>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`Download ${viewer.name}`}
					title="Download"
					className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
					onClick={() => void download(viewer)}
				>
					<DownloadIcon />
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`More for ${viewer.name}`}
							className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100"
						>
							<EllipsisIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={() => onRename(viewer.key)}>
							<PencilIcon /> Rename
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => onDelete(viewer.key)}
						>
							<Trash2Icon /> Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}
