import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon, SparklesIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { sampleChronology } from "#/mock/data";
import { SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/chronology")({
	component: Chronology,
});

function Chronology() {
	return (
		<div>
			<SectionTitle
				action={
					<div className="flex gap-2">
						<Button size="sm" variant="outline">
							<SparklesIcon /> Rebuild from documents
						</Button>
						<Button size="sm" variant="outline">
							<DownloadIcon /> Export to Word
						</Button>
					</div>
				}
			>
				Chronology
			</SectionTitle>
			<p className="-mt-1 mb-6 text-sm text-muted-foreground">
				Drafted from the documents, every entry linked to where it came from.
				Disputed facts are marked so they don't slip into an agreed chronology.
			</p>
			<ol className="relative ml-2 border-l">
				{sampleChronology.map((entry) => (
					<li key={entry.event} className="relative pb-6 pl-6 last:pb-0">
						<span className="absolute top-1.5 -left-[4.5px] size-2 rounded-full border bg-background" />
						<p className="text-xs text-muted-foreground">{entry.date}</p>
						<p className="mt-0.5 text-sm">{entry.event}</p>
						<div className="mt-1 flex flex-wrap gap-2 text-xs">
							<span className="text-muted-foreground underline decoration-dotted underline-offset-2">
								{entry.source}
							</span>
							{entry.disputed && (
								<span className="rounded-md border border-warning-border bg-warning px-1.5 text-warning-foreground">
									Disputed
								</span>
							)}
						</div>
					</li>
				))}
			</ol>
		</div>
	);
}
