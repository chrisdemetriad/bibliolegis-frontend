import { LinkIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Panel } from "#/shell/page";
import { ArticleImage, pressDate } from "./PressFeed";
import { useAddPressLink, usePreviewPressLink } from "./queries";

// Paste a link, see what the page says about itself, then add it. The
// preview saves nothing, so a wrong link costs nothing
export function AddLink({
	projectRef,
	onDone,
}: {
	projectRef: string;
	onDone: () => void;
}) {
	const [url, setUrl] = useState("");
	const preview = usePreviewPressLink();
	const add = useAddPressLink(projectRef);
	const page = preview.data;

	return (
		<Panel className="mb-4 p-4">
			<form
				className="flex gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (url.trim()) preview.mutate(url.trim());
				}}
			>
				<Input
					autoFocus
					type="url"
					required
					placeholder="Paste a link to an article"
					value={url}
					onChange={(event) => {
						setUrl(event.target.value);
						preview.reset();
					}}
				/>
				<Button type="submit" variant="outline" disabled={preview.isPending}>
					{preview.isPending ? "Reading…" : "Preview"}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Cancel"
					onClick={onDone}
				>
					<XIcon />
				</Button>
			</form>
			{preview.isError && (
				<p className="mt-2 text-sm text-destructive">
					{errorMessage(preview.error, "Couldn't read that page.")}
				</p>
			)}
			{page && (
				<div className="mt-4 flex gap-4">
					<ArticleImage
						src={page.image_url}
						className="hidden aspect-[4/3] w-28 shrink-0 rounded-md sm:flex"
					/>
					<div className="min-w-0 flex-1">
						<p className="text-xs text-muted-foreground">
							<span className="font-medium text-foreground">
								{page.site_name}
							</span>{" "}
							· {pressDate(page.published_at)}
						</p>
						<p className="mt-1 font-medium">{page.title}</p>
						{page.description && (
							<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
								{page.description}
							</p>
						)}
						<Button
							size="sm"
							className="mt-3"
							disabled={add.isPending}
							onClick={() =>
								add.mutate(page.url, {
									onSuccess: () => {
										toast.success("Article added to this matter");
										onDone();
									},
									onError: (error) =>
										toast.error(
											errorMessage(error, "Couldn't add that article."),
										),
								})
							}
						>
							<LinkIcon /> Add to this matter
						</Button>
					</div>
				</div>
			)}
		</Panel>
	);
}
