import { useNavigate } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import type { Document } from "#/api/client";
import { Button } from "#/components/ui/button";
import { DeleteFileDialog } from "./FileDialogs";
import { useDeleteDocument } from "./queries";

export function DeleteDocument({ document }: { document: Document }) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const remove = useDeleteDocument();

	return (
		<>
			<Button variant="destructive" onClick={() => setOpen(true)}>
				<Trash2Icon data-icon="inline-start" />
				Delete
			</Button>
			<DeleteFileDialog
				name={document.filename}
				open={open}
				onOpenChange={setOpen}
				onDelete={async () => {
					await remove.mutateAsync(document.id);
					navigate({ to: "/matters" });
				}}
			/>
		</>
	);
}
