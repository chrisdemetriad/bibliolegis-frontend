import { createFileRoute } from "@tanstack/react-router";
import { activity } from "#/mock/data";
import { useMatter } from "#/mock/useMatter";
import { Panel, PersonAvatar, personName, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/activity")({
	component: MatterActivity,
});

function MatterActivity() {
	const matter = useMatter();
	const items = activity.filter((item) => item.matterId === matter.id);

	return (
		<div>
			<SectionTitle>Activity</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				Everything done on this matter, including every question asked of it.
				This is the same record the audit log keeps.
			</p>
			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">Nothing recent.</p>
			) : (
				<Panel className="divide-y">
					{items.map((item) => (
						<div
							key={`${item.who}-${item.when}`}
							className="flex items-start gap-3 px-4 py-3"
						>
							<PersonAvatar id={item.who} />
							<p className="flex-1 text-sm">
								<span className="font-medium">{personName(item.who)}</span>{" "}
								<span className="text-muted-foreground">
									{item.text.replace(/ (to|in|for)$/, "")}
								</span>
								{item.target && (
									<span className="font-medium"> {item.target}</span>
								)}
							</p>
							<span className="shrink-0 text-xs text-muted-foreground">
								{item.when}
							</span>
						</div>
					))}
				</Panel>
			)}
		</div>
	);
}
