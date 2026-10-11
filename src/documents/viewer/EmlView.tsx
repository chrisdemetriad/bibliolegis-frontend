import { DownloadIcon, PaperclipIcon } from "lucide-react";
import PostalMime, { type Address, type Email } from "postal-mime";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { formatBytes } from "../format";
import { saveBlob } from "./kinds";
import { ViewToolbar } from "./Toolbar";

// An HTML email is shown in a sandboxed frame, scripts off, and this policy
// stops it loading anything from outside the message. A tracking pixel would
// otherwise tell the sender someone at the firm opened their email today
const HTML_POLICY =
	"<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:\">";

export default function EmlView({ blob }: { blob: Blob }) {
	const [email, setEmail] = useState<Email | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		PostalMime.parse(blob, { attachmentEncoding: "arraybuffer" })
			.then((parsed) => {
				if (!cancelled) setEmail(parsed);
			})
			.catch(() => {
				if (!cancelled) setFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [blob]);

	if (failed) {
		return (
			<p className="p-6 text-sm text-destructive">
				This email couldn't be shown. Downloading it might still work.
			</p>
		);
	}
	if (!email) return null;

	const attachments = email.attachments.filter(
		(attachment) =>
			attachment.disposition !== "inline" || !attachment.contentId,
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ViewToolbar>
				Email.{" "}
				{email.text
					? "Shown as plain text."
					: "Shown without images or anything else it would load from outside."}
			</ViewToolbar>
			<div className="flex min-h-0 flex-1 flex-col overflow-auto bg-muted/60 p-4 sm:p-6">
				<article className="mx-auto flex w-full max-w-3xl flex-1 flex-col rounded-lg border bg-background shadow-sm">
					<header className="space-y-1 border-b p-5 text-sm">
						<h2 className="font-medium text-base">
							{email.subject || "(no subject)"}
						</h2>
						<Line
							label="From"
							value={addresses(email.from ? [email.from] : [])}
						/>
						<Line label="To" value={addresses(email.to)} />
						<Line label="Cc" value={addresses(email.cc)} />
						<Line label="Date" value={sent(email.date)} />
					</header>
					{email.text ? (
						<pre className="flex-1 whitespace-pre-wrap break-words p-5 font-sans text-sm leading-relaxed">
							{email.text.trim()}
						</pre>
					) : email.html ? (
						<iframe
							title="Email body"
							sandbox=""
							srcDoc={HTML_POLICY + email.html}
							className="min-h-96 w-full flex-1 bg-white"
						/>
					) : (
						<p className="p-5 text-sm text-muted-foreground">
							This email has no body.
						</p>
					)}
					{attachments.length > 0 && (
						<footer className="border-t p-5">
							<h3 className="mb-2 text-xs font-medium text-muted-foreground">
								{attachments.length === 1
									? "1 attachment"
									: `${attachments.length} attachments`}
							</h3>
							<ul className="space-y-1">
								{attachments.map((attachment, index) => {
									const name = attachment.filename ?? `attachment ${index + 1}`;
									// An ArrayBuffer, attachmentEncoding above asks for one
									const file = new Blob([attachment.content as ArrayBuffer], {
										type: attachment.mimeType,
									});
									return (
										<li
											// Two attachments can share a name
											// biome-ignore lint/suspicious/noArrayIndexKey: attachments never reorder
											key={index}
											className="flex items-center gap-2 text-sm"
										>
											<PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
											<span className="min-w-0 truncate">{name}</span>
											<span className="shrink-0 text-xs text-muted-foreground">
												{formatBytes(file.size)}
											</span>
											<Button
												variant="ghost"
												size="icon-sm"
												className="ml-auto"
												aria-label={`Download ${name}`}
												onClick={() => saveBlob(file, name)}
											>
												<DownloadIcon />
											</Button>
										</li>
									);
								})}
							</ul>
						</footer>
					)}
				</article>
			</div>
		</div>
	);
}

function Line({ label, value }: { label: string; value: string }) {
	if (!value) return null;
	return (
		<p className="text-muted-foreground">
			<span className="inline-block w-12 text-foreground">{label}</span>
			{value}
		</p>
	);
}

function addresses(list: Address[] | undefined) {
	return (list ?? [])
		.flatMap((address) => (address.group ? address.group : [address]))
		.map(({ name, address }) =>
			name && address ? `${name} <${address}>` : name || address || "",
		)
		.join(", ");
}

function sent(date: string | undefined) {
	if (!date) return "";
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return date;
	return parsed.toLocaleString("en-GB", {
		dateStyle: "long",
		timeStyle: "short",
	});
}
