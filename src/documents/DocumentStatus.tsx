import { LoaderCircleIcon } from "lucide-react";
import { Badge } from "#/components/ui/badge";

const labels: Record<string, string> = {
	pending: "Queued",
	processing: "Reading",
	done: "Ready",
	failed: "Failed",
};

export function DocumentStatus({ status }: { status: string }) {
	const label = labels[status] ?? status;
	if (status === "failed") return <Badge variant="destructive">{label}</Badge>;
	if (status === "done") return <Badge variant="secondary">{label}</Badge>;
	return (
		<Badge variant="outline">
			<LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
			{label}
		</Badge>
	);
}
