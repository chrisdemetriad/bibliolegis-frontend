// A file's name is the part people can change, the extension stays whatever
// it was uploaded as. "Letter.v2.pdf" is "Letter.v2" and ".pdf"
export function splitName(filename: string) {
	const dot = filename.lastIndexOf(".");
	if (dot <= 0) return { stem: filename, extension: "" };
	return { stem: filename.slice(0, dot), extension: filename.slice(dot) };
}

// The same rule as the api's file_key in app/filenames.py, which refuses two
// files in a matter with the same slug and extension. Keep the two in step
export function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function nameKey(filename: string) {
	const { stem, extension } = splitName(filename);
	return `${slugify(stem)}${extension.toLowerCase()}`;
}

// Whether another file in the matter already has this name
export function nameTaken(
	filename: string,
	others: { key: string; name: string }[],
	exceptKey: string,
) {
	const wanted = nameKey(filename);
	return others.some(
		(other) => other.key !== exceptKey && nameKey(other.name) === wanted,
	);
}

// Each file's address in the matter, "letter-before-claim" for "Letter
// before claim.pdf". The api keeps slug and extension unique together, so
// when a matter has the same name as a PDF and a Word file the extension
// goes on the end to tell them apart, "letter-before-claim-docx"
export function fileSlugs(files: { key: string; name: string }[]) {
	const base = new Map(
		files.map((file) => [file.key, slugify(splitName(file.name).stem)]),
	);
	const counts = new Map<string, number>();
	for (const slug of base.values()) {
		counts.set(slug, (counts.get(slug) ?? 0) + 1);
	}

	const slugs = new Map<string, string>();
	const used = new Set<string>();
	for (const file of files) {
		const stem = base.get(file.key) || "file";
		let slug =
			(counts.get(stem) ?? 0) > 1
				? `${stem}-${slugify(splitName(file.name).extension)}`
				: stem;
		// Only reachable for names the api would refuse today, or ones from
		// before it did. The id keeps the address unique anyway
		if (used.has(slug)) slug = `${slug}-${slugify(file.key).slice(-8)}`;
		used.add(slug);
		slugs.set(file.key, slug);
	}
	return slugs;
}
