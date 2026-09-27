import { ArrowRightIcon, QuoteIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Panel } from "./page";

// Stands in for the query box until the api has POST /query. It shows what an
// answer with citations will look like, it never sends anything
export function AskBox({
	placeholder,
	scope,
}: {
	placeholder: string;
	scope: string;
}) {
	const [question, setQuestion] = useState("");
	const [asked, setAsked] = useState<string | null>(null);

	const submit = () => setAsked(question.trim() || placeholder);

	return (
		<div className="space-y-3">
			<Panel className="p-4 focus-within:border-ring">
				<textarea
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							submit();
						}
					}}
					rows={2}
					placeholder={placeholder}
					aria-label={`Ask about ${scope}`}
					className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground"
				/>
				<div className="mt-2 flex items-center gap-3">
					<p className="flex-1 text-xs text-muted-foreground">
						Answers cite the record and the authorities. Nothing is saved unless
						you keep it.
					</p>
					<kbd className="rounded border px-1 text-[0.7rem] text-muted-foreground max-sm:hidden">
						⌘↵
					</kbd>
					<Button size="sm" onClick={submit}>
						Ask <ArrowRightIcon />
					</Button>
				</div>
			</Panel>

			{asked && (
				<Panel className="p-4">
					<div className="flex items-center gap-2 text-sm font-medium">
						<SparklesIcon className="size-4" />
						{asked}
					</div>
					<p className="mt-3 text-sm leading-relaxed text-foreground/90">
						This is where the answer will appear once the query endpoint exists.
						Each claim in it will carry a numbered citation
						<sup className="px-0.5 text-muted-foreground">1</sup>
						that opens the source document at the quoted passage
						<sup className="px-0.5 text-muted-foreground">2</sup>.
					</p>
					<div className="mt-4 space-y-2">
						{[
							"Witness statement of Claire Dunmore, para 14",
							"Exhibit CD2, LinkedIn messages, p. 3",
						].map((source, i) => (
							<div
								key={source}
								className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"
							>
								<QuoteIcon className="mt-0.5 size-3 shrink-0" />
								<span>
									<span className="font-medium text-foreground">{i + 1}.</span>{" "}
									{source}
								</span>
							</div>
						))}
					</div>
				</Panel>
			)}
		</div>
	);
}
