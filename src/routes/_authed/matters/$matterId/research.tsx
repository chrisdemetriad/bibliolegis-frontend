import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useMatter } from "#/matters/context";
import { library } from "#/mock/data";
import { LibraryList } from "#/shell/lists";
import { SectionTitle } from "#/shell/page";

export const Route = createFileRoute("/_authed/matters/$matterId/research")({
	component: Research,
});

function Research() {
	const matter = useMatter();
	const items = library.filter((item) => item.usedIn.includes(matter.id));

	return (
		<div>
			<SectionTitle
				action={
					<Button size="sm" variant="outline" asChild>
						<Link to="/library">
							<SearchIcon /> Search the library
						</Link>
					</Button>
				}
			>
				Research
			</SectionTitle>
			<p className="-mt-1 mb-4 text-sm text-muted-foreground">
				Authorities, guidelines and legislation this matter relies on. Each one
				is watched, so a later appeal or change in treatment shows up here and
				on the overview.
			</p>
			<LibraryList items={items} />
		</div>
	);
}
