import { cn } from "cn";
import type * as React from "react";

// The strip of controls along the top of each kind of view, so zoom and sheet
// tabs sit in the same place whatever's open
export function ViewToolbar({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex h-10 shrink-0 items-center gap-1 border-b bg-background px-3 text-xs text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function zoomLabel(scale: number) {
	return `${Math.round(scale * 100)}%`;
}
