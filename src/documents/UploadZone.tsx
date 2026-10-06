import { useQueryClient } from "@tanstack/react-query";
import { UploadIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
import { Progress } from "#/components/ui/progress";
import { StatusIcon } from "#/components/ui/status-icon";
import { cn } from "#/lib/utils";
import { ACCEPTED, ACCEPTED_LABEL } from "./accepted";
import { useDuplicateCheck } from "./duplicates";
import { documentKeys } from "./queries";

type Upload = {
	key: string;
	name: string;
	state: "uploading" | "done" | "failed";
	progress: number;
	error?: string;
};

function extensionOf(name: string) {
	const dot = name.lastIndexOf(".");
	return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

// With a projectId the files go into that matter, without one they're
// visible to the whole firm
export function UploadZone({ projectId }: { projectId?: string } = {}) {
	const api = useApi();
	const queryClient = useQueryClient();
	const inputId = useId();
	const [dragging, setDragging] = useState(false);
	const [uploads, setUploads] = useState<Upload[]>([]);
	const duplicates = useDuplicateCheck(projectId);

	const update = (key: string, change: Partial<Upload>) =>
		setUploads((current) =>
			current.map((upload) =>
				upload.key === key ? { ...upload, ...change } : upload,
			),
		);

	async function uploadOne(file: File) {
		const key = crypto.randomUUID();
		const extension = extensionOf(file.name);
		if (!ACCEPTED.includes(extension)) {
			setUploads((current) => [
				{
					key,
					name: file.name,
					state: "failed",
					progress: 0,
					error: `${extension || "Files with no extension"} can't be uploaded, only ${ACCEPTED_LABEL}.`,
				},
				...current,
			]);
			return;
		}

		setUploads((current) => [
			{ key, name: file.name, state: "uploading", progress: 0 },
			...current,
		]);
		try {
			await api.uploadDocument(file, {
				projectId,
				onProgress: (progress) => update(key, { progress }),
			});
			update(key, { state: "done", progress: 1 });
			toast.success(`${file.name} uploaded`, {
				description: "Now being read",
			});
			// The new row appears in the list as pending, and the list's own
			// polling carries it through to done or failed from there
			queryClient.invalidateQueries({ queryKey: documentKeys.list() });
		} catch (error) {
			update(key, {
				state: "failed",
				error: errorMessage(error, "The upload failed, try again."),
			});
		}
	}

	async function uploadAll(fileList: FileList | null) {
		if (!fileList) return;
		// Copied first, clearing the input empties the live FileList
		const files = Array.from(fileList);
		const carryOn = await duplicates.confirm(
			files.filter((file) => ACCEPTED.includes(extensionOf(file.name))),
		);
		if (!carryOn) return;
		for (const file of files) void uploadOne(file);
	}

	return (
		<section aria-label="Upload documents">
			{duplicates.dialog}
			<label
				htmlFor={inputId}
				onDragOver={(event) => {
					event.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setDragging(false);
					void uploadAll(event.dataTransfer.files);
				}}
				className={cn(
					"flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
					dragging && "border-primary bg-muted",
				)}
			>
				<UploadIcon className="size-6 text-muted-foreground" />
				<span className="font-medium">Drop files here, or click to choose</span>
				<span className="text-sm text-muted-foreground">
					{ACCEPTED_LABEL}. Each one is read and indexed after it uploads, which
					can take a minute for a scanned bundle
				</span>
				<input
					id={inputId}
					type="file"
					multiple
					accept={ACCEPTED.join(",")}
					className="sr-only"
					onChange={(event) => {
						void uploadAll(event.target.files);
						// Cleared so choosing the same file again still fires
						event.target.value = "";
					}}
				/>
			</label>

			{uploads.length > 0 && (
				<ul className="mt-4 space-y-2" aria-live="polite">
					{uploads.map((upload) => (
						<li
							key={upload.key}
							className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
						>
							{upload.state === "done" && <StatusIcon status="success" />}
							{upload.state === "failed" && <StatusIcon status="error" />}
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{upload.name}</p>
								{upload.state === "uploading" && (
									<Progress
										value={upload.progress * 100}
										className="mt-1"
										aria-label={`Uploading ${upload.name}`}
									/>
								)}
								{upload.state === "done" && (
									<p className="text-muted-foreground">
										Uploaded, now being read
									</p>
								)}
								{upload.state === "failed" && (
									<p className="text-destructive">{upload.error}</p>
								)}
							</div>
							{upload.state !== "uploading" && (
								<Button
									variant="ghost"
									size="icon-xs"
									aria-label={`Dismiss ${upload.name}`}
									onClick={() =>
										setUploads((current) =>
											current.filter((item) => item.key !== upload.key),
										)
									}
								>
									<XIcon />
								</Button>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
