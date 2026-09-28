import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheckIcon, UserPlusIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useMatter } from "#/matters/context";
import { Panel, SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/parties")({
	component: Parties,
});

function Parties() {
	const matter = useMatter();

	return (
		<div className="space-y-8">
			<section>
				<SectionTitle
					action={
						<Button size="sm" variant="outline">
							<UserPlusIcon /> Add party
						</Button>
					}
				>
					Parties
				</SectionTitle>
				<div className="grid gap-2 sm:grid-cols-2">
					{matter.parties.map((party) => (
						<Panel key={party.name} className="px-4 py-3">
							<p className="text-sm font-medium">{party.name}</p>
							<p className="text-xs text-muted-foreground">{party.role}</p>
						</Panel>
					))}
				</div>
			</section>

			<section>
				<SectionTitle>Conflict and ID checks</SectionTitle>
				<Panel className="flex items-start gap-3 px-4 py-3">
					<ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div className="text-sm">
						<p>No conflicts found against 4,812 past and current matters.</p>
						<p className="text-xs text-muted-foreground">
							Checked 2 Jun 2026. Client ID verified, source of funds on file.
						</p>
					</div>
				</Panel>
			</section>

			<section>
				<SectionTitle>Others involved</SectionTitle>
				<Panel className="divide-y text-sm">
					{[
						["Counsel", "Instructed, chambers details on file"],
						["Opposing solicitors", "Fenwick Rowe LLP"],
						["Court contact", matter.court],
					].map(([label, value]) => (
						<div key={label} className="flex justify-between gap-4 px-4 py-2.5">
							<span className="text-muted-foreground">{label}</span>
							<span className="text-right">{value}</span>
						</div>
					))}
				</Panel>
			</section>
		</div>
	);
}
