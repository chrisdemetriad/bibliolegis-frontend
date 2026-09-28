import { EllipsisIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { cn } from "#/lib/utils";
import { useDeleteMatter } from "./queries";

// The three dots menu on a matter's row and its header. Delete is the only
// thing in it so far
export function MatterMenu({
	projectId,
	title,
	documents,
	onDeleted,
	className,
}: {
	projectId: string;
	title: string;
	documents: number;
	onDeleted?: () => unknown;
	className?: string;
}) {
	const [confirming, setConfirming] = useState(false);
	const remove = useDeleteMatter(onDeleted);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`More for ${title}`}
						className={cn("text-muted-foreground", className)}
					>
						<EllipsisIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setConfirming(true)}
					>
						<Trash2Icon /> Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={confirming}
				onOpenChange={(next) => {
					// Closing mid delete would hide whether it worked
					if (remove.isPending) return;
					setConfirming(next);
					if (!next) remove.reset();
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {title}?</AlertDialogTitle>
						<AlertDialogDescription>
							This deletes the matter
							{documents === 1
								? " and its 1 document"
								: documents > 1
									? ` and all ${documents.toLocaleString("en-GB")} of its documents`
									: ""}{" "}
							along with everything read from them, for everyone on it. It can't
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{remove.isError && (
						<p role="alert" className="text-sm text-destructive">
							{remove.error instanceof ApiError && remove.error.status === 404
								? "It's already been deleted, or you're no longer on it."
								: errorMessage(remove.error, "Couldn't delete it, try again.")}
						</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={remove.isPending}>
							Keep it
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={remove.isPending}
							onClick={(event) => {
								// The dialog would close on click otherwise, before the api
								// has answered
								event.preventDefault();
								remove.mutate(projectId, {
									onSuccess: () => setConfirming(false),
								});
							}}
						>
							{remove.isPending ? "Deleting…" : "Delete matter"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
