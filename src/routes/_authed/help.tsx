import { createFileRoute } from "@tanstack/react-router";
import {
	BookOpenIcon,
	KeyboardIcon,
	MailIcon,
	ShieldIcon,
	SparklesIcon,
} from "lucide-react";
import { Kbd } from "#/components/ui/kbd";
import { Page, PageHeader, Panel, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/help")({
	component: HelpPage,
});

const guides = [
	{
		icon: BookOpenIcon,
		title: "Getting started",
		body: "Open a matter, add its files and ask your first question.",
	},
	{
		icon: SparklesIcon,
		title: "Asking good questions",
		body: "How to phrase a question so the answer cites what you need.",
	},
	{
		icon: ShieldIcon,
		title: "Confidentiality",
		body: "Who can see a matter, and what's recorded when someone asks about it.",
	},
	{
		icon: MailIcon,
		title: "Contact support",
		body: "Email support or book a call. We reply within one working day.",
	},
];

const shortcuts = [
	["Search", "⌘ K"],
	["Toggle the sidebar", "⌘ B"],
	["Send a question", "⌘ ↵"],
	["Go to overview", "G then O"],
	["Go to matters", "G then M"],
];

const changes = [
	{
		date: "27 Sep 2026",
		text: "Choose which model answers your questions, in Settings.",
	},
	{
		date: "25 Sep 2026",
		text: "Upload several documents at once and watch each one being read.",
	},
	{ date: "22 Sep 2026", text: "Scanned PDFs are now read with OCR." },
];

function HelpPage() {
	return (
		<Page>
			<PageHeader
				title="Help"
				description="Guides, shortcuts and what's changed recently."
			/>

			<div className="mb-8 grid gap-3 sm:grid-cols-2">
				{guides.map((guide) => (
					<Panel key={guide.title} className="flex gap-3 p-4 hover:bg-muted/40">
						<guide.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">{guide.title}</p>
							<p className="mt-0.5 text-sm text-muted-foreground">
								{guide.body}
							</p>
						</div>
					</Panel>
				))}
			</div>

			<div className="grid gap-8 md:grid-cols-2">
				<section>
					<SectionTitle>
						<span className="flex items-center gap-2">
							<KeyboardIcon className="size-4" /> Keyboard shortcuts
						</span>
					</SectionTitle>
					<Panel className="divide-y text-sm">
						{shortcuts.map(([label, keys]) => (
							<div key={label} className="flex justify-between px-4 py-2.5">
								<span>{label}</span>
								<Kbd>{keys}</Kbd>
							</div>
						))}
					</Panel>
				</section>
				<section>
					<SectionTitle>What's new</SectionTitle>
					<div className="space-y-3">
						{changes.map((change) => (
							<div key={change.text}>
								<p className="text-xs text-muted-foreground">{change.date}</p>
								<p className="text-sm">{change.text}</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</Page>
	);
}
