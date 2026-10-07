import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	PlusIcon,
	UploadIcon,
} from "lucide-react";
import { ActivityFeed } from "#/activity/ActivityFeed";
import {
	useActivity,
	usePreferences,
	useRecentlyViewed,
} from "#/activity/queries";
import { Button } from "#/components/ui/button";
import { updatedAgo } from "#/matters/adapt";
import { useAllMatters } from "#/matters/queries";
import {
	activity,
	daysUntil,
	findMatter,
	formatDate,
	upcoming,
} from "#/mock/data";
import { AskBox } from "#/shell/AskBox";
import {
	Page,
	PageHeader,
	Panel,
	PersonAvatar,
	personName,
	SectionTitle,
} from "#/shell/page";

export const Route = createFileRoute("/_authed/overview")({
	component: OverviewPage,
});

const sampleStats = [
	{ label: "Hearings in the next 30 days", value: 3 },
	{ label: "Documents read this week", value: "1,284" },
	{ label: "Findings waiting for review", value: 4 },
];

function OverviewPage() {
	const { user } = useUser();
	const firstName = user?.firstName;
	const { matters } = useAllMatters();
	const recentActivity = useActivity();
	const preferences = usePreferences();
	// Hidden until the setting is known, so it doesn't flash up for someone
	// who's turned it off
	const showRecentlyViewed = preferences.data?.show_recently_viewed ?? false;
	const stats = [
		{ label: "Open matters", value: matters.filter((m) => !m.closed).length },
		...sampleStats,
	];

	return (
		<Page>
			<PageHeader
				title={firstName ? `Good evening, ${firstName}` : "Good evening"}
				description="What's moved across your matters since you were last in."
				actions={
					<>
						<Button variant="outline" size="sm" asChild>
							<Link to="/matters">
								<UploadIcon /> Upload
							</Link>
						</Button>
						<Button size="sm">
							<PlusIcon /> New matter
						</Button>
					</>
				}
			/>

			<Link
				to="/matters/$matterId/research"
				params={{ matterId: "mackenzie-v-newman" }}
				className="mb-6 flex items-start gap-3 rounded-xl border border-warning-border bg-warning px-4 py-3 text-warning-foreground"
			>
				<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
				<div className="flex-1 text-sm">
					<p className="font-medium">
						An authority you rely on in Mackenzie Holdings Ltd v Newman was
						distinguished.
					</p>
					<p className="opacity-80">
						Carrow Group v Pellam moved from good law to distinguished on 18 Sep
						2026. Two findings cite it.
					</p>
				</div>
				<ArrowRightIcon className="size-4 shrink-0" />
			</Link>

			<div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
				{stats.map((stat) => (
					<Panel key={stat.label} className="p-4">
						<p className="text-2xl font-semibold tracking-tight">
							{stat.value}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
					</Panel>
				))}
			</div>

			<section className="mb-8">
				<SectionTitle>Ask across every matter</SectionTitle>
				<AskBox
					scope="all matters"
					placeholder="What's the typical sentence for shop theft in Brighton over the last five years?"
				/>
			</section>

			<div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
				<section>
					<SectionTitle
						action={
							<button
								type="button"
								className="text-xs text-muted-foreground hover:text-foreground"
							>
								View all
							</button>
						}
					>
						Recent activity
					</SectionTitle>
					{recentActivity.data && recentActivity.data.length > 0 ? (
						<ActivityFeed items={recentActivity.data} />
					) : (
						<SampleActivity />
					)}
				</section>

				<div className="space-y-8">
					<section>
						<SectionTitle>Coming up</SectionTitle>
						<Panel className="divide-y">
							{upcoming.map((item) => (
								<Link
									key={item.title}
									to="/matters/$matterId/hearings"
									params={{ matterId: item.matterId }}
									className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50"
								>
									<CalendarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0 flex-1">
										<p className="text-sm">{item.title}</p>
										<p className="truncate text-xs text-muted-foreground">
											{findMatter(item.matterId)?.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDate(item.date)}
											{item.time && `, ${item.time}`}
										</p>
									</div>
									<span className="text-xs text-muted-foreground tabular-nums">
										{daysUntil(item.date)}d
									</span>
								</Link>
							))}
						</Panel>
					</section>

					{showRecentlyViewed && <RecentlyViewed />}
				</div>
			</div>
		</Page>
	);
}

function RecentlyViewed() {
	const recent = useRecentlyViewed();
	return (
		<section>
			<SectionTitle>Recently viewed</SectionTitle>
			{recent.data?.length === 0 && (
				<p className="text-sm text-muted-foreground">
					Matters you open will show up here.
				</p>
			)}
			<div className="space-y-2">
				{recent.data?.map(({ matter }) => (
					<Link
						key={matter.id}
						to="/matters/$matterId/overview"
						params={{ matterId: matter.slug }}
						className="block rounded-lg border px-3 py-2 hover:bg-muted/50"
					>
						<p className="truncate text-sm">{matter.name}</p>
						<p className="text-xs text-muted-foreground">
							{[
								matter.practice_area,
								`updated ${updatedAgo(matter.updated_at)}`,
							]
								.filter(Boolean)
								.join(", ")}
						</p>
					</Link>
				))}
			</div>
		</section>
	);
}

// Shown until the firm has activity of its own
function SampleActivity() {
	return (
		<Panel className="divide-y">
			{activity.map((item) => {
				const matter = item.matterId && findMatter(item.matterId);
				return (
					<div
						key={`${item.who}-${item.when}-${item.text}`}
						className="flex items-start gap-3 px-4 py-3"
					>
						<PersonAvatar id={item.who} />
						<p className="flex-1 text-sm leading-relaxed">
							<span className="font-medium">{personName(item.who)}</span>{" "}
							<span className="text-muted-foreground">{item.text}</span>{" "}
							{item.target && (
								<>
									<span className="font-medium">{item.target}</span>{" "}
									<span className="text-muted-foreground">in</span>{" "}
								</>
							)}
							{matter && (
								<Link
									to="/matters/$matterId/overview"
									params={{ matterId: matter.id }}
									className="font-medium hover:underline"
								>
									{matter.title}
								</Link>
							)}
						</p>
						<span className="shrink-0 text-xs text-muted-foreground">
							{item.when}
						</span>
					</div>
				);
			})}
		</Panel>
	);
}
