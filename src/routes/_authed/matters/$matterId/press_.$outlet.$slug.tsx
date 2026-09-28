import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	BookmarkCheckIcon,
	BookmarkIcon,
	ExternalLinkIcon,
	EyeOffIcon,
	RotateCcwIcon,
} from "lucide-react";
import { ApiError, type MentionStatus } from "#/api/client";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useMatter } from "#/matters/context";
import { ArticleImage, pressDate } from "#/press/PressFeed";
import { usePressArticle, useSetMentionStatus } from "#/press/queries";

// press_ rather than press. so this page takes the matter's content area to
// itself instead of rendering inside the Press list
export const Route = createFileRoute(
	"/_authed/matters/$matterId/press_/$outlet/$slug",
)({
	component: PressArticlePage,
});

function BackToPress() {
	const matter = useMatter();
	return (
		<Link
			to="/matters/$matterId/press"
			params={{ matterId: matter.id }}
			className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeftIcon className="size-4" />
			Press
		</Link>
	);
}

function PressArticlePage() {
	const matter = useMatter();
	const { outlet, slug } = Route.useParams();
	if (!matter.projectId) {
		return (
			<div>
				<BackToPress />
				<p className="mt-6 text-sm text-muted-foreground">
					Sample matters have no press of their own to open.
				</p>
			</div>
		);
	}
	return <Article projectRef={matter.id} outlet={outlet} slug={slug} />;
}

function Article({
	projectRef,
	outlet,
	slug,
}: {
	projectRef: string;
	outlet: string;
	slug: string;
}) {
	const {
		data: mention,
		isPending,
		error,
	} = usePressArticle(projectRef, outlet, slug);
	const setStatus = useSetMentionStatus(projectRef);

	if (isPending) {
		return (
			<div className="space-y-4">
				<BackToPress />
				<Skeleton className="aspect-video max-w-3xl" />
				<Skeleton className="h-8 max-w-2xl" />
			</div>
		);
	}
	if (error) {
		return (
			<div>
				<BackToPress />
				<p className="mt-6 text-sm text-destructive">
					{error instanceof ApiError && error.status === 404
						? "This article isn't on this matter."
						: "Couldn't load this article."}
				</p>
			</div>
		);
	}

	const { article, status } = mention;
	const change = (next: MentionStatus) =>
		setStatus.mutate({ id: mention.id, status: next });

	return (
		<article className="max-w-3xl">
			<BackToPress />
			<div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
				<span className="font-medium text-foreground">
					{article.outlet_name}
				</span>
				<span>·</span>
				<time dateTime={article.published_at ?? undefined}>
					{pressDate(article.published_at)}
				</time>
				{status === "dismissed" && (
					<span className="rounded-md border px-1.5 py-px text-xs">
						Dismissed
					</span>
				)}
				{status === "kept" && (
					<span className="rounded-md border px-1.5 py-px text-xs">Kept</span>
				)}
			</div>
			<h1 className="mt-2 text-2xl font-semibold text-balance">
				{article.title}
			</h1>
			{article.image_url && (
				<ArticleImage
					src={article.image_url}
					className="mt-4 aspect-video w-full rounded-lg"
				/>
			)}
			{article.excerpt && (
				<p className="mt-4 text-base text-muted-foreground">
					{article.excerpt}
				</p>
			)}

			<div className="mt-6 flex flex-wrap gap-2">
				<Button asChild>
					<a href={article.url} target="_blank" rel="noreferrer">
						Read on {article.outlet_name} <ExternalLinkIcon />
					</a>
				</Button>
				{status === "dismissed" ? (
					<Button variant="outline" onClick={() => change("new")}>
						<RotateCcwIcon /> Bring back
					</Button>
				) : (
					<>
						<Button
							variant="outline"
							aria-pressed={status === "kept"}
							onClick={() => change(status === "kept" ? "new" : "kept")}
						>
							{status === "kept" ? <BookmarkCheckIcon /> : <BookmarkIcon />}
							{status === "kept" ? "Kept" : "Keep"}
						</Button>
						<Button variant="ghost" onClick={() => change("dismissed")}>
							<EyeOffIcon /> Dismiss
						</Button>
					</>
				)}
			</div>

			<dl className="mt-8 grid gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-[10rem_1fr]">
				<dt className="text-muted-foreground">Why it's here</dt>
				<dd>
					{mention.added_by_hand
						? "Added by hand"
						: mention.matched_terms.length > 0
							? `Mentions ${mention.matched_terms.join(", ")}`
							: "Matched this matter's terms"}
				</dd>
				{!mention.added_by_hand && (
					<>
						<dt className="text-muted-foreground">Found by</dt>
						<dd>{article.source_name ?? "A source since removed"}</dd>
					</>
				)}
				<dt className="text-muted-foreground">Found on</dt>
				<dd>{pressDate(mention.created_at)}</dd>
			</dl>
			<p className="mt-6 text-xs text-muted-foreground">
				Only the headline, the outlet's own summary and the picture are kept
				here. The article itself stays on {article.outlet_name}'s site.
			</p>
		</article>
	);
}
