import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlusIcon, GavelIcon, TimerIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { daysUntil, formatDate, upcoming } from "#/mock/data";
import { useMatter } from "#/mock/useMatter";
import { Panel, PersonAvatar, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/hearings")({
	component: Hearings,
});

function Hearings() {
	const matter = useMatter();
	const own = upcoming.filter((item) => item.matterId === matter.id);

	return (
		<div className="space-y-8">
			<section>
				<SectionTitle
					action={
						<Button size="sm" variant="outline">
							<CalendarPlusIcon /> Add to calendar
						</Button>
					}
				>
					Hearings and deadlines
				</SectionTitle>
				<div className="space-y-2">
					{own.length === 0 && (
						<p className="text-sm text-muted-foreground">Nothing listed.</p>
					)}
					{own.map((item) => {
						const Icon = item.kind === "Hearing" ? GavelIcon : TimerIcon;
						return (
							<Panel
								key={item.title}
								className="flex items-center gap-4 px-4 py-3"
							>
								<Icon className="size-4 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="text-sm">{item.title}</p>
									<p className="text-xs text-muted-foreground">
										{formatDate(item.date)}
										{item.time && `, ${item.time}`} · {item.where}
									</p>
								</div>
								<PersonAvatar id={item.who} />
								<span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
									{daysUntil(item.date)}d
								</span>
							</Panel>
						);
					})}
				</div>
			</section>

			<section>
				<SectionTitle>Every stage</SectionTitle>
				<Panel className="divide-y">
					{matter.stages.map((stage, i) => (
						<div
							key={stage.name}
							className="flex items-center justify-between px-4 py-2.5 text-sm"
						>
							<span
								className={i === matter.stageIndex ? "font-medium" : undefined}
							>
								{stage.name}
							</span>
							<span className="text-muted-foreground">
								{stage.date || "Not yet set"}
							</span>
						</div>
					))}
				</Panel>
				<p className="mt-3 text-xs text-muted-foreground">
					Later this will read dates out of court orders as they're uploaded and
					suggest them here, including limitation dates worked out from the
					facts.
				</p>
			</section>
		</div>
	);
}
