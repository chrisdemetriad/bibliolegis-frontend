import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
} from "@tanstack/react-router";
import { ShareIcon, SparklesIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { findMatter } from "#/mock/data";
import { Page, SampleBadge } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId")({
	loader: ({ params }) => {
		const matter = findMatter(params.matterId);
		if (!matter) throw notFound();
		return matter;
	},
	notFoundComponent: () => (
		<Page>
			<p className="text-muted-foreground">
				There's no matter at this address.{" "}
				<Link to="/matters" className="text-foreground underline">
					Back to all matters
				</Link>
			</p>
		</Page>
	),
	component: MatterLayout,
});

function MatterLayout() {
	const matter = Route.useLoaderData();

	return (
		<Page>
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">
							{matter.title}
						</h1>
						<SampleBadge />
					</div>
					<p className="mt-1 text-sm text-muted-foreground">
						{matter.reference} · {matter.court}
						{matter.judge && ` · ${matter.judge}`}
					</p>
					<div className="mt-3 flex flex-wrap gap-1.5">
						<span className="rounded-md border px-1.5 py-px text-xs text-muted-foreground">
							{matter.area}
						</span>
						{matter.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-md border px-1.5 py-px text-xs text-muted-foreground"
							>
								{tag}
							</span>
						))}
						{matter.closed && (
							<span className="rounded-md bg-muted px-1.5 py-px text-xs">
								Closed
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1">
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
