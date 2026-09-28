import { cn } from "cn";
import type * as React from "react";

// A bare <kbd> defaults to the browser's monospace font, which renders
// symbols like ⌘ and ↵ far larger than the sans body text around them.
// font-sans keeps every shortcut hint in the app the same size
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"rounded border px-1 font-sans text-[0.7rem] text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export { Kbd };
