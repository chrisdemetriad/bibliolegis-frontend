import { useRef, useState } from "react";
import { ApiError, errorMessage } from "#/api/client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { splitName } from "./names";

// Both dialogs take the work to do as a promise rather than calling the api
// themselves, so the sample matter can rename and delete its stand ins the
// same way

export function RenameFileDialog({
	name,
	open,
	onOpenChange,
	isTaken,
	onRename,
}: {
	name: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// Checked before asking the api, which refuses a clash anyway
	isTaken: (filename: string) => boolean;
	onRename: (stem: string) => Promise<unknown>;
}) {
	const { stem, extension } = splitName(name);
	const [value, setValue] = useState(stem);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const input = useRef<HTMLInputElement>(null);

	function reset(next: boolean) {
		if (pending) return;
		if (next) setValue(stem);
		setError(null);
		onOpenChange(next);
	}

	async function submit() {
		// Someone typing the extension out of habit shouldn't end up with
		// "Letter.pdf.pdf"
		let wanted = value.trim();
		if (extension && wanted.toLowerCase().endsWith(extension.toLowerCase())) {
			wanted = wanted.slice(0, -extension.length).trim();
		}
		if (wanted === stem) return reset(false);
		if (!/[a-z0-9]/i.test(wanted)) {
			return setError("The name needs at least one letter or number.");
		}
		if (/[/\\]/.test(wanted)) {
			return setError("The name can't contain a slash.");
		}
		const filename = `${wanted}${extension}`;
		if (isTaken(filename)) {
			return setError(`There's already a file called ${filename} here.`);
		}
		setPending(true);
		setError(null);
		try {
			await onRename(wanted);
			setPending(false);
			onOpenChange(false);
		} catch (caught) {
			setPending(false);
			setError(
				caught instanceof ApiError && caught.status === 409
					? `There's already a file called ${filename} here.`
					: errorMessage(caught, "Couldn't rename it, try again."),
			);
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={reset}>
			<AlertDialogContent
				// An alert dialog focuses Cancel by default, here the name is what
				// someone opened it to change
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					input.current?.select();
				}}
			>
				<form
					className="contents"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
				>
					<AlertDialogHeader>
						<AlertDialogTitle>Rename {name}</AlertDialogTitle>
						<AlertDialogDescription>
							The extension stays as it is.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex items-center gap-2">
						<Input
							ref={input}
							aria-label="Name"
							aria-invalid={error !== null}
							value={value}
							maxLength={255}
							onChange={(event) => {
								setValue(event.target.value);
								setError(null);
							}}
						/>
						{extension && (
							<span className="shrink-0 text-sm text-muted-foreground">
								{extension}
							</span>
						)}
					</div>
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel type="button" disabled={pending}>
							Cancel
						</AlertDialogCancel>
						{/* A plain button rather than AlertDialogAction, which would
						close the dialog before the api has answered */}
						<Button type="submit" disabled={pending}>
							{pending ? "Renaming…" : "Rename"}
						</Button>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function DeleteFileDialog({
	name,
	open,
	onOpenChange,
	onDelete,
}: {
	name: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: () => Promise<unknown>;
}) {
	const [error, setError] = useState<unknown>(null);
	const [pending, setPending] = useState(false);

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				// Closing mid delete would hide whether it worked
				if (pending) return;
				setError(null);
				onOpenChange(next);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This deletes the file and everything read out of it, for everyone
						who can see it. It stops turning up in answers straight away and
						can't be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error !== null && (
					<p role="alert" className="text-sm text-destructive">
						{error instanceof ApiError && error.status === 404
							? "It's already been deleted, or you no longer have access to it."
							: errorMessage(error, "Couldn't delete it, try again.")}
					</p>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={async (event) => {
							event.preventDefault();
							setPending(true);
							setError(null);
							try {
								await onDelete();
								setPending(false);
								onOpenChange(false);
							} catch (caught) {
								setPending(false);
								setError(caught);
							}
						}}
					>
						{pending ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
