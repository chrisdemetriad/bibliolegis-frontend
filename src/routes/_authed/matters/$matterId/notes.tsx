import { createFileRoute } from "@tanstack/react-router";
import { MicIcon, PlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { sampleNotes } from "#/mock/data";
import { Panel, PersonAvatar, personName, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/notes")({
	component: Notes,
});

function Notes() {
	return (
		<div>
			<SectionTitle
				action={
					<div className="flex gap-2">
						<Button size="sm" variant="outline">
							<MicIcon /> Dictate
						</Button>
						<Button size="sm" variant="outline">
							<PlusIcon /> New note
						</Button>
					</div>
				}
			>
				Notes
			</SectionTitle>
			<div className="space-y-2">
				{sampleNotes.map((note) => (
					<Panel key={note.title} className="px-4 py-3.5">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span className="rounded-md border px-1.5 py-px">
								{note.kind}
							</span>
							<span className="ml-auto">{note.when}</span>
						</div>
						<p className="mt-2 font-medium">{note.title}</p>
						<p className="mt-1 text-sm text-muted-foreground">{note.body}</p>
						<div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
							<PersonAvatar id={note.by} className="size-5 text-[0.55rem]" />
							{personName(note.by)}
						</div>
					</Panel>
				))}
			</div>
		</div>
	);
}
