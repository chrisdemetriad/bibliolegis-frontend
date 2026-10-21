import { useUser } from "@clerk/tanstack-react-start";
import {
	CircleCheckIcon,
	ImageIcon,
	ImagePlusIcon,
	MessageSquareHeartIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { errorMessage, type FeedbackKind } from "#/api/client";
import { useApi } from "#/api/useApi";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { formatBytes } from "#/documents/format";

const kinds: { value: FeedbackKind; label: string }[] = [
	{ value: "problem", label: "Problem" },
	{ value: "idea", label: "Idea" },
	{ value: "question", label: "Question" },
];

// The same ceilings as the api, so a message that would be refused is caught
// before anything is sent
const MAX_SCREENSHOTS = 10;
const MAX_SCREENSHOTS_BYTES = 25 * 1024 * 1024;

// How long the thank you stays up before the dialog closes itself
const CLOSE_AFTER_MS = 2500;

type Screenshot = {
	id: string;
	file: File;
	url: string;
	size?: { width: number; height: number };
};

type Errors = { name?: string; message?: string; screenshots?: string };

export function FeedbackButton() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					aria-label="Send feedback"
					className="bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-sm hover:opacity-90 max-sm:size-7 max-sm:px-0"
				>
					<MessageSquareHeartIcon />
					<span className="max-sm:hidden">Feedback</span>
				</Button>
			</DialogTrigger>
			{open && <FeedbackForm onDone={() => setOpen(false)} />}
		</Dialog>
	);
}

