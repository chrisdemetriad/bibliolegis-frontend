import { createFileRoute, Link } from "@tanstack/react-router";
import { FileIcon, ImageIcon, UploadIcon } from "lucide-react";
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
import { useMatter } from "#/matters/context";
import { fileCategories, type MatterFile, sampleFiles } from "#/mock/data";
import { PersonAvatar, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/files")({
	component: MatterFiles,
});

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
	if (matter.projectId) return <RealFiles projectId={matter.projectId} />;

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
			<Tabs defaultValue="all">
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
						<FileTable files={tab.files} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

function FileTable({ files }: { files: MatterFile[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="max-md:hidden">Category</TableHead>
					<TableHead className="max-sm:hidden">Pages</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="max-md:hidden">Added</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{files.map((file) => {
					const Icon = file.category === "Photos" ? ImageIcon : FileIcon;
					return (
						<TableRow key={file.name}>
							<TableCell>
								<div className="flex items-center gap-2">
									<Icon className="size-4 shrink-0 text-muted-foreground" />
									<span className="max-w-[18rem] truncate">{file.name}</span>
								</div>
							</TableCell>
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
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

function RealFiles({ projectId }: { projectId: string }) {
	const { data, isPending, isError } = useDocuments();
	const files = data?.filter((document) => document.project_id === projectId);

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
						</TableRow>
					</TableHeader>
					<TableBody>
						{files.map((file) => (
							<TableRow key={file.id}>
								<TableCell>
									<Link
										to="/documents/$documentId"
										params={{ documentId: file.id }}
										className="flex items-center gap-2 hover:underline"
									>
										<FileIcon className="size-4 shrink-0 text-muted-foreground" />
										<span className="max-w-[28rem] truncate">
											{file.filename}
										</span>
									</Link>
								</TableCell>
								<TableCell>
									<DocumentStatus status={file.status} />
								</TableCell>
								<TableCell className="text-muted-foreground max-md:hidden">
									{formatUploadedAt(file.uploaded_at)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
