import { FileText, Quote } from "lucide-react";

// A picture of the product rather than a stock photo of one. Every name in it
// is invented, and it says so
export function ChatPreview() {
	return (
		<div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink/80 p-5 text-left text-white shadow-2xl shadow-black/40 backdrop-blur-md">
			<div className="mb-4 flex items-center justify-between text-xs text-white/50">
				<span>Mackenzie v Newman</span>
				<span>Example, names invented</span>
			</div>

			<div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-white/10 px-3.5 py-2.5 text-sm">
				When was Newman first interviewed and what did he say about the van?
			</div>

			<div className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
				<p>
					He was interviewed under caution on 14 March 2025 at Brighton custody
					centre
					<Cite n={1} />. He said the van was parked outside his brother's flat
					and he hadn't driven it that week
					<Cite n={2} />.
				</p>
				<figure className="rounded-lg border border-brass/30 bg-brass/10 p-3">
					<Quote className="mb-1 size-3.5 text-brass" />
					<blockquote className="font-logo text-base italic text-white/90">
						“It was outside my brother's. I never had the keys that week.”
					</blockquote>
					<figcaption className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
						<FileText className="size-3" /> Record of interview, page 7
					</figcaption>
				</figure>
			</div>

			<div className="mt-4 flex flex-wrap gap-2 text-xs">
				<Source n={1} label="Custody record, page 2" />
				<Source n={2} label="Record of interview, page 7" />
			</div>
		</div>
	);
}

function Cite({ n }: { n: number }) {
	return (
		<sup className="ml-0.5 rounded bg-brass/20 px-1 font-medium text-brass">
			{n}
		</sup>
	);
}

function Source({ n, label }: { n: number; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-white/70">
			<span className="font-medium text-brass">{n}</span>
			{label}
		</span>
	);
}
