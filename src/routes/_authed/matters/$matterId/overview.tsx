import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangleIcon, ArrowRightIcon, CircleDotIcon } from "lucide-react";
import { useMatter } from "#/matters/context";
import { daysUntil, formatDate, matters } from "#/mock/data";
import { AskBox } from "#/shell/AskBox";
import {
	Panel,
	PersonAvatar,
	personName,
	SectionTitle,
	StageTrack,
} from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/overview")({
	component: MatterOverview,
});

function MatterOverview() {
	const matter = useMatter();
	// Related matters come from the sample set, so only sample matters get them
	const related = matter.projectId
		? []
		: matters
				.filter((other) => other.id !== matter.id && other.area === matter.area)
				.slice(0, 2);

	return (
		<div className="space-y-8">
			{matter.alert && (
				<Link
					to="/matters/$matterId/research"
					params={{ matterId: matter.id }}
					className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning px-4 py-3 text-warning-foreground"
				>
					<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
					<div className="flex-1 text-sm">
						<p className="font-medium">{matter.alert.title}</p>
						<p className="opacity-80">{matter.alert.detail}</p>
					</div>
					<ArrowRightIcon className="size-4 shrink-0" />
				</Link>
			)}

			<Panel className="p-5">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-2">
					<h2 className="text-sm font-medium">Where it stands</h2>
					{!matter.closed && matter.nextDate && (
						<p className="text-xs text-muted-foreground">
							{matter.nextDate.label} in {daysUntil(matter.nextDate.date)} days
						</p>
					)}
				</div>
				{matter.stages.length > 0 ? (
					<StageTrack stages={matter.stages} current={matter.stageIndex} />
				) : (
					<KeyDates dates={matter.dates ?? []} />
				)}
			</Panel>

			<section id="ask" className="scroll-mt-20">
				<SectionTitle>Ask about this matter</SectionTitle>
				<AskBox
					scope={matter.title}
					placeholder={matter.suggestedQuestion}
					projectId={matter.projectId}
				/>
			</section>

			<section>
				<SectionTitle>Issues</SectionTitle>
				<p className="-mt-1 mb-3 text-sm text-muted-foreground">
					The issue list is the spine of the matter. Findings group under these,
					which is how a skeleton argument gets written and how a partner asks
					the question.
				</p>
				<div className="space-y-2">
					{matter.issues.length === 0 && (
						<p className="text-sm text-muted-foreground">No issues recorded.</p>
					)}
					{matter.issues.map((issue) => (
						<Panel
							key={issue.title}
							className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
						>
							<CircleDotIcon className="size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="text-sm">{issue.title}</p>
								<p className="text-xs text-muted-foreground">
									{issue.findings === 0
										? "No findings yet"
										: `${issue.findings} ${issue.findings === 1 ? "finding" : "findings"}${issue.needsReview ? ", one needs review" : ""}`}
								</p>
							</div>
							{issue.needsReview && (
								<AlertTriangleIcon className="size-4 text-warning-foreground" />
							)}
							{issue.owner && (
								<span className="text-xs text-muted-foreground max-sm:hidden">
									{issue.owner} · {issue.updated}
								</span>
							)}
							<ArrowRightIcon className="size-4 text-muted-foreground" />
						</Panel>
					))}
				</div>
			</section>

			<div className="grid gap-8 md:grid-cols-2">
				<section>
					<SectionTitle>Summary</SectionTitle>
					<p className="text-sm leading-relaxed text-foreground/90">
						{matter.summary || "No summary yet."}
					</p>
					<dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
						{matter.client && (
							<div>
								<dt className="text-xs text-muted-foreground">Client</dt>
								<dd>{matter.client}</dd>
							</div>
						)}
						{matter.nextDate && (
							<div>
								<dt className="text-xs text-muted-foreground">Next date</dt>
								<dd>
									{matter.nextDate.label}, {formatDate(matter.nextDate.date)}
								</dd>
							</div>
						)}
					</dl>
				</section>
				{matter.team.length > 0 && (
					<section>
						<SectionTitle>Team</SectionTitle>
						<div className="space-y-2">
							{matter.team.map((id) => (
								<div key={id} className="flex items-center gap-2.5">
									<PersonAvatar id={id} />
									<p className="text-sm">
										{personName(id)}
										{id === matter.lead && (
											<span className="text-muted-foreground">, lead</span>
										)}
									</p>
								</div>
							))}
						</div>
					</section>
				)}
			</div>

			{related.length > 0 && (
				<section>
					<SectionTitle>Related matters</SectionTitle>
					<div className="space-y-2">
						{related.map((other) => (
							<Link
								key={other.id}
								to="/matters/$matterId/overview"
								params={{ matterId: other.id }}
								className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:bg-muted/40"
							>
								<div className="min-w-0">
									<p className="truncate text-sm">{other.title}</p>
									<p className="text-xs text-muted-foreground">
										Same practice area,{" "}
										{other.lead === matter.lead
											? "same lead"
											: `led by ${personName(other.lead)}`}
									</p>
								</div>
								<span className="shrink-0 rounded-md border px-1.5 py-px text-xs text-muted-foreground">
									{other.stages[other.stageIndex]?.name}
								</span>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function KeyDates({ dates }: { dates: { label: string; date: string }[] }) {
	if (dates.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No hearings or deadlines read from the documents yet.
			</p>
		);
	}
	return (
		<ol className="divide-y">
			{dates.map((entry) => {
				const days = daysUntil(entry.date);
				return (
					<li
						key={`${entry.label}-${entry.date}`}
						className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
					>
						<span className={days < 0 ? "text-muted-foreground" : undefined}>
							{entry.label}
						</span>
						<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
							{formatDate(entry.date)}
							{days >= 0 && `, in ${days}d`}
						</span>
					</li>
				);
			})}
		</ol>
	);
}
