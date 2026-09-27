import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { people, type Stage } from "#/mock/data";

export function Page({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main
			className={cn("mx-auto w-full max-w-5xl px-4 py-6 sm:px-8", className)}
			{...props}
		/>
	);
}

export function PageHeader({
	title,
	description,
	actions,
	sample = true,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	sample?: boolean;
}) {
	return (
		<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					{sample && <SampleBadge />}
				</div>
				{description && (
					<p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

// Marks a page whose content is hardcoded, so nobody reads a made up case or
// citation as real
export function SampleBadge() {
	return (
		<span
			title="This page shows hardcoded sample data"
			className="rounded-full border border-dashed px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
		>
			Sample data
		</span>
	);
}

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"rounded-xl border bg-card text-card-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function SectionTitle({
	children,
	action,
}: {
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-3 flex items-center justify-between gap-2">
			<h2 className="text-sm font-medium">{children}</h2>
			{action}
		</div>
	);
}

export function PersonAvatar({
	id,
	className,
}: {
	id: string;
	className?: string;
}) {
	const person = people[id];
	return (
		<span
			title={person?.name ?? "Bibliolegis"}
			className={cn(
				"inline-flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-[0.65rem] font-medium text-muted-foreground",
				className,
			)}
		>
			{person?.initials ?? "BL"}
		</span>
	);
}

export function personName(id: string) {
	return people[id]?.name ?? "Bibliolegis";
}

export function StageTrack({
	stages,
	current,
}: {
	stages: Stage[];
	current: number;
}) {
	return (
		<ol className="grid grid-cols-5 gap-2 max-sm:grid-cols-1 max-sm:gap-3">
			{stages.map((stage, i) => (
				<li key={stage.name} className="min-w-0">
					<div className="mb-3 flex h-3 items-center gap-1.5 max-sm:hidden">
						{i < current ? (
							<CheckIcon className="size-3 text-muted-foreground" />
						) : (
							<span
								className={cn(
									"size-1.5 shrink-0 rounded-full",
									i === current ? "size-2 bg-foreground" : "bg-border",
								)}
							/>
						)}
						{i < stages.length - 1 && (
							<span
								className={cn(
									"h-px flex-1",
									i < current ? "bg-foreground/70" : "bg-border",
								)}
							/>
						)}
					</div>
					<p
						className={cn(
							"text-sm",
							i === current
								? "font-medium"
								: i > current && "text-foreground/80",
						)}
					>
						{stage.name}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{stage.date || "Not yet set"}
					</p>
				</li>
			))}
		</ol>
	);
}
