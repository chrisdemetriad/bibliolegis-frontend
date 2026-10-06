import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangleIcon, ArrowRightIcon, CircleDotIcon } from "lucide-react";
import { useAskPanel, useMatter } from "#/matters/context";
import { daysUntil, formatDate, matters } from "#/mock/data";
import { AskBox } from "#/shell/AskBox";
import {
	NameAvatar,
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
	const { open: askOpen } = useAskPanel();
	const counsel = matter.counsel ?? [];
	const timeline =
		matter.stages.length > 0
			? { stages: matter.stages, current: matter.stageIndex, hidden: 0 }
			: datesTimeline(matter.dates ?? []);
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
				{matter.team.length > 0 ? (
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
				) : (
					counsel.length > 0 && (
						<section>
							<SectionTitle>Team</SectionTitle>
							<div className="space-y-2">
								{counsel.map((entry) => (
									<div key={entry.name} className="flex items-center gap-2.5">
										<NameAvatar name={entry.name} />
										<p className="text-sm">
											{entry.name}
											{entry.actingFor && (
												<span className="text-muted-foreground">
													, for {entry.actingFor}
												</span>
											)}
										</p>
									</div>
								))}
							</div>
						</section>
					)
				)}
			</div>

			{askOpen && (
				<section id="ask" className="scroll-mt-20">
					<SectionTitle>Ask about this matter</SectionTitle>
					<AskBox
						scope={matter.title}
						placeholder={matter.suggestedQuestion}
						projectId={matter.projectId}
					/>
				</section>
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
				{timeline.stages.length > 0 ? (
					<>
						<StageTrack stages={timeline.stages} current={timeline.current} />
						{timeline.hidden > 0 && (
							<Link
								to="/matters/$matterId/hearings"
								params={{ matterId: matter.id }}
								className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
							>
								All {timeline.stages.length + timeline.hidden} dates
								<ArrowRightIcon className="size-3" />
							</Link>
						)}
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						No hearings or deadlines read from the documents yet.
					</p>
				)}
			</Panel>

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

// More than this and the labels, which come from the documents and run long,
// get too narrow to read
const TIMELINE_MAX = 5;

// A real matter's dates drawn the same way a sample matter's stages are. The
// current one is the next date still to come, or the last one once they've all
// passed. With more dates than fit, the ones around the current date show
function datesTimeline(dates: { label: string; date: string }[]) {
	const stages = dates.map((entry) => ({
		name: entry.label,
		date: formatDate(entry.date),
	}));
	const upcoming = dates.findIndex((entry) => daysUntil(entry.date) >= 0);
	const current = upcoming === -1 ? dates.length - 1 : upcoming;
	if (stages.length <= TIMELINE_MAX) {
		return { stages, current, hidden: 0 };
	}
	const start = Math.min(
		Math.max(0, current - Math.floor(TIMELINE_MAX / 2)),
		stages.length - TIMELINE_MAX,
	);
	return {
		stages: stages.slice(start, start + TIMELINE_MAX),
		current: current - start,
		hidden: stages.length - TIMELINE_MAX,
	};
}
