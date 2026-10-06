import { cn } from "cn";
import { useEffect, useMemo, useState } from "react";
import { read, utils, type WorkBook } from "xlsx";
import { ViewToolbar } from "./Toolbar";

// Enough to read a client list or a schedule of loss without the page
// grinding on a fifty thousand row export, which wants downloading anyway
const MAX_ROWS = 2000;

export default function SheetView({ blob }: { blob: Blob }) {
	const [workbook, setWorkbook] = useState<WorkBook | null>(null);
	const [failed, setFailed] = useState(false);
	const [active, setActive] = useState(0);

	useEffect(() => {
		let cancelled = false;
		blob
			.arrayBuffer()
			.then((buffer) => read(buffer, { cellDates: true }))
			.then((book) => !cancelled && setWorkbook(book))
			.catch(() => !cancelled && setFailed(true));
		return () => {
			cancelled = true;
		};
	}, [blob]);

	const rows = useMemo(() => {
		const sheet = workbook?.Sheets[workbook.SheetNames[active]];
		if (!sheet) return [];
		// Formatted text rather than raw values, so dates and money read the
		// way they do in Excel
		return utils.sheet_to_json<string[]>(sheet, {
			header: 1,
			raw: false,
			defval: "",
			blankrows: true,
		});
	}, [workbook, active]);

	const columns = rows.reduce((most, row) => Math.max(most, row.length), 0);
	const shown = rows.slice(0, MAX_ROWS);

	if (failed) {
		return (
			<p className="p-6 text-sm text-destructive">
				This spreadsheet couldn't be opened. Downloading it might still work.
			</p>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="border-separate border-spacing-0 text-xs tabular-nums">
					<thead className="sticky top-0 z-10">
						<tr>
							<th className="sticky left-0 z-10 h-7 min-w-10 border-r border-b bg-muted" />
							{Array.from({ length: columns }, (_, index) => (
								<th
									// biome-ignore lint/suspicious/noArrayIndexKey: columns are their position
									key={index}
									className="h-7 min-w-24 border-r border-b bg-muted px-2 font-normal text-muted-foreground"
								>
									{utils.encode_col(index)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{shown.map((row, rowIndex) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: rows are their position
							<tr key={rowIndex}>
								<th className="sticky left-0 border-r border-b bg-muted px-2 text-right font-normal text-muted-foreground">
									{rowIndex + 1}
								</th>
								{Array.from({ length: columns }, (_, column) => (
									<td
										// biome-ignore lint/suspicious/noArrayIndexKey: cells are their position
										key={column}
										className="h-7 max-w-80 truncate border-r border-b bg-background px-2"
										title={row[column] || undefined}
									>
										{row[column]}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				{rows.length > MAX_ROWS && (
					<p className="p-3 text-xs text-muted-foreground">
						Showing the first {MAX_ROWS.toLocaleString("en-GB")} of{" "}
						{rows.length.toLocaleString("en-GB")} rows. Download the file to see
						the rest.
					</p>
				)}
				{workbook && rows.length === 0 && (
					<p className="p-6 text-sm text-muted-foreground">
						This sheet is empty.
					</p>
				)}
			</div>
			{workbook && (
				<ViewToolbar className="gap-0 overflow-x-auto border-t border-b-0 px-0">
					{workbook.SheetNames.map((name, index) => (
						<button
							key={name}
							type="button"
							onClick={() => setActive(index)}
							className={cn(
								"h-full shrink-0 border-r px-4 whitespace-nowrap hover:text-foreground",
								index === active &&
									"bg-muted font-medium text-foreground shadow-[inset_0_2px_0_var(--color-foreground)]",
							)}
						>
							{name}
						</button>
					))}
				</ViewToolbar>
			)}
		</div>
	);
}
