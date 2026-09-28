// Hardcoded sample data for the pages that have no api behind them yet. Every
// name, citation and article here is invented. Nothing in this file should be
// read as a real case, and a page using it says so with <SampleBadge />

export const TODAY = new Date("2026-09-27");

export const currentUser = {
	name: "Eleanor Whitfield",
	initials: "EW",
	role: "Senior associate",
	firm: "Harcourt Lane LLP",
};

export type Person = { name: string; initials: string; role: string };

export const people: Record<string, Person> = {
	eleanor: {
		name: "Eleanor Whitfield",
		initials: "EW",
		role: "Senior associate",
	},
	chris: { name: "Chris Demetriad", initials: "CD", role: "Partner" },
	priya: { name: "Priya Shah", initials: "PS", role: "Associate" },
	tom: { name: "Tom Ellery", initials: "TE", role: "Trainee solicitor" },
	maya: { name: "Maya Okafor", initials: "MO", role: "Paralegal" },
	daniel: { name: "Daniel Reeve", initials: "DR", role: "Legal executive" },
};

export type PracticeArea =
	| "Crime"
	| "Civil litigation"
	| "Commercial"
	| "Employment"
	| "Family"
	| "Personal injury"
	| "Property"
	| "Immigration"
	| "Private client"
	| "Regulatory";

export const practiceAreas: PracticeArea[] = [
	"Crime",
	"Civil litigation",
	"Commercial",
	"Employment",
	"Family",
	"Personal injury",
	"Property",
	"Immigration",
	"Private client",
	"Regulatory",
];

export type Stage = { name: string; date: string };

export type Issue = {
	title: string;
	findings: number;
	needsReview?: boolean;
	owner?: string;
	updated?: string;
};

export type Party = { name: string; role: string; ours?: boolean };

// The shape every matter page reads. Sample matters are written in it below,
// real ones are turned into it from the api by src/matters/adapt.ts
export type Matter = {
	// The slug, which is also the matter's address
	id: string;
	title: string;
	reference: string;
	area: PracticeArea | null;
	tags: string[];
	court: string;
	judge?: string;
	client: string;
	parties: Party[];
	stages: Stage[];
	stageIndex: number;
	nextDate: { label: string; date: string } | null;
	lead: string;
	team: string[];
	documents: number;
	updated: string;
	closed?: boolean;
	summary: string;
	alert?: { title: string; detail: string };
	issues: Issue[];
	suggestedQuestion: string;
	// Only on real matters. Its absence is what marks a matter as sample data
	projectId?: string;
	pinned?: boolean;
	// When the matter was opened, an ISO timestamp. Real matters only
	createdAt?: string;
	dates?: { label: string; date: string }[];
};

const criminalStages = (dates: string[]): Stage[] =>
	["Charge", "First appearance", "PTPH", "Trial", "Sentence"].map(
		(name, i) => ({ name, date: dates[i] ?? "" }),
	);

const civilStages = (dates: string[]): Stage[] =>
	["Pre action", "Claim issued", "Disclosure", "Witness evidence", "Trial"].map(
		(name, i) => ({ name, date: dates[i] ?? "" }),
	);

