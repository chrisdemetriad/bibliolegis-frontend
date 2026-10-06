import { MinusIcon, PlusIcon, RotateCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "#/components/ui/button";
import { ViewToolbar, zoomLabel } from "./Toolbar";

export default function ImageView({
	blob,
	name,
}: {
	blob: Blob;
	name: string;
}) {
	const url = useObjectUrl(blob);
	const [scale, setScale] = useState(1);
	// Scans and phone photos turn up sideways often enough to want this
	const [turns, setTurns] = useState(0);

	return (
		<TransformWrapper
			minScale={0.5}
			maxScale={8}
			centerOnInit
			onTransform={(_, state) => setScale(state.scale)}
		>
			{({ zoomIn, zoomOut, resetTransform }) => (
				<div className="flex min-h-0 flex-1 flex-col">
					<ViewToolbar>
						<span>Scroll or pinch to zoom, drag to move around</span>
						<div className="ml-auto flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label="Rotate"
								onClick={() => setTurns(turns + 1)}
							>
								<RotateCwIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label="Zoom out"
								onClick={() => zoomOut()}
							>
								<MinusIcon />
							</Button>
							<button
								type="button"
								className="w-11 rounded text-center tabular-nums hover:text-foreground"
								title="Fit"
								onClick={() => resetTransform()}
							>
								{zoomLabel(scale)}
							</button>
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label="Zoom in"
								onClick={() => zoomIn()}
							>
								<PlusIcon />
							</Button>
						</div>
					</ViewToolbar>
					<div className="min-h-0 flex-1 bg-muted/60">
						<TransformComponent
							wrapperClass="size-full! cursor-grab active:cursor-grabbing"
							contentClass="size-full! items-center justify-center p-6"
						>
							{url && (
								<img
									src={url}
									alt={name}
									className="max-h-full max-w-full object-contain shadow-sm transition-transform"
									style={{ transform: `rotate(${turns * 90}deg)` }}
								/>
							)}
						</TransformComponent>
					</div>
				</div>
			)}
		</TransformWrapper>
	);
}

function useObjectUrl(blob: Blob) {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		const created = URL.createObjectURL(blob);
		setUrl(created);
		return () => URL.revokeObjectURL(created);
	}, [blob]);
	return url;
}
