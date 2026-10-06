import { MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "#/components/ui/button";
import { ViewToolbar, zoomLabel } from "./Toolbar";

// Has to be set in the module that renders <Document>, react-pdf's own
// default overwrites it otherwise. Pinned to the pdfjs-dist react-pdf ships
// with, a mismatched worker refuses to load
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	"pdfjs-dist/build/pdf.worker.min.mjs",
	import.meta.url,
).toString();

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
// A4, until the first page says otherwise
const DEFAULT_RATIO = 297 / 210;

export default function PdfView({ blob }: { blob: Blob }) {
	const scroller = useRef<HTMLDivElement>(null);
	const width = useWidth(scroller);
	const [pages, setPages] = useState(0);
	const [ratio, setRatio] = useState(DEFAULT_RATIO);
	const [zoom, setZoom] = useState(2);
	const [current, setCurrent] = useState(1);

	// Fits the panel at 100%, with room either side for the page's shadow
	const pageWidth = Math.max(240, Math.min(width - 48, 900)) * ZOOMS[zoom];

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ViewToolbar>
				<span className="tabular-nums">
					{pages > 0 ? `Page ${current} of ${pages}` : "Loading pages…"}
				</span>
				<div className="ml-auto flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label="Zoom out"
						disabled={zoom === 0}
						onClick={() => setZoom(zoom - 1)}
					>
						<MinusIcon />
					</Button>
					<button
						type="button"
						className="w-11 rounded text-center tabular-nums hover:text-foreground"
						title="Fit to width"
						onClick={() => setZoom(2)}
					>
						{zoomLabel(ZOOMS[zoom])}
					</button>
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label="Zoom in"
						disabled={zoom === ZOOMS.length - 1}
						onClick={() => setZoom(zoom + 1)}
					>
						<PlusIcon />
					</Button>
				</div>
			</ViewToolbar>
			<div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-muted/60">
				<Document
					file={blob}
					onLoadSuccess={async (pdf) => {
						setPages(pdf.numPages);
						const first = await pdf.getPage(1);
						const [x0, y0, x1, y1] = first.view;
						setRatio((y1 - y0) / (x1 - x0));
					}}
					loading={null}
					error={
						<p className="p-6 text-sm text-destructive">
							This PDF couldn't be opened. It may be damaged or password
							protected, downloading it might still work.
						</p>
					}
					className="flex w-max min-w-full flex-col items-center gap-4 p-6"
				>
					{width > 0 &&
						Array.from({ length: pages }, (_, index) => (
							<LazyPage
								// biome-ignore lint/suspicious/noArrayIndexKey: pages are their position
								key={index}
								number={index + 1}
								width={pageWidth}
								height={pageWidth * ratio}
								root={scroller}
								onSeen={setCurrent}
							/>
						))}
				</Document>
			</div>
		</div>
	);
}

// A long bundle runs to hundreds of pages, and drawing every one up front
// holds the browser for seconds. Each page is a sized placeholder until it
// scrolls near the view, then stays drawn
function LazyPage({
	number,
	width,
	height,
	root,
	onSeen,
}: {
	number: number;
	width: number;
	height: number;
	root: React.RefObject<HTMLDivElement | null>;
	onSeen: (page: number) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [near, setNear] = useState(number <= 2);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const load = new IntersectionObserver(
			([entry]) => entry.isIntersecting && setNear(true),
			{ root: root.current, rootMargin: "1200px 0px" },
		);
		// The page counter follows whichever page crosses the middle of the view
		const track = new IntersectionObserver(
			([entry]) => entry.isIntersecting && onSeen(number),
			{ root: root.current, rootMargin: "-50% 0px -50% 0px" },
		);
		load.observe(element);
		track.observe(element);
		return () => {
			load.disconnect();
			track.disconnect();
		};
	}, [number, root, onSeen]);

	return (
		<div
			ref={ref}
			data-page={number}
			className="shrink-0 bg-white shadow-sm ring-1 ring-black/5"
			style={{ width, minHeight: height }}
		>
			{near && (
				<Page
					pageNumber={number}
					width={width}
					loading={null}
					renderAnnotationLayer
					renderTextLayer
				/>
			)}
		</div>
	);
}

function useWidth(ref: React.RefObject<HTMLElement | null>) {
	const [width, setWidth] = useState(0);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) =>
			setWidth(entry.contentRect.width),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref]);
	return width;
}