export const matters: Matter[] = [
	{
		id: "mackenzie-v-newman",
		title: "Mackenzie Holdings Ltd v Newman",
		reference: "KB-2025-004417",
		area: "Commercial",
		tags: ["Litigation", "Claimant"],
		court: "High Court, King's Bench Division",
		judge: "Mrs Justice Harwood",
		client: "Mackenzie Holdings Ltd",
		parties: [
			{
				name: "Mackenzie Holdings Ltd",
				role: "Claimant, our client",
				ours: true,
			},
			{ name: "John Newman", role: "Defendant" },
			{ name: "Newbridge Advisory Ltd", role: "Second defendant" },
		],
		stages: civilStages([
			"Nov 2024",
			"Filed 3 Mar 2025",
			"Closes 30 Oct 2026",
			"Due 11 Dec 2026",
			"Listed 8 Jun 2027",
		]),
		stageIndex: 2,
		nextDate: { label: "Disclosure closes", date: "2026-10-30" },
		lead: "chris",
		team: ["chris", "eleanor", "priya", "maya"],
		documents: 1284,
		updated: "2h ago",
		summary:
			"Breach of restrictive covenants and misuse of confidential client lists after the defendant left to set up a competing advisory firm.",
		alert: {
			title:
				"One finding relies on authority whose treatment changed after it was saved.",
			detail:
				"Carrow Group v Pellam was distinguished by the Court of Appeal on 18 Sep 2026.",
		},
		issues: [
			{
				title: "Enforceability of the 12 month non compete",
				findings: 3,
				owner: "Chris",
				updated: "Sep 24",
			},
			{
				title: "What counts as confidential information",
				findings: 4,
				needsReview: true,
				owner: "Priya",
				updated: "Sep 21",
			},
			{
				title: "Springboard injunction",
				findings: 1,
				owner: "Eleanor",
				updated: "Sep 12",
			},
			{ title: "Quantum and account of profits", findings: 0 },
		],
		suggestedQuestion:
			"Summarise the strongest arguments against enforcing the non compete clause.",
	},
	{
		id: "r-v-hollis",
		title: "R v Hollis",
		reference: "T20267731",
		area: "Crime",
		tags: ["Defence", "Legal aid"],
		court: "Crown Court at Lewes",
		judge: "HHJ Pemberton",
		client: "Callum Hollis",
		parties: [
			{ name: "Callum Hollis", role: "Defendant, our client", ours: true },
			{ name: "Crown Prosecution Service", role: "Prosecution" },
		],
		stages: criminalStages([
			"Charged 2 Jun 2026",
			"Brighton MC, 16 Jun",
			"14 Oct 2026",
			"Window from 12 Jan 2027",
			"",
		]),
		stageIndex: 1,
		nextDate: { label: "PTPH", date: "2026-10-14" },
		lead: "eleanor",
		team: ["eleanor", "tom", "daniel"],
		documents: 212,
		updated: "35m ago",
		summary:
			"Three counts of theft from shops in central Brighton over six weeks. Identification rests on CCTV stills and one store detective.",
		alert: {
			title: "Served evidence is missing a continuity statement.",
			detail:
				"Exhibit JM/4 (CCTV export) has no statement covering who handled it after download.",
		},
		issues: [
			{
				title: "Identification and Turnbull",
				findings: 5,
				owner: "Eleanor",
				updated: "Sep 26",
			},
			{
				title: "CCTV continuity",
				findings: 2,
				needsReview: true,
				owner: "Tom",
				updated: "Sep 25",
			},
			{
				title: "Likely sentence on a guilty plea",
				findings: 3,
				owner: "Daniel",
				updated: "Sep 19",
			},
			{ title: "Bad character application", findings: 0 },
		],
		suggestedQuestion:
			"What's the typical sentence for shop theft in Brighton with a guilty plea at PTPH?",
	},
	{
		id: "patel-v-southern-rail-services",
		title: "Patel v Southern Rail Services Ltd",
		reference: "ET 2304118/2026",
		area: "Employment",
		tags: ["Tribunal", "Claimant"],
		court: "London South Employment Tribunal",
		client: "Anita Patel",
		parties: [
			{ name: "Anita Patel", role: "Claimant, our client", ours: true },
			{ name: "Southern Rail Services Ltd", role: "Respondent" },
		],
		stages: [
			{ name: "ACAS conciliation", date: "Feb 2026" },
			{ name: "ET1 lodged", date: "14 Apr 2026" },
			{ name: "Preliminary hearing", date: "2 Sep 2026" },
			{ name: "Witness statements", date: "Due 6 Nov 2026" },
			{ name: "Final hearing", date: "3 days from 19 Jan 2027" },
		],
		stageIndex: 3,
		nextDate: { label: "Exchange witness statements", date: "2026-11-06" },
		lead: "priya",
		team: ["priya", "maya"],
		documents: 187,
		updated: "Yesterday",
		summary:
			"Unfair dismissal and whistleblowing detriment after the claimant reported falsified safety inspection records.",
		issues: [
			{
				title: "Was the disclosure protected",
				findings: 4,
				owner: "Priya",
				updated: "Sep 22",
			},
			{
				title: "Reason for dismissal",
				findings: 2,
				owner: "Priya",
				updated: "Sep 18",
			},
			{ title: "Remedy and schedule of loss", findings: 0 },
		],
		suggestedQuestion:
			"Which emails show the claimant raised safety concerns before March?",
	},
	{
		id: "estate-of-margaret-ashworth",
		title: "Re the Estate of Margaret Ashworth",
		reference: "PT-2026-000219",
		area: "Private client",
		tags: ["Contentious probate"],
		court: "High Court, Chancery Division",
		client: "Helen Ashworth (executor)",
		parties: [
			{ name: "Helen Ashworth", role: "Executor, our client", ours: true },
			{ name: "Robert Ashworth", role: "Caveator" },
		],
		stages: [
			{ name: "Caveat entered", date: "Jan 2026" },
			{ name: "Warning served", date: "Mar 2026" },
			{ name: "Claim issued", date: "May 2026" },
			{ name: "Disclosure", date: "Due 20 Nov 2026" },
			{ name: "Trial", date: "" },
		],
		stageIndex: 3,
		nextDate: { label: "Disclosure lists", date: "2026-11-20" },
		lead: "chris",
		team: ["chris", "daniel"],
		documents: 96,
		updated: "3 days ago",
		summary:
			"Challenge to a 2021 will on grounds of testamentary capacity and want of knowledge and approval.",
		issues: [
			{
				title: "Testamentary capacity",
				findings: 3,
				owner: "Daniel",
				updated: "Sep 20",
			},
			{
				title: "Knowledge and approval",
				findings: 1,
				owner: "Chris",
				updated: "Sep 10",
			},
		],
		suggestedQuestion:
			"What did the GP's notes say about her memory in the year before the will?",
	},
	{
		id: "harlow-v-harlow",
		title: "Harlow v Harlow",
		reference: "BV26D04411",
		area: "Family",
		tags: ["Financial remedy", "Applicant"],
		court: "Family Court at Brighton",
		client: "Sarah Harlow",
		parties: [
			{ name: "Sarah Harlow", role: "Applicant, our client", ours: true },
			{ name: "James Harlow", role: "Respondent" },
		],
		stages: [
			{ name: "Form A", date: "Apr 2026" },
			{ name: "First appointment", date: "8 Jul 2026" },
			{ name: "FDR", date: "22 Oct 2026" },
			{ name: "Final hearing", date: "" },
			{ name: "Order", date: "" },
		],
		stageIndex: 1,
		nextDate: { label: "FDR hearing", date: "2026-10-22" },
		lead: "eleanor",
		team: ["eleanor", "maya"],
		documents: 341,
		updated: "5 days ago",
		summary:
			"Financial remedy proceedings. The main dispute is whether the respondent's business interests were fully disclosed in his Form E.",
		issues: [
			{
				title: "Non disclosure in Form E",
				findings: 2,
				needsReview: true,
				owner: "Eleanor",
				updated: "Sep 23",
			},
			{
				title: "Valuation of Harlow Joinery Ltd",
				findings: 1,
				owner: "Maya",
				updated: "Sep 15",
			},
		],
		suggestedQuestion:
			"List every account in the bank statements that isn't in his Form E.",
	},
	{
		id: "brighton-council-v-kestrel-developments",
		title: "Brighton & Hove City Council v Kestrel Developments Ltd",
		reference: "CR-2026-118",
		area: "Regulatory",
		tags: ["Planning enforcement", "Defence"],
		court: "Brighton Magistrates' Court",
		client: "Kestrel Developments Ltd",
		parties: [
			{
				name: "Kestrel Developments Ltd",
				role: "Defendant, our client",
				ours: true,
			},
			{ name: "Brighton & Hove City Council", role: "Prosecuting authority" },
		],
		stages: criminalStages(["Summons Jul 2026", "4 Sep 2026", "", "", ""]),
		stageIndex: 1,
		nextDate: { label: "Case management hearing", date: "2026-10-08" },
		lead: "chris",
		team: ["chris", "tom"],
		documents: 58,
		updated: "1 week ago",
		summary:
			"Alleged breach of an enforcement notice over a rear extension on a listed building in Kemptown.",
		issues: [
			{
				title: "Validity of the enforcement notice",
				findings: 2,
				owner: "Tom",
				updated: "Sep 17",
			},
			{ title: "Reasonable excuse", findings: 0 },
		],
		suggestedQuestion: "When was the enforcement notice actually served?",
	},
	{
		id: "greaves-v-coastline-buses",
		title: "Greaves v Coastline Buses Ltd",
		reference: "K00BN412",
		area: "Personal injury",
		tags: ["Claimant", "Fast track"],
		court: "County Court at Brighton",
		client: "Martin Greaves",
		parties: [
			{ name: "Martin Greaves", role: "Claimant, our client", ours: true },
			{ name: "Coastline Buses Ltd", role: "Defendant" },
		],
		stages: civilStages([
			"Letter of claim, Jan 2026",
			"Filed 9 Jun 2026",
			"Due 13 Nov 2026",
			"Due 18 Dec 2026",
			"",
		]),
		stageIndex: 2,
		nextDate: { label: "Disclosure", date: "2026-11-13" },
		lead: "priya",
		team: ["priya", "tom"],
		documents: 143,
		updated: "4 days ago",
		summary:
			"Passenger thrown forward when a bus braked hard on the Old Steine. Fractured wrist, liability denied on the basis he wasn't holding a rail.",
		issues: [
			{
				title: "Was the braking reasonable",
				findings: 2,
				owner: "Priya",
				updated: "Sep 22",
			},
			{
				title: "Contributory negligence",
				findings: 1,
				owner: "Tom",
				updated: "Sep 16",
			},
			{ title: "Quantum, loss of earnings", findings: 0 },
		],
		suggestedQuestion:
			"What does the onboard CCTV show in the ten seconds before the stop?",
	},
	{
		id: "whitcombe-v-brightwell-builders",
		title: "Whitcombe v Brightwell Builders Ltd",
		reference: "L4QZ7731",
		area: "Civil litigation",
		tags: ["Claimant", "Construction"],
		court: "County Court at Brighton",
		client: "Rachel Whitcombe",
		parties: [
			{ name: "Rachel Whitcombe", role: "Claimant, our client", ours: true },
			{ name: "Brightwell Builders Ltd", role: "Defendant" },
		],
		stages: civilStages(["Mar 2026", "Filed 2 Jul 2026", "", "", ""]),
		stageIndex: 1,
		nextDate: { label: "Directions questionnaire", date: "2026-10-12" },
		lead: "daniel",
		team: ["daniel", "maya"],
		documents: 72,
		updated: "6 days ago",
		summary:
			"Defective loft conversion. The builder left after taking 80% of the price, and a surveyor has listed £41,000 of remedial work.",
		issues: [
			{
				title: "Breach of the implied term of reasonable skill",
				findings: 2,
				owner: "Daniel",
				updated: "Sep 18",
			},
			{ title: "Cost of cure versus diminution in value", findings: 0 },
		],
		suggestedQuestion:
			"Which defects in the surveyor's report did the builder admit by email?",
	},
	{
		id: "lanes-estates-v-farrow",
		title: "Lanes Estates Ltd v Farrow",
		reference: "BN-2026-PR-088",
		area: "Property",
		tags: ["Landlord", "Forfeiture"],
		court: "County Court at Brighton",
		client: "Lanes Estates Ltd",
		parties: [
			{ name: "Lanes Estates Ltd", role: "Landlord, our client", ours: true },
			{ name: "Oliver Farrow", role: "Tenant" },
		],
		stages: [
			{ name: "Section 146 notice", date: "Jun 2026" },
			{ name: "Claim issued", date: "Aug 2026" },
			{ name: "Relief application", date: "Hearing 3 Nov 2026" },
			{ name: "Trial", date: "" },
			{ name: "Possession", date: "" },
		],
		stageIndex: 2,
		nextDate: { label: "Relief from forfeiture hearing", date: "2026-11-03" },
		lead: "chris",
		team: ["chris", "maya"],
		documents: 64,
		updated: "1 week ago",
		summary:
			"Forfeiture of a commercial lease in the Lanes for unauthorised subletting. The tenant has applied for relief.",
		issues: [
			{
				title: "Waiver by accepting rent",
				findings: 2,
				needsReview: true,
				owner: "Chris",
				updated: "Sep 19",
			},
			{
				title: "Whether relief should be granted",
				findings: 1,
				owner: "Maya",
				updated: "Sep 14",
			},
		],
		suggestedQuestion:
			"Did we accept any rent after we knew about the subletting?",
	},
	{
		id: "ak-v-sshd",
		title: "AK v Secretary of State for the Home Department",
		reference: "HU/04418/2026",
		area: "Immigration",
		tags: ["Appellant", "Human rights"],
		court: "First-tier Tribunal (Immigration and Asylum Chamber)",
		client: "AK (anonymised)",
		parties: [
			{ name: "AK", role: "Appellant, our client", ours: true },
			{
				name: "Secretary of State for the Home Department",
				role: "Respondent",
			},
		],
		stages: [
			{ name: "Refusal", date: "Apr 2026" },
			{ name: "Appeal lodged", date: "May 2026" },
			{ name: "Appeal skeleton", date: "Due 16 Oct 2026" },
			{ name: "Substantive hearing", date: "" },
			{ name: "Decision", date: "" },
		],
		stageIndex: 2,
		nextDate: { label: "Appeal skeleton argument", date: "2026-10-16" },
		lead: "eleanor",
		team: ["eleanor", "tom"],
		documents: 118,
		updated: "2 days ago",
		summary:
			"Appeal against refusal of leave to remain on Article 8 grounds. Eleven years' residence and a British citizen child.",
		issues: [
			{
				title: "Best interests of the child",
				findings: 3,
				owner: "Eleanor",
				updated: "Sep 24",
			},
			{
				title: "Very significant obstacles to integration",
				findings: 1,
				owner: "Tom",
				updated: "Sep 20",
			},
		],
		suggestedQuestion:
			"What does the country evidence say about returnees without family support?",
	},
	{
		id: "r-v-doyle",
		title: "R v Doyle",
		reference: "MC-2026-0342",
		area: "Crime",
		tags: ["Defence", "Road traffic"],
		court: "Worthing Magistrates' Court",
		client: "Ciaran Doyle",
		parties: [
			{ name: "Ciaran Doyle", role: "Defendant, our client", ours: true },
			{ name: "Crown Prosecution Service", role: "Prosecution" },
		],
		stages: criminalStages(["Mar 2026", "Apr 2026", "", "", "22 Jul 2026"]),
		stageIndex: 4,
		nextDate: { label: "Closed", date: "2026-07-22" },
		lead: "daniel",
		team: ["daniel"],
		documents: 34,
		updated: "2 months ago",
		closed: true,
		summary:
			"Drink driving. Pleaded guilty, special reasons argument on the length of the ban was partly successful.",
		issues: [],
		suggestedQuestion: "What did the court say about special reasons?",
	},
];

