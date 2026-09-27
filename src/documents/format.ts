const dateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatUploadedAt(iso: string) {
	return dateFormat.format(new Date(iso));
}
