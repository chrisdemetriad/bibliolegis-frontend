import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";

// For controls drawn ahead of the feature behind them. They stay clickable
// rather than disabled, since a disabled button gets no pointer events and the
// tooltip would never show
export function NotImplemented({ children }: { children: ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild aria-disabled>
				{children}
			</TooltipTrigger>
			<TooltipContent>Not yet implemented</TooltipContent>
		</Tooltip>
	);
}
