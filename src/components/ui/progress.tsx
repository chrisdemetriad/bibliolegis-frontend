import { cn } from "cn";
import { Progress as ProgressPrimitive } from "radix-ui";
import type * as React from "react";

// A bar's fill for how far along it is, 0 to 1. Pale red when it's just
// started, turning green as it fills, and fully green once it's done
export function progressColour(value: number) {
	const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
	return `color-mix(in oklch, var(--progress-start), var(--progress-end) ${percent}%)`;
}

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="size-full flex-1 transition-all"
				style={{
					transform: `translateX(-${100 - (value || 0)}%)`,
					backgroundColor: progressColour((value || 0) / 100),
				}}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
