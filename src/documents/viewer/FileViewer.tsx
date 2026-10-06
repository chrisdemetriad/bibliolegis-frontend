import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DownloadIcon,
	LoaderCircleIcon,
	XIcon,
} from "lucide-react";
import {
	type ComponentProps,
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
} from "react";
import { toast } from "sonner";
import { ApiError } from "#/api/client";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "#/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { documentKeys } from "../queries";
import { iconFor, kindOf, saveBlob, type ViewerFile } from "./kinds";

// Each view pulls in a library of its own, pdf.js alone is the best part of
// a megabyte. Loaded the first time a file of that kind is opened, never
// during server rendering
const views = {
	pdf: lazy(() => import("./PdfView")),
	docx: lazy(() => import("./DocxView")),
	xlsx: lazy(() => import("./SheetView")),
	image: lazy(() => import("./ImageView")),
};

const fileQuery = (file: ViewerFile) => ({
	queryKey: documentKeys.file(file.key),
	queryFn: file.load,
	// An uploaded file never changes under the same id
	staleTime: Number.POSITIVE_INFINITY,
	// Kept a minute after the panel moves on, enough for flicking back and
	// forth without holding every file opened this afternoon in memory
	gcTime: 60_000,
	retry: (count: number, error: unknown) =>
		!(error instanceof ApiError && error.status === 404) && count < 2,
});

// Downloads through the same cache the viewer reads from, so downloading
// what's already open doesn't fetch it again
export function useDownload() {
	const queryClient = useQueryClient();
	return useCallback(
		async (file: ViewerFile) => {
			try {
				saveBlob(await queryClient.fetchQuery(fileQuery(file)), file.name);
			} catch (error) {
				toast.error(`Couldn't download ${file.name}`, {
					description: describe(error),
				});
			}
		},
		[queryClient],
	);
}

export function FileViewer({
	files,
	openKey,
	onOpenKeyChange,
	details,
}: {
	files: ViewerFile[];
	openKey: string | null;
	onOpenKeyChange: (key: string | null) => void;
	// Anything extra for the header, a link to the document's page say
	details?: (file: ViewerFile) => ReactNode;
}) {
	const index = files.findIndex((file) => file.key === openKey);
	const file = index >= 0 ? files[index] : undefined;
	const previous = index > 0 ? files[index - 1] : undefined;
	const next = index >= 0 ? files[index + 1] : undefined;
	const download = useDownload();

	useEffect(() => {
		if (!file) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (event.key === "ArrowLeft" && previous) onOpenKeyChange(previous.key);
			if (event.key === "ArrowRight" && next) onOpenKeyChange(next.key);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [file, previous, next, onOpenKeyChange]);

	const Icon = file ? iconFor(file.name) : null;

	return (
		<Sheet
			open={file !== undefined}
			onOpenChange={(open) => !open && onOpenKeyChange(null)}
		>
			<SheetContent
				showCloseButton={false}
				// Focus goes to the panel rather than its first button. On a button
				// its tooltip opens straight away, and Escape then closes the
				// tooltip instead of the panel
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					(event.currentTarget as HTMLElement).focus();
				}}
				className="gap-0 p-0 outline-none data-[side=right]:w-full data-[side=right]:sm:max-w-none md:data-[side=right]:w-[min(68rem,92vw)]"
			>
				{file && Icon && (
					<>
						<header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
							<Icon className="size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0">
								<SheetTitle className="truncate text-sm">
									{file.name}
								</SheetTitle>
								<SheetDescription className="text-xs">
									{index + 1} of {files.length}
								</SheetDescription>
							</div>
							<div className="ml-auto flex shrink-0 items-center gap-1">
								{details?.(file)}
								<IconButton
									label="Previous file"
									shortcut="←"
									disabled={!previous}
									onClick={() => previous && onOpenKeyChange(previous.key)}
								>
									<ChevronLeftIcon />
								</IconButton>
								<IconButton
									label="Next file"
									shortcut="→"
									disabled={!next}
									onClick={() => next && onOpenKeyChange(next.key)}
								>
									<ChevronRightIcon />
								</IconButton>
								<Button
									variant="outline"
									size="sm"
									className="mx-1"
									onClick={() => download(file)}
								>
									<DownloadIcon />
									<span className="max-sm:sr-only">Download</span>
								</Button>
								<SheetClose asChild>
									<Button variant="ghost" size="icon-sm" aria-label="Close">
										<XIcon />
									</Button>
								</SheetClose>
							</div>
						</header>
						<FileBody key={file.key} file={file} />
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function FileBody({ file }: { file: ViewerFile }) {
	const kind = kindOf(file.name);
	const { data: blob, error } = useQuery({
		...fileQuery(file),
		enabled: kind !== null,
	});

	if (!kind) {
		return (
			<Notice>
				There's no preview for this kind of file. Download it to open it on your
				computer.
			</Notice>
		);
	}
	if (error) return <Notice tone="error">{describe(error)}</Notice>;
	if (!blob) return <Loading />;

	const View = views[kind];
	return (
		<Suspense fallback={<Loading />}>
			<View blob={blob} name={file.name} />
		</Suspense>
	);
}

function describe(error: unknown) {
	if (error instanceof ApiError && error.status === 404) {
		const detail = (error.body as { detail?: string } | null)?.detail;
		return detail === "file missing from storage"
			? "The record is here but the file itself is missing from storage. It needs uploading again."
			: "This file doesn't exist any more, or you don't have access to it.";
	}
	return "Couldn't load the file. Check your connection and try again.";
}

function Loading() {
	return (
		<div className="flex flex-1 items-center justify-center bg-muted/60">
			<LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
		</div>
	);
}

function Notice({ children, tone }: { children: ReactNode; tone?: "error" }) {
	return (
		<div className="flex flex-1 items-center justify-center bg-muted/60 p-6">
			<p
				className={
					tone === "error"
						? "max-w-sm text-center text-sm text-destructive"
						: "max-w-sm text-center text-sm text-muted-foreground"
				}
			>
				{children}
			</p>
		</div>
	);
}

function IconButton({
	label,
	shortcut,
	children,
	...props
}: ComponentProps<typeof Button> & { label: string; shortcut: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="ghost" size="icon-sm" aria-label={label} {...props}>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{label} <span className="opacity-60">{shortcut}</span>
			</TooltipContent>
		</Tooltip>
	);
}
