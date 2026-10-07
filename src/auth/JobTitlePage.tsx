import { useEffect, useState } from "react";
import { errorMessage } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useMe, useSaveJobTitle } from "./queries";

// A page inside Clerk's account modal. Clerk's own Profile page can't take
// extra fields, so the title gets its own tab beside it
export function JobTitlePage() {
	const { data: me } = useMe();
	const save = useSaveJobTitle();
	const [value, setValue] = useState("");
	const saved = me?.job_title ?? "";

	useEffect(() => {
		setValue(saved);
	}, [saved]);

	return (
		<div className="flex flex-col gap-4">
			<div className="border-b pb-4">
				<h1 className="text-[17px] font-semibold">Job title</h1>
			</div>
			<form
				className="flex flex-col gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					save.mutate(value);
				}}
			>
				<Label htmlFor="job-title">Shown under your name around the app</Label>
				<Input
					id="job-title"
					value={value}
					maxLength={100}
					placeholder="Senior associate"
					disabled={!me}
					onChange={(event) => {
						save.reset();
						setValue(event.target.value);
					}}
				/>
				<div className="flex items-center gap-3">
					<Button
						type="submit"
						size="sm"
						disabled={!me || save.isPending || value.trim() === saved}
					>
						{save.isPending ? "Saving…" : "Save"}
					</Button>
					{save.isSuccess && (
						<span className="text-sm text-muted-foreground">Saved</span>
					)}
					{save.isError && (
						<span className="text-sm text-destructive">
							{errorMessage(save.error, "Couldn't save your job title.")}
						</span>
					)}
				</div>
			</form>
		</div>
	);
}
