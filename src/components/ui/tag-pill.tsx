import { cn } from "cn";
import type * as React from "react";

const PALETTE_SIZE = 8;

// A small stable hash so a given tag's text always lands on the same colour
// in the palette, rather than one picked by render order or list position
function paletteIndex(text: string) {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		hash = (hash * 31 + text.charCodeAt(i)) | 0;
	}
	return (Math.abs(hash) % PALETTE_SIZE) + 1;
}

// A category pill coloured by its own text, "Family" reads the same pale
// blue on every matter it's on. Colours live in styles.css as --tag-1
// through --tag-8, set with a style attribute since Tailwind can't see a
// class name built at runtime
function TagPill({
	children,
	className,
	...props
}: React.ComponentProps<"span"> & { children: string }) {
	const index = paletteIndex(children);
	return (
		<span
			className={cn(
				"inline-flex w-fit shrink-0 items-center rounded-md px-1.5 py-px text-xs font-medium whitespace-nowrap",
				className,
			)}
			style={{
				backgroundColor: `var(--tag-${index})`,
				color: `var(--tag-${index}-foreground)`,
			}}
			{...props}
		>
			{children}
		</span>
	);
}

export { TagPill };
