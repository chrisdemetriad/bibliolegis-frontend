import { createFileRoute } from "@tanstack/react-router";
import { BellIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { press } from "#/mock/data";
import { useMatter } from "#/mock/useMatter";
import { PressList } from "#/shell/lists";
import { SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/press")({
	component: MatterPress,
});

function MatterPress() {
	const matter = useMatter();
	const items = press.filter((item) => item.matterId === matter.id);

	return (
		<div>
			<SectionTitle
				action={
					<Button size="sm" variant="outline">
						<BellIcon /> Alert me
					</Button>
				}
			>
				Press
			</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				Coverage of this matter, the parties and the issues it turns on.
				Watching {matter.parties.map((party) => party.name).join(", ")}.
			</p>
			<PressList items={items} showMatter={false} />
		</div>
	);
}