export function findMatter(id: string) {
	return matters.find((matter) => matter.id === id);
}

export function daysUntil(date: string) {
	return Math.round(
		(new Date(date).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24),
	);
}

export function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// "13 Sept 2026, 18:16", in the viewer's own time zone
export function formatDateTime(iso: string) {
	return new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export type ActivityKind =
	| "upload"
	| "edit"
	| "comment"
	| "hearing"
	| "ai"
	| "press"
	| "authority";

export type Activity = {
	who: string;
	kind: ActivityKind;
	text: string;
	matterId?: string;
	target?: string;
	when: string;
};

export const activity: Activity[] = [
	{
		who: "chris",
		kind: "upload",
		text: "uploaded 3 photos to",
		matterId: "r-v-hollis",
		when: "12m ago",
	},
	{
		who: "priya",
		kind: "edit",
		text: "edited",
		target: "Witness statement of Sunil Mehta",
		matterId: "mackenzie-v-newman",
		when: "40m ago",
	},
	{
		who: "bibliolegis",
		kind: "ai",
		text: "finished reading 42 pages of disclosure in",
		matterId: "mackenzie-v-newman",
		when: "1h ago",
	},
	{
		who: "tom",
		kind: "hearing",
		text: "added a hearing, PTPH on 14 Oct, to",
		matterId: "r-v-hollis",
		when: "2h ago",
	},
	{
		who: "maya",
		kind: "comment",
		text: "commented on",
		target: "Form E, section 2.4",
		matterId: "harlow-v-harlow",
		when: "3h ago",
	},
	{
		who: "bibliolegis",
		kind: "authority",
		text: "flagged a change in treatment of Carrow Group v Pellam, cited in",
		matterId: "mackenzie-v-newman",
		when: "Yesterday",
	},
	{
		who: "bibliolegis",
		kind: "press",
		text: "found 2 new press mentions for",
		matterId: "brighton-council-v-kestrel-developments",
		when: "Yesterday",
	},
	{
		who: "daniel",
		kind: "upload",
		text: "uploaded the GP records bundle to",
		matterId: "estate-of-margaret-ashworth",
		when: "2 days ago",
	},
	{
		who: "priya",
		kind: "edit",
		text: "updated the schedule of loss in",
		matterId: "patel-v-southern-rail-services",
		when: "3 days ago",
	},
	{
		who: "eleanor",
		kind: "comment",
		text: "resolved 4 review flags in",
		matterId: "harlow-v-harlow",
		when: "4 days ago",
	},
];

export type FileCategory =
	| "Pleadings"
	| "Witness statements"
	| "Exhibits"
	| "Correspondence"
	| "Expert reports"
	| "Photos"
	| "Court orders";

export const fileCategories: FileCategory[] = [
	"Pleadings",
	"Witness statements",
	"Exhibits",
	"Correspondence",
	"Expert reports",
	"Photos",
	"Court orders",
];

export type MatterFile = {
	name: string;
	category: FileCategory;
	pages: number;
	added: string;
	by: string;
	status: "Read" | "Reading" | "Needs OCR";
};

export const sampleFiles: MatterFile[] = [
	{
		name: "Particulars of claim.pdf",
		category: "Pleadings",
		pages: 24,
		added: "3 Mar 2025",
		by: "chris",
		status: "Read",
	},
	{
		name: "Defence and counterclaim.pdf",
		category: "Pleadings",
		pages: 31,
		added: "14 Apr 2025",
		by: "priya",
		status: "Read",
	},
	{
		name: "Witness statement of Sunil Mehta (draft 3).docx",
		category: "Witness statements",
		pages: 12,
		added: "Today",
		by: "priya",
		status: "Reading",
	},
	{
		name: "Witness statement of Claire Dunmore.pdf",
		category: "Witness statements",
		pages: 9,
		added: "18 Sep 2026",
		by: "eleanor",
		status: "Read",
	},
	{
		name: "Exhibit CD1, client list export.xlsx",
		category: "Exhibits",
		pages: 1,
		added: "18 Sep 2026",
		by: "maya",
		status: "Read",
	},
	{
		name: "Exhibit CD2, LinkedIn messages.pdf",
		category: "Exhibits",
		pages: 17,
		added: "18 Sep 2026",
		by: "maya",
		status: "Read",
	},
	{
		name: "Letter before claim.pdf",
		category: "Correspondence",
		pages: 6,
		added: "12 Nov 2024",
		by: "chris",
		status: "Read",
	},
	{
		name: "Response from Fenwick Rowe LLP.pdf",
		category: "Correspondence",
		pages: 4,
		added: "2 Dec 2024",
		by: "chris",
		status: "Read",
	},
	{
		name: "Forensic accountant's preliminary report.pdf",
		category: "Expert reports",
		pages: 48,
		added: "9 Sep 2026",
		by: "eleanor",
		status: "Read",
	},
	{
		name: "Office clearance, scan 1.jpg",
		category: "Photos",
		pages: 1,
		added: "Today",
		by: "chris",
		status: "Needs OCR",
	},
	{
		name: "Office clearance, scan 2.jpg",
		category: "Photos",
		pages: 1,
		added: "Today",
		by: "chris",
		status: "Needs OCR",
	},
	{
		name: "Office clearance, scan 3.jpg",
		category: "Photos",
		pages: 1,
		added: "Today",
		by: "chris",
		status: "Needs OCR",
	},
	{
		name: "Order for directions.pdf",
		category: "Court orders",
		pages: 5,
		added: "22 Jun 2025",
		by: "maya",
		status: "Read",
	},
];

export type ChronologyEntry = {
	date: string;
	event: string;
	source: string;
	disputed?: boolean;
};

export const sampleChronology: ChronologyEntry[] = [
	{
		date: "4 Jan 2019",
		event:
			"Newman signs service agreement with the 12 month non compete at clause 18.",
		source: "Service agreement, p. 9",
	},
	{
		date: "17 Jun 2024",
		event: "Newman exports the full client list to a personal Gmail address.",
		source: "Exhibit CD1",
	},
	{
		date: "1 Jul 2024",
		event: "Newman resigns, giving three months' notice.",
		source: "Resignation letter",
	},
	{
		date: "Aug 2024",
		event: "Newbridge Advisory Ltd incorporated. Newman is the sole director.",
		source: "Companies House extract",
	},
	{
		date: "12 Sep 2024",
		event: "First LinkedIn message from Newman to a Mackenzie client.",
		source: "Exhibit CD2, p. 3",
		disputed: true,
	},
	{
		date: "12 Nov 2024",
		event: "Letter before claim sent.",
		source: "Letter before claim",
	},
	{ date: "3 Mar 2025", event: "Claim issued.", source: "Claim form" },
];

export type Hearing = {
	date: string;
	time?: string;
	title: string;
	where: string;
	who: string;
	kind: "Hearing" | "Deadline";
};

export const upcoming: (Hearing & { matterId: string })[] = [
	{
		date: "2026-10-08",
		time: "10:00",
		title: "Case management hearing",
		where: "Brighton Magistrates' Court",
		who: "tom",
		kind: "Hearing",
		matterId: "brighton-council-v-kestrel-developments",
	},
	{
		date: "2026-10-14",
		time: "10:00",
		title: "Plea and trial preparation hearing",
		where: "Crown Court at Lewes, Court 2",
		who: "eleanor",
		kind: "Hearing",
		matterId: "r-v-hollis",
	},
	{
		date: "2026-10-22",
		time: "14:00",
		title: "Financial dispute resolution hearing",
		where: "Family Court at Brighton",
		who: "eleanor",
		kind: "Hearing",
		matterId: "harlow-v-harlow",
	},
	{
		date: "2026-10-30",
		title: "Standard disclosure closes",
		where: "CPR 31",
		who: "priya",
		kind: "Deadline",
		matterId: "mackenzie-v-newman",
	},
	{
		date: "2026-11-06",
		title: "Exchange witness statements",
		where: "Case management order, para 4",
		who: "priya",
		kind: "Deadline",
		matterId: "patel-v-southern-rail-services",
	},
	{
		date: "2026-11-20",
		title: "Disclosure lists",
		where: "Order of Master Clarke",
		who: "daniel",
		kind: "Deadline",
		matterId: "estate-of-margaret-ashworth",
	},
];

export type Note = {
	title: string;
	body: string;
	by: string;
	when: string;
	kind: "Attendance note" | "Research note" | "File note";
};

export const sampleNotes: Note[] = [
	{
		kind: "Attendance note",
		title: "Call with client, 24 Sep",
		body: "Client confirmed two further former clients have moved to Newbridge. Will send the names by Friday. Discussed costs budget, client comfortable with phase estimates.",
		by: "chris",
		when: "3 days ago",
	},
	{
		kind: "Research note",
		title: "Springboard relief, how long",
		body: "Recent authority suggests springboard relief rarely runs beyond the period the misuse actually saved. Need the accountant's view on how long a clean start would have taken.",
		by: "eleanor",
		when: "Sep 12",
	},
	{
		kind: "File note",
		title: "Counsel's availability",
		body: "Counsel's clerk confirms availability for the June trial window. Brief fee to be agreed once witness evidence is in.",
		by: "maya",
		when: "Sep 8",
	},
];

export type PressItem = {
	title: string;
	source: string;
	date: string;
	snippet: string;
	matterId?: string;
	about: "Our matter" | "Our client" | "Other side" | "Sector";
};

export const press: PressItem[] = [
	{
		title: "Bus passengers injured in sudden stops, figures show",
		source: "Sky News",
		date: "27 Sep 2026",
		snippet:
			"More than 400 passengers a year are hurt when buses brake sharply, with operators on the south coast among those named.",
		matterId: "greaves-v-coastline-buses",
		about: "Other side",
	},
	{
		title:
			"Home Office loses more family life appeals as tribunal backlog clears",
		source: "BBC News",
		date: "25 Sep 2026",
		snippet:
			"Figures show the proportion of Article 8 appeals allowed has risen for a third quarter in a row.",
		matterId: "ak-v-sshd",
		about: "Sector",
	},
	{
		title:
			"UK courts see rise in non compete disputes as dealmakers switch firms",
		source: "Reuters",
		date: "22 Sep 2026",
		snippet:
			"Lawyers say restrictive covenant claims in advisory and financial services are at their highest level in a decade.",
		matterId: "mackenzie-v-newman",
		about: "Sector",
	},
	{
		title: "Council takes developer to court over Kemptown extension",
		source: "The Argus",
		date: "26 Sep 2026",
		snippet:
			"Brighton & Hove City Council says the rear extension at a Grade II listed terrace was built despite an enforcement notice served last year.",
		matterId: "brighton-council-v-kestrel-developments",
		about: "Our matter",
	},
	{
		title: "Kestrel Developments wins approval for Hove seafront scheme",
		source: "Brighton & Hove News",
		date: "24 Sep 2026",
		snippet:
			"The developer's 40 home scheme was approved at committee on Wednesday after two earlier refusals.",
		matterId: "brighton-council-v-kestrel-developments",
		about: "Our client",
	},
	{
		title: "Advisory boutiques poach clients as founders leave big firms",
		source: "Financial Times",
		date: "19 Sep 2026",
		snippet:
			"A rise in partner departures has brought a wave of restrictive covenant claims, with several heading for trial next year.",
		matterId: "mackenzie-v-newman",
		about: "Sector",
	},
	{
		title: "Newbridge Advisory hires two former Mackenzie directors",
		source: "City A.M.",
		date: "15 Sep 2026",
		snippet:
			"The firm founded by John Newman in 2024 says it now advises more than 30 mid market companies.",
		matterId: "mackenzie-v-newman",
		about: "Other side",
	},
	{
		title: "Shop theft in Brighton up for third year running",
		source: "BBC News Sussex",
		date: "11 Sep 2026",
		snippet:
			"Sussex Police figures show reported shoplifting in the city rose 14% in the year to June.",
		matterId: "r-v-hollis",
		about: "Sector",
	},
	{
		title: "Rail operator criticised over safety inspection records",
		source: "The Guardian",
		date: "2 Sep 2026",
		snippet:
			"A regulator's report found gaps in inspection logs at three depots in south London.",
		matterId: "patel-v-southern-rail-services",
		about: "Other side",
	},
	{
		title: "Whistleblowing claims hit record high at employment tribunals",
		source: "Law Society Gazette",
		date: "28 Aug 2026",
		snippet:
			"New tribunal statistics show public interest disclosure claims have almost doubled since 2022.",
		matterId: "patel-v-southern-rail-services",
		about: "Sector",
	},
];

export type LibraryItem = {
	title: string;
	citation: string;
	court: string;
	date: string;
	kind: "Judgment" | "Sentencing guideline" | "Legislation" | "Precedent";
	summary: string;
	source: string;
	usedIn: string[];
	treatment?: "Good law" | "Questioned" | "Distinguished";
};

export const library: LibraryItem[] = [
	{
		kind: "Judgment",
		title: "Carrow Group Ltd v Pellam",
		citation: "[2023] EWHC 1188 (KB)",
		court: "High Court",
		date: "May 2023",
		summary:
			"Twelve month non compete upheld for a senior adviser with client facing duties.",
		source: "Find Case Law",
		usedIn: ["mackenzie-v-newman"],
		treatment: "Distinguished",
	},
	{
		kind: "Judgment",
		title: "Orbis Recruitment v Hale",
		citation: "[2025] EWCA Civ 402",
		court: "Court of Appeal",
		date: "Apr 2025",
		summary:
			"Springboard relief limited to the head start actually gained from the misuse.",
		source: "Find Case Law",
		usedIn: ["mackenzie-v-newman"],
		treatment: "Good law",
	},
	{
		kind: "Judgment",
		title: "R v Tamsin",
		citation: "[2024] EWCA Crim 877",
		court: "Court of Appeal (Criminal Division)",
		date: "Jul 2024",
		summary:
			"Weight to be given to CCTV identification where the stills are of poor quality.",
		source: "Find Case Law",
		usedIn: ["r-v-hollis"],
		treatment: "Good law",
	},
	{
		kind: "Sentencing guideline",
		title: "Theft from a shop or stall",
		citation: "Sentencing Council",
		court: "Magistrates' and Crown Court",
		date: "In force",
		summary:
			"Culpability and harm categories, starting points and ranges for shop theft.",
		source: "Sentencing Council",
		usedIn: ["r-v-hollis"],
	},
	{
		kind: "Sentencing guideline",
		title: "Reduction in sentence for a guilty plea",
		citation: "Sentencing Council",
		court: "All courts",
		date: "In force",
		summary:
			"One third at the first stage, one quarter after, sliding to one tenth on the first day of trial.",
		source: "Sentencing Council",
		usedIn: ["r-v-hollis", "r-v-doyle"],
	},
	{
		kind: "Legislation",
		title: "Employment Rights Act 1996, s. 43B",
		citation: "c. 18",
		court: "UK Public General Acts",
		date: "As amended",
		summary:
			"What makes a disclosure qualifying for whistleblowing protection.",
		source: "legislation.gov.uk",
		usedIn: ["patel-v-southern-rail-services"],
	},
	{
		kind: "Legislation",
		title: "Town and Country Planning Act 1990, s. 179",
		citation: "c. 8",
		court: "UK Public General Acts",
		date: "As amended",
		summary: "Offence where an enforcement notice is not complied with.",
		source: "legislation.gov.uk",
		usedIn: ["brighton-council-v-kestrel-developments"],
	},
	{
		kind: "Precedent",
		title: "Letter before claim, restrictive covenants",
		citation: "Firm precedent",
		court: "Harcourt Lane LLP",
		date: "Updated Jun 2026",
		summary:
			"House template with the Practice Direction on pre action conduct points built in.",
		source: "Firm precedents",
		usedIn: ["mackenzie-v-newman"],
	},
];
