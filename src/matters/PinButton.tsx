import { PinIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import { usePinMatter } from "./queries";

export function PinButton({
	projectId,
	pinned,
	title,
	className,
}: {
	projectId: string;
	pinned: boolean;
	title: string;
	className?: string;
}) {
	const pin = usePinMatter();
	const label = pinned ? `Unpin ${title}` : `Pin ${title}`;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={label}
					aria-pressed={pinned}
					className={cn(
						"text-muted-foreground",
						pinned && "text-foreground",
						className,
					)}
					onClick={() => pin.mutate({ id: projectId, pinned: !pinned })}
				>
					<PinIcon className={cn(pinned && "fill-current")} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{pinned ? "Unpin from the sidebar" : "Pin to the sidebar"}
			</TooltipContent>
		</Tooltip>
	);
}
