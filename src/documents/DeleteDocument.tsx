import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ApiError, type Document, errorMessage } from "#/api/client";
import { useApi } from "#/api/useApi";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { documentKeys } from "./queries";

export function DeleteDocument({ document }: { document: Document }) {
	const api = useApi();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);

	const remove = useMutation({
		mutationFn: () => api.deleteDocument(document.id),
		onSuccess: async () => {
			queryClient.removeQueries({
				queryKey: documentKeys.detail(document.id),
			});
			await queryClient.invalidateQueries({ queryKey: documentKeys.list() });
			navigate({ to: "/documents" });
		},
	});

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				// Closing mid delete would hide whether it worked
				if (remove.isPending) return;
				setOpen(next);
				if (!next) remove.reset();
			}}
		>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<Trash2Icon data-icon="inline-start" />
					Delete
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {document.filename}?</AlertDialogTitle>
					<AlertDialogDescription>
						This deletes the file and everything read out of it, for everyone
						who can see it. It stops turning up in answers straight away and
						can't be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{remove.isError && (
					<p role="alert" className="text-sm text-destructive">
						{remove.error instanceof ApiError && remove.error.status === 404
							? "It's already been deleted, or you no longer have access to it."
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
							remove.mutate();
						}}
					>
						{remove.isPending ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
