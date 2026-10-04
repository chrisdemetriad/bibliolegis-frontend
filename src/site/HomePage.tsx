import {
	ArrowRight,
	BookOpen,
	ChartColumn,
	Check,
	EyeOff,
	FileSearch,
	FolderInput,
	KeyRound,
	Mail,
	MessageSquareText,
	Mic,
	Newspaper,
	Quote,
	ScanText,
	ScrollText,
	ShieldCheck,
	Sparkles,
	Sunrise,
	Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { ChatPreview } from "./ChatPreview";
import { HoursCalculator } from "./HoursCalculator";
import { appHostUrl } from "./host";

// Photos are Unsplash placeholders, listed in public/marketing/CREDITS.md,
// to be swapped for bought or commissioned ones before launch
const img = (name: string) => `/marketing/${name}.jpg`;

export function HomePage() {
	return (
		<div className="bg-paper text-foreground">
			<SiteHeader />
			<main>
				<Hero />
				<Problem />
				<Features />
				<Numbers />
				<Security />
				<HowItWorks />
				<ComingSoon />
				<Faq />
				<FinalCta />
			</main>
			<SiteFooter />
		</div>
	);
}

function TryButton({ className = "" }: { className?: string }) {
	// A plain link rather than a routed one. Sign up only exists on app., a
	// different origin from wherever this renders, so this is a real
	// navigation rather than a client side route change
	return (
		<a
			href={appHostUrl("/sign-up")}
			className={`inline-flex h-11 items-center gap-2 rounded-full bg-brass px-6 text-sm font-medium text-ink transition-colors hover:bg-brass/85 ${className}`}
		>
			Try it now <ArrowRight className="size-4" />
		</a>
	);
}

function Container({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
			{children}
		</div>
	);
}

function Eyebrow({
	children,
	dark = false,
}: {
	children: ReactNode;
	dark?: boolean;
}) {
	return (
		<p
			className={`mb-4 text-xs font-medium tracking-[0.2em] uppercase ${dark ? "text-brass" : "text-brass-deep"}`}
		>
			{children}
		</p>
	);
}

function SiteHeader() {
	return (
		<header className="absolute inset-x-0 top-0 z-20">
			<Container className="flex h-20 items-center justify-between gap-6 text-white">
				<a href="/" className="font-logo text-6xl font-black tracking-normal">
					Bibliolegis
				</a>
				<nav className="hidden items-center gap-8 text-sm text-white/75 md:flex">
					<a href="#features" className="hover:text-white">
						Features
					</a>
					<a href="#security" className="hover:text-white">
						Security
					</a>
					<a href="#how" className="hover:text-white">
						How it works
					</a>
					<a href="#faq" className="hover:text-white">
						FAQ
					</a>
				</nav>
				<div className="flex items-center gap-5">
					<a
						href={appHostUrl("/sign-in")}
						className="hidden text-sm text-white/75 hover:text-white sm:block"
					>
						Sign in
					</a>
					<TryButton className="h-10 px-5" />
				</div>
			</Container>
		</header>
	);
}

function Hero() {
	return (
		<section className="relative overflow-hidden bg-ink pt-36 pb-24 text-white md:pt-44 md:pb-32">
			<img
				src={img("library-hero")}
				alt=""
				className="absolute inset-0 size-full object-cover opacity-30"
			/>
			<div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
			<Container className="relative grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
				<div>
					<Eyebrow dark>AI case intelligence for UK law firms</Eyebrow>
					<h1 className="font-logo text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
						Ask your case files <em className="text-brass">anything.</em>
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
						Bibliolegis reads every document in every matter, answers your
						questions in plain English and shows you the exact passage each
						answer came from. Securely, and only for the people allowed to see
						it.
					</p>
					<div className="mt-9 flex flex-wrap items-center gap-4">
						<TryButton />
						<a
							href="#how"
							className="inline-flex h-11 items-center rounded-full border border-white/25 px-6 text-sm text-white/85 hover:bg-white/10"
						>
							See how it works
						</a>
					</div>
					<ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
						{[
							"Every answer cited",
							"Access set per matter",
							"Every question audited",
						].map((t) => (
							<li key={t} className="flex items-center gap-2">
								<Check className="size-4 text-brass" /> {t}
							</li>
						))}
					</ul>
				</div>
				<div className="flex justify-center lg:justify-end">
					<ChatPreview />
				</div>
			</Container>
		</section>
	);
}

function Problem() {
	return (
		<section className="py-24 md:py-32">
			<Container className="grid gap-16 lg:grid-cols-2 lg:items-center">
				<div>
					<Eyebrow>The hidden cost</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						3pm on a Tuesday.
					</h2>
					<div className="mt-6 space-y-5 text-lg leading-relaxed text-muted-foreground">
						<p>
							Sarah is chasing a witness statement that should be in the system.
							Mark is rebuilding a report from three different places. Somebody
							is reading a 200 page bundle for the one line that matters.
						</p>
						<p>
							The real cost of scattered case files isn't the licence fee. It's
							the hours spent looking instead of billing.
						</p>
					</div>
				</div>
				<div className="space-y-4">
					<Scenario
						title="Monday morning"
						body="You need to know how many burglary matters came in this quarter. Instead of three systems, two spreadsheets and a prayer, you ask."
					/>
					<Scenario
						title="Your matters list"
						body="53 open matters, all shouting for attention. Ask which ones have a hearing this month and get the answer with the documents behind it."
					/>
					<Scenario
						title="A 40 page statement"
						body="Summarised in seconds, with every point linked back to the page it came from so you can check it before you rely on it."
					/>
				</div>
			</Container>
		</section>
	);
}

function Scenario({ title, body }: { title: string; body: string }) {
	return (
		<div className="rounded-2xl border bg-background p-6 shadow-sm">
			<p className="font-logo text-2xl">{title}</p>
			<p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
		</div>
	);
}

const features = [
	{
		icon: MessageSquareText,
		title: "Chat with your matters",
		body: "Ask about one matter or everything the firm holds. Follow up the way you would with a colleague, it remembers what you were talking about.",
	},
	{
		icon: Quote,
		title: "Answers you can check",
		body: "Every claim carries a numbered citation and the exact passage it rests on. If nothing in your files answers the question, it says so rather than guessing.",
	},
	{
		icon: FolderInput,
		title: "Drop in files, get matters back",
		body: "Drag in a pile of case files. Bibliolegis works out which case each belongs to, names the matter and pulls out the parties, court, reference and key dates.",
	},
	{
		icon: ScanText,
		title: "Reads scanned documents too",
		body: "PDFs, Word files and old scanned bundles. Pages without text are read by OCR, so the exhibit someone photocopied in 2019 is searchable too.",
	},
	{
		icon: Sparkles,
		title: "Your choice of AI model",
		body: "Pick the model that answers you, from OpenAI or Anthropic's Claude. The firm decides which ones are on offer.",
	},
	{
		icon: BookOpen,
		title: "A workspace for every matter",
		body: "Files, chronology, hearings, parties, notes and research in one place, with pinned matters a click away.",
	},
];

function Features() {
	return (
		<section id="features" className="bg-paper-deep py-24 md:py-32">
			<Container>
				<div className="max-w-2xl">
					<Eyebrow>What it does</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						Your files already hold the answers. Now you can ask for them.
					</h2>
				</div>

				<div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{features.map((f) => (
						<article
							key={f.title}
							className="rounded-2xl border bg-background p-7 shadow-sm"
						>
							<f.icon className="size-6 text-brass-deep" />
							<h3 className="mt-5 text-lg font-medium">{f.title}</h3>
							<p className="mt-2 leading-relaxed text-muted-foreground">
								{f.body}
							</p>
						</article>
					))}
				</div>

				<StatsFeature />
			</Container>
		</section>
	);
}

// The aggregation path gets its own panel, it's the thing a plain chatbot
// can't do and the breakdown is what keeps it honest
function StatsFeature() {
	const rows = [
		{ label: "Community order", n: 19 },
		{ label: "Fine", n: 12 },
		{ label: "Suspended sentence", n: 7 },
		{ label: "Immediate custody", n: 4 },
	];
	const max = Math.max(...rows.map((r) => r.n));
	return (
		<div className="mt-5 grid overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-2">
			<div className="p-7 md:p-10">
				<ChartColumn className="size-6 text-brass-deep" />
				<h3 className="mt-5 text-2xl font-medium">
					Questions that need counting, answered
				</h3>
				<p className="mt-3 leading-relaxed text-muted-foreground">
					“What's the typical sentence for shoplifting in Brighton?” isn't
					something a search box can answer. Bibliolegis reads the offence,
					court, date and sentence out of every case as it arrives, then counts
					across them. You get a breakdown by outcome and the number of cases
					behind it, never a bare average. When the sample is too small to mean
					much, it tells you.
				</p>
			</div>
			<div className="border-t bg-paper p-7 md:p-10 lg:border-t-0 lg:border-l">
				<p className="text-sm text-muted-foreground">
					Shoplifting, Brighton Magistrates', last 3 years
				</p>
				<p className="mt-1 text-sm font-medium">42 cases · example data</p>
				<div className="mt-6 space-y-4">
					{rows.map((r) => (
						<div key={r.label}>
							<div className="mb-1.5 flex justify-between text-sm">
								<span>{r.label}</span>
								<span className="tabular-nums text-muted-foreground">
									{r.n}
								</span>
							</div>
							<div className="h-2 rounded-full bg-paper-deep">
								<div
									className="h-2 rounded-full bg-brass-deep"
									style={{ width: `${(r.n / max) * 100}%` }}
								/>
							</div>
						</div>
					))}
				</div>
				<p className="mt-6 text-sm text-muted-foreground">
					Immediate custody: median 4 months, from 4 cases. Too few to call
					typical.
				</p>
			</div>
		</div>
	);
}

function Numbers() {
	return (
		<section className="relative overflow-hidden bg-ink py-24 text-white md:py-32">
			<img
				src={img("gavel")}
				alt=""
				className="absolute inset-0 size-full object-cover opacity-15"
			/>
			<Container className="relative">
				<div className="max-w-2xl">
					<Eyebrow dark>What an hour is worth</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						One hour a day, back in the diary.
					</h2>
					<p className="mt-5 text-lg leading-relaxed text-white/70">
						Work it out with your own figures. The hour spent hunting through
						bundles is an hour nobody can bill.
					</p>
				</div>
				<div className="mt-14">
					<HoursCalculator />
				</div>
				<p className="mt-8 text-xs text-white/40">
					An illustration from the numbers you enter, based on 220 working days
					a year. Not a promise of what any firm will save.
				</p>
			</Container>
		</section>
	);
}

const securityPoints = [
	{
		icon: Users,
		title: "Access set per matter",
		body: "Colleagues only see the matters they're on. A file someone can't open never appears in their search results or shapes their answers.",
	},
	{
		icon: ScrollText,
		title: "Every question on the record",
		body: "Who asked what, when, which model answered and which documents it read. An audit trail your COLP can actually use.",
	},
	{
		icon: KeyRound,
		title: "Encrypted throughout",
		body: "Files and data encrypted in transit and at rest, in a workspace that belongs to your firm alone.",
	},
	{
		icon: EyeOff,
		title: "Never used to train AI",
		body: "Your case files are sent to the model only to answer your question. They aren't used to train it.",
	},
];

function Security() {
	return (
		<section id="security" className="py-24 md:py-32">
			<Container className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
				<div className="relative">
					<img
						src={img("columns")}
						alt="Stone columns of a classical court building"
						className="aspect-[4/5] w-full rounded-2xl object-cover shadow-xl"
					/>
					<div className="absolute -right-4 -bottom-6 max-w-64 rounded-2xl bg-ink p-5 text-white shadow-2xl sm:-right-8">
						<ShieldCheck className="size-6 text-brass" />
						<p className="mt-3 font-logo text-xl leading-snug">
							Built for files that must never leak.
						</p>
					</div>
				</div>
				<div>
					<Eyebrow>Security and confidentiality</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						Your files private. Your permissions respected. Your questions
						logged.
					</h2>
					<p className="mt-5 text-lg leading-relaxed text-muted-foreground">
						Client files carry your duty of confidentiality with them.
						Bibliolegis was designed around that from the first line of code,
						with UK GDPR in mind.
					</p>
					<div className="mt-10 grid gap-8 sm:grid-cols-2">
						{securityPoints.map((p) => (
							<div key={p.title}>
								<p.icon className="size-5 text-brass-deep" />
								<h3 className="mt-3 font-medium">{p.title}</h3>
								<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
									{p.body}
								</p>
							</div>
						))}
					</div>
				</div>
			</Container>
		</section>
	);
}

const steps = [
	{
		title: "Drop in your files",
		body: "PDF, Word or scanned. As many as you like, a matter at a time or the whole archive.",
		image: "signing",
	},
	{
		title: "Bibliolegis reads them",
		body: "Text is pulled out, scans are read, and the key facts of each case are filed into matters you can open.",
		image: "shelves",
	},
	{
		title: "Ask, and check the source",
		body: "Type a question and get an answer with the passages behind it, one click from the original page.",
		image: "justice",
	},
];

function HowItWorks() {
	return (
		<section id="how" className="bg-paper-deep py-24 md:py-32">
			<Container>
				<div className="max-w-2xl">
					<Eyebrow>How it works</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						From a pile of files to answers in an afternoon.
					</h2>
				</div>
				<ol className="mt-14 grid gap-6 md:grid-cols-3">
					{steps.map((s, i) => (
						<li
							key={s.title}
							className="overflow-hidden rounded-2xl border bg-background shadow-sm"
						>
							<img
								src={img(s.image)}
								alt=""
								className="aspect-[3/2] w-full object-cover"
							/>
							<div className="p-7">
								<p className="font-logo text-4xl text-brass-deep">{i + 1}</p>
								<h3 className="mt-2 text-lg font-medium">{s.title}</h3>
								<p className="mt-2 leading-relaxed text-muted-foreground">
									{s.body}
								</p>
							</div>
						</li>
					))}
				</ol>
			</Container>
		</section>
	);
}

const upcoming = [
	{
		icon: Mic,
		title: "Ask out loud",
		body: "Hold a button between court and the office, ask about a matter and hear the answer, with the sources left on screen.",
	},
	{
		icon: Mail,
		title: "Your mailbox and diary",
		body: "Connect Outlook or Gmail and your questions reach the correspondence too. Private to you, never shared with colleagues.",
	},
	{
		icon: Sunrise,
		title: "A morning brief",
		body: "A few lines before the day starts: who you're meeting, what's in court and what's due, each linked to where it came from.",
	},
	{
		icon: Newspaper,
		title: "Press watch",
		body: "Coverage of your matters' parties and cases from national, legal and local titles, gathered for you.",
	},
];

function ComingSoon() {
	return (
		<section className="py-24 md:py-32">
			<Container>
				<div className="max-w-2xl">
					<Eyebrow>On the way</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						What we're building next.
					</h2>
				</div>
				<div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{upcoming.map((u) => (
						<article key={u.title} className="rounded-2xl border p-6">
							<div className="flex items-center justify-between">
								<u.icon className="size-5 text-brass-deep" />
								<span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs text-muted-foreground">
									Coming soon
								</span>
							</div>
							<h3 className="mt-5 font-medium">{u.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{u.body}
							</p>
						</article>
					))}
				</div>
			</Container>
		</section>
	);
}

const faqs = [
	{
		q: "Is this a case management system?",
		a: "No. Bibliolegis doesn't do time recording, billing or client accounts. It sits alongside whatever you use for those and makes the documents themselves searchable and answerable.",
	},
	{
		q: "What if the AI gets something wrong?",
		a: "Every answer shows the passages it relied on, so you can check it in seconds. When nothing in your files supports an answer, Bibliolegis says it couldn't find one rather than inventing it.",
	},
	{
		q: "Which files can I upload?",
		a: "PDF and Word documents, including scanned PDFs, which are read page by page.",
	},
	{
		q: "Can everyone in the firm see every file?",
		a: "Only if you want them to. Each matter has its own members, and a document in a matter someone isn't on stays invisible to them, in the file list and in every answer.",
	},
	{
		q: "Do the AI providers keep or train on our files?",
		a: "Your files are sent to the model you choose only to answer the question you asked, and aren't used for training.",
	},
];

function Faq() {
	return (
		<section id="faq" className="bg-paper-deep py-24 md:py-32">
			<Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
				<div>
					<Eyebrow>Questions</Eyebrow>
					<h2 className="font-logo text-4xl leading-tight md:text-5xl">
						Worth asking before you start.
					</h2>
					<FileSearch className="mt-8 size-10 text-brass-deep" />
				</div>
				<div className="divide-y rounded-2xl border bg-background">
					{faqs.map((f) => (
						<details key={f.q} className="group p-6">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
								{f.q}
								<span className="text-brass-deep transition-transform group-open:rotate-45">
									+
								</span>
							</summary>
							<p className="mt-3 leading-relaxed text-muted-foreground">
								{f.a}
							</p>
						</details>
					))}
				</div>
			</Container>
		</section>
	);
}

function FinalCta() {
	return (
		<section className="relative overflow-hidden bg-ink py-24 text-center text-white md:py-32">
			<img
				src={img("library-hero")}
				alt=""
				className="absolute inset-0 size-full object-cover opacity-15"
			/>
			<Container className="relative">
				<h2 className="mx-auto max-w-3xl font-logo text-4xl leading-tight md:text-6xl">
					Be in control of your files, not controlled by them.
				</h2>
				<p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
					Upload a matter and ask it a question. It takes a few minutes.
				</p>
				<div className="mt-10 flex justify-center">
					<TryButton />
				</div>
			</Container>
		</section>
	);
}

function SiteFooter() {
	return (
		<footer className="bg-ink text-white/50">
			<Container className="flex flex-col gap-4 border-t border-white/10 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
				<p className="font-logo text-2xl text-white">Bibliolegis</p>
				<p>© {new Date().getFullYear()} Bibliolegis. Photos from Unsplash.</p>
			</Container>
		</footer>
	);
}
