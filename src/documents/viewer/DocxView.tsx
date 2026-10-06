import { renderAsync } from "docx-preview";
import { useEffect, useRef, useState } from "react";
import { ViewToolbar } from "./Toolbar";

// docx-preview lays the document out in the browser from its XML. Close to
// Word for ordinary pleadings and statements, it can drift on unusual fonts
// or heavy tracked changes, so the toolbar says it's a preview
export default function DocxView({ blob }: { blob: Blob }) {
	const container = useRef<HTMLDivElement>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		const element = container.current;
		if (!element) return;
		let cancelled = false;
		element.replaceChildren();
		renderAsync(blob, element, undefined, {
			className: "docx",
			inWrapper: true,
			ignoreLastRenderedPageBreak: true,
			renderChanges: true,
			renderComments: false,
		}).catch(() => {
			if (!cancelled) setFailed(true);
		});
		return () => {
			cancelled = true;
		};
	}, [blob]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ViewToolbar>
				Preview of a Word document. Layout can differ slightly from Word.
			</ViewToolbar>
			{failed && (
				<p className="p-6 text-sm text-destructive">
					This document couldn't be shown. Downloading it might still work.
				</p>
			)}
			<div
				ref={container}
				className="docx-view min-h-0 flex-1 overflow-auto bg-muted/60"
			/>
		</div>
	);
}
