import { createFileRoute, Link } from "@tanstack/react-router";
import { DownloadIcon, InfoIcon, UploadIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { Document } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
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
import { formatUploadedAt } from "#/documents/format";
import { useDocuments } from "#/documents/queries";
import { UploadZone } from "#/documents/UploadZone";
import { FileViewer, useDownload } from "#/documents/viewer/FileViewer";
import { iconFor, kindOf, type ViewerFile } from "#/documents/viewer/kinds";
import { useMatter } from "#/matters/context";
import { fileCategories, type MatterFile, sampleFiles } from "#/mock/data";
import { PersonAvatar, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/files")({
	component: MatterFiles,
});

// The sample matter has no files behind it, so each row opens a stand in of
// the same kind from public/sample-files
const sampleExtensions = {
	pdf: "pdf",
	docx: "docx",
	xlsx: "xlsx",
	image: "jpg",
};

function sampleViewerFile(file: MatterFile): ViewerFile {
	const kind = kindOf(file.name);
	return {
		key: `sample:${file.name}`,
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

const tabs = [
	{ value: "all", label: "All", files: sampleFiles },
	...fileCategories.map((category) => ({
		value: category,
		label: category,
		files: sampleFiles.filter((file) => file.category === category),
	})),
];

function MatterFiles() {
	const matter = useMatter();
	const [tab, setTab] = useState("all");
	const [openKey, setOpenKey] = useState<string | null>(null);
	if (matter.projectId) return <RealFiles projectId={matter.projectId} />;

	// Previous and next step through the tab that's showing, the same order
	// as the table
	const viewerFiles = (
		tabs.find((candidate) => candidate.value === tab) ?? tabs[0]
	).files.map(sampleViewerFile);

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
						<FileTable
							files={tab.files.map((file) => ({
								file,
								viewer: sampleViewerFile(file),
							}))}
							onOpen={setOpenKey}
						/>
					</TabsContent>
				))}
			</Tabs>
			<FileViewer
				files={viewerFiles}
				openKey={openKey}
				onOpenKeyChange={setOpenKey}
			/>
		</div>
	);
}

function FileTable({
	files,
	onOpen,
}: {
	files: { file: MatterFile; viewer: ViewerFile }[];
	onOpen: (key: string) => void;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="max-md:hidden">Category</TableHead>
					<TableHead className="max-sm:hidden">Pages</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="max-md:hidden">Added</TableHead>
					<TableHead className="w-10" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{files.map(({ file, viewer }) => {
					return (
						<FileRow
							key={viewer.key}
							viewer={viewer}
							onOpen={onOpen}
							nameWidth="max-w-[18rem]"
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
									<PersonAvatar
										id={file.by}
										className="size-5 text-[0.55rem]"
									/>
									{file.added}
								</div>
							</TableCell>
						</FileRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

function RealFiles({ projectId }: { projectId: string }) {
	const api = useApi();
	const { data, isPending, isError } = useDocuments();
	const [openKey, setOpenKey] = useState<string | null>(null);
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
	const byKey = new Map(files?.map((document) => [document.id, document]));

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
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{viewerFiles.map((viewer) => {
							const file = byKey.get(viewer.key) as Document;
							return (
								<FileRow
									key={viewer.key}
									viewer={viewer}
									onOpen={setOpenKey}
									nameWidth="max-w-[28rem]"
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
		</div>
	);
}

// A row opens its file in the viewer. The name is the button, so keyboard and
// screen reader users get one stop per file, and the rest of the row is a
// larger target for a mouse
function FileRow({
	viewer,
	onOpen,
	nameWidth,
	children,
}: {
	viewer: ViewerFile;
	onOpen: (key: string) => void;
	nameWidth: string;
	children: React.ReactNode;
}) {
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
			<TableCell className="py-0 text-right">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`Download ${viewer.name}`}
					title="Download"
					className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
					onClick={(event) => {
						event.stopPropagation();
						void download(viewer);
					}}
				>
					<DownloadIcon />
				</Button>
			</TableCell>
		</TableRow>
	);
}