// Mounted only while the dialog is open, so every opening starts from a
// clean form and picks up the page it was opened on
function FeedbackForm({ onDone }: { onDone: () => void }) {
	const api = useApi();
	const { user } = useUser();
	const [kind, setKind] = useState<FeedbackKind>("problem");
	const [name, setName] = useState(user?.fullName ?? "");
	const [message, setMessage] = useState("");
	const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
	const [errors, setErrors] = useState<Errors>({});
	const [sendError, setSendError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [sent, setSent] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [preview, setPreview] = useState<Screenshot | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const pageUrl = window.location.href;

	// Object urls hold the image in memory until revoked
	const urls = useRef(new Set<string>());
	useEffect(() => {
		const held = urls.current;
		return () => {
			for (const url of held) URL.revokeObjectURL(url);
		};
	}, []);

	useEffect(() => {
		if (!sent) return;
		const timer = setTimeout(onDone, CLOSE_AFTER_MS);
		return () => clearTimeout(timer);
	}, [sent, onDone]);

	function add(files: File[]) {
		const images = files.filter((file) => file.type.startsWith("image/"));
		const room = MAX_SCREENSHOTS - screenshots.length;
		setErrors((e) => ({
			...e,
			screenshots:
				images.length < files.length
					? "Only images can be attached."
					: images.length > room
						? `Up to ${MAX_SCREENSHOTS} images can go with one message.`
						: undefined,
		}));
		const added = images.slice(0, Math.max(room, 0)).map((file, i) => {
			const url = URL.createObjectURL(file);
			urls.current.add(url);
			// Pasted images all arrive called image.png
			const named =
				file.name && file.name !== "image.png"
					? file
					: new File([file], `Pasted image ${screenshots.length + i + 1}.png`, {
							type: file.type,
						});
			return { id: crypto.randomUUID(), file: named, url };
		});
		if (added.length > 0) setScreenshots((current) => [...current, ...added]);
	}

	function remove(id: string) {
		const gone = screenshots.find((s) => s.id === id);
		if (gone) {
			URL.revokeObjectURL(gone.url);
			urls.current.delete(gone.url);
		}
		setScreenshots((current) => current.filter((s) => s.id !== id));
		setErrors((e) => ({ ...e, screenshots: undefined }));
	}

	async function submit() {
		const next: Errors = {};
		if (!name.trim()) next.name = "Please add your name.";
		if (!message.trim()) next.message = "Please say what's on your mind.";
		const total = screenshots.reduce((sum, s) => sum + s.file.size, 0);
		if (total > MAX_SCREENSHOTS_BYTES) {
			next.screenshots = "The images come to more than 25MB together.";
		}
		setErrors(next);
		if (Object.keys(next).length > 0) return;

		setPending(true);
		setSendError(null);
		try {
			await api.sendFeedback({
				kind,
				name: name.trim(),
				message: message.trim(),
				pageUrl,
				screenshots: screenshots.map((s) => s.file),
			});
			setSent(true);
		} catch (caught) {
			setSendError(errorMessage(caught, "Couldn't send it, try again."));
		} finally {
			setPending(false);
		}
	}

	if (sent) {
		return (
			<DialogContent className="sm:max-w-md">
				<div className="flex flex-col items-center gap-3 py-6 text-center">
					<CircleCheckIcon className="size-10 text-emerald-500" />
					<DialogTitle>Thanks, that's been sent</DialogTitle>
					<DialogDescription>
						If we need more detail we'll reply to your email.
					</DialogDescription>
				</div>
			</DialogContent>
		);
	}

	return (
		<DialogContent
			className="sm:max-w-lg"
			onInteractOutside={(event) => {
				// A click outside shouldn't throw away a half written message
				if (message.trim() || screenshots.length > 0) event.preventDefault();
			}}
			onDragOver={(event) => {
				if (!event.dataTransfer.types.includes("Files")) return;
				event.preventDefault();
				setDragging(true);
			}}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) {
					setDragging(false);
				}
			}}
			onDrop={(event) => {
				event.preventDefault();
				setDragging(false);
				add(Array.from(event.dataTransfer.files));
			}}
			onPaste={(event) => {
				const files = Array.from(event.clipboardData.files);
				if (files.length === 0) return;
				// Leave plain text pastes alone
				event.preventDefault();
				add(files);
			}}
		>
			{dragging && (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-fuchsia-500 bg-popover/90 text-sm font-medium">
					<ImagePlusIcon className="mr-2 size-4 text-fuchsia-500" />
					Drop images to attach them
				</div>
			)}
			<form
				className="contents"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span className="flex size-7 items-center justify-center rounded-md bg-linear-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white">
							<MessageSquareHeartIcon className="size-4" />
						</span>
						Send us feedback
					</DialogTitle>
					<DialogDescription>
						Spotted a problem, got an idea or a question? It comes straight to
						the team building Bibliolegis.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
					<div className="grid gap-1.5">
						<Label htmlFor="feedback-kind">Type</Label>
						<Select
							value={kind}
							onValueChange={(value) => setKind(value as FeedbackKind)}
						>
							<SelectTrigger id="feedback-kind" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{kinds.map((k) => (
									<SelectItem key={k.value} value={k.value}>
										{k.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="feedback-name">Your name</Label>
						<Input
							id="feedback-name"
							value={name}
							maxLength={200}
							aria-invalid={errors.name !== undefined}
							onChange={(event) => {
								setName(event.target.value);
								setErrors((e) => ({ ...e, name: undefined }));
							}}
						/>
						{errors.name && (
							<p role="alert" className="text-xs text-destructive">
								{errors.name}
							</p>
						)}
					</div>
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="feedback-page">Page</Label>
					<Input id="feedback-page" value={pageUrl} disabled readOnly />
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="feedback-message">Message</Label>
					<div className="relative">
						<Textarea
							id="feedback-message"
							autoFocus
							value={message}
							maxLength={20_000}
							rows={5}
							className="max-h-64 min-h-28"
							aria-describedby={message ? undefined : "feedback-hint"}
							aria-invalid={errors.message !== undefined}
							onChange={(event) => {
								setMessage(event.target.value);
								setErrors((e) => ({ ...e, message: undefined }));
							}}
						/>
						{/* A placeholder attribute can only hold plain text, the keys
						need to be drawn as keys */}
						{!message && (
							<p
								id="feedback-hint"
								className="pointer-events-none absolute inset-x-2.5 top-2 text-base leading-relaxed text-muted-foreground md:text-sm"
							>
								You can drop screenshots or paste images on here with{" "}
								<KbdGroup>
									<Kbd>⌘</Kbd>
									<Kbd>V</Kbd>
								</KbdGroup>{" "}
								or{" "}
								<KbdGroup>
									<Kbd>Ctrl</Kbd>
									<Kbd>V</Kbd>
								</KbdGroup>{" "}
								to point out any issues.
							</p>
						)}
					</div>
					{errors.message && (
						<p role="alert" className="text-xs text-destructive">
							{errors.message}
						</p>
					)}
				</div>

				{screenshots.length > 0 && (
					<ul className="flex flex-wrap gap-2" aria-label="Attached images">
						{screenshots.map((s) => (
							<ScreenshotChip
								key={s.id}
								screenshot={s}
								onLoad={(size) =>
									setScreenshots((current) =>
										current.map((c) => (c.id === s.id ? { ...c, size } : c)),
									)
								}
								onOpen={() => setPreview(s)}
								onRemove={() => remove(s.id)}
							/>
						))}
					</ul>
				)}
				<Dialog
					open={preview !== null}
					onOpenChange={(next) => {
						if (!next) setPreview(null);
					}}
				>
					{/* Nested, so Esc and its close button only shut the preview and
					leave the feedback form open behind it */}
					<DialogContent className="max-h-[90vh] p-2 sm:max-w-[min(90vw,72rem)]">
						<DialogTitle className="truncate pt-1.5 pr-10 pl-1.5 text-sm">
							{preview?.file.name}
						</DialogTitle>
						<DialogDescription className="sr-only">
							A preview of the attached image
						</DialogDescription>
						{preview && (
							<img
								src={preview.url}
								alt={preview.file.name}
								className="max-h-[calc(90vh-4rem)] w-full rounded-lg object-contain"
							/>
						)}
					</DialogContent>
				</Dialog>
				{errors.screenshots && (
					<p role="alert" className="-mt-2 text-xs text-destructive">
						{errors.screenshots}
					</p>
				)}
				{sendError && (
					<p role="alert" className="text-sm text-destructive">
						{sendError}
					</p>
				)}

				<DialogFooter className="sm:justify-between">
					<input
						ref={fileInput}
						type="file"
						accept="image/*"
						multiple
						hidden
						onChange={(event) => {
							add(Array.from(event.target.files ?? []));
							event.target.value = "";
						}}
					/>
					<Button
						type="button"
						variant="outline"
						disabled={pending}
						onClick={() => fileInput.current?.click()}
					>
						<ImagePlusIcon />
						Add images
					</Button>
					<Button type="submit" disabled={pending}>
						{pending ? "Sending…" : "Send"}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}

function ScreenshotChip({
	screenshot,
	onLoad,
	onOpen,
	onRemove,
}: {
	screenshot: Screenshot;
	onLoad: (size: { width: number; height: number }) => void;
	onOpen: () => void;
	onRemove: () => void;
}) {
	const { file, url, size } = screenshot;
	return (
		<li className="group relative flex max-w-56 items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-7 pl-1">
			<button
				type="button"
				onClick={onOpen}
				className="shrink-0 cursor-zoom-in rounded"
				aria-label={`Preview ${file.name}`}
			>
				<img
					src={url}
					alt=""
					className="size-8 rounded object-cover"
					onLoad={(event) =>
						onLoad({
							width: event.currentTarget.naturalWidth,
							height: event.currentTarget.naturalHeight,
						})
					}
				/>
			</button>
			<div className="min-w-0 text-xs leading-tight">
				<p className="flex items-center gap-1 truncate font-medium">
					<ImageIcon className="size-3 shrink-0 text-muted-foreground" />
					<span className="truncate">{file.name}</span>
				</p>
				<p className="text-muted-foreground">
					{size ? `${size.width}×${size.height}` : formatBytes(file.size)}
				</p>
			</div>
			<button
				type="button"
				aria-label={`Remove ${file.name}`}
				onClick={onRemove}
				className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
			>
				<XIcon className="size-3.5" />
			</button>
		</li>
	);
}
