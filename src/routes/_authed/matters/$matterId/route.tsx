import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShareIcon, SparklesIcon } from "lucide-react";
import { useRecordView } from "#/activity/queries";
import { ApiError } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { TagPill } from "#/components/ui/tag-pill";
import { projectToMatter } from "#/matters/adapt";
import { MatterContext } from "#/matters/context";
import { PinButton } from "#/matters/PinButton";
import { useProject } from "#/matters/queries";
import { findMatter, type Matter } from "#/mock/data";
import { Page, SampleBadge } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId")({
	component: MatterLayout,
});

function MatterLayout() {
	const { matterId } = Route.useParams();
	const project = useProject(matterId);
	const sample = findMatter(matterId);
	// Only real matters, a sample one has nothing on the api to record
	useRecordView(project.data?.slug);

	// The api first, since a real matter can take an address a sample one
	// also has. A 404 there means it's a sample matter or nothing at all
	const notReal =
		project.error instanceof ApiError && project.error.status === 404;
	const matter = project.data
		? projectToMatter(project.data)
		: notReal
			? sample
			: undefined;

	if (!matter) {
		return (
			<Page>
				{project.isPending ? (
					<div className="space-y-3">
						<Skeleton className="h-8 w-72" />
						<Skeleton className="h-4 w-96" />
					</div>
				) : (
					<p className="text-muted-foreground">
						{notReal
							? "There's no matter at this address, or you're not on it."
							: "Couldn't load this matter from the api."}{" "}
						<Link to="/matters" className="text-foreground underline">
							Back to all matters
						</Link>
					</p>
				)}
			</Page>
		);
	}

	return (
		<MatterContext value={matter}>
			<MatterFrame matter={matter} />
		</MatterContext>
	);
}

function MatterFrame({ matter }: { matter: Matter }) {
	return (
		<Page>
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">
							{matter.title}
						</h1>
						{!matter.projectId && <SampleBadge />}
					</div>
					<p className="mt-1 text-sm text-muted-foreground">
						{[matter.reference, matter.court, matter.judge]
							.filter(Boolean)
							.join(" · ")}
					</p>
					<div className="mt-3 flex flex-wrap gap-1.5">
						{matter.area && <TagPill>{matter.area}</TagPill>}
						{matter.tags.map((tag) => (
							<TagPill key={tag}>{tag}</TagPill>
						))}
						{matter.closed && (
							<span className="rounded-md bg-muted px-1.5 py-px text-xs">
								Closed
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1">
					{matter.projectId && (
						<PinButton
							projectId={matter.projectId}
							pinned={Boolean(matter.pinned)}
							title={matter.title}
						/>
					)}
					<Button size="sm" asChild>
						<Link
							to="/matters/$matterId/overview"
							params={{ matterId: matter.id }}
							hash="ask"
						>
							<SparklesIcon /> Ask about this matter
						</Link>
					</Button>
					<Button variant="ghost" size="icon-sm" aria-label="Share matter">
						<ShareIcon />
					</Button>
				</div>
			</div>
			<Outlet />
		</Page>
	);
}
