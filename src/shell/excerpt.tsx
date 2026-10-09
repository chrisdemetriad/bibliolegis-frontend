import { Fragment, type ReactNode } from "react";

// Short words that turn up everywhere and say nothing about which part of a
// passage a claim rests on
const STOPWORDS = new Set(
	"about after also been before being between both could does from have having into more most only other over same should since some such than that their them then there these they this those through under until very were what when where which while will with would your".split(
		" ",
	),
);

const CITATION_GROUP = /(?:\[\d+\])+/g;
const SENTENCE_END = /(?<=[.!?])\s+|\n+/;

// What each citation number in an answer is backing up. A number placed
// straight after a phrase backs that phrase, so the claim is the text since
// the last number in the same sentence. Several places citing the same
// source are joined
export function claimsByCitation(answer: string) {
	const claims = new Map<number, string>();
	for (const sentence of answer.split(SENTENCE_END)) {
		let from = 0;
		for (const match of sentence.matchAll(CITATION_GROUP)) {
			let claim = sentence.slice(from, match.index);
			// "...was aged 38 [4], [5]" leaves nothing between the two, so
			// both read the whole sentence instead
			if (terms(claim).length === 0)
				claim = sentence.replace(CITATION_GROUP, "");
			for (const number of match[0].match(/\d+/g) ?? []) {
				const key = Number(number);
				claims.set(key, [claims.get(key), claim].filter(Boolean).join(" "));
			}
			from = (match.index ?? 0) + match[0].length;
		}
	}
	return claims;
}

export function terms(text: string) {
	const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
	return [
		...new Set(
			words.filter(
				(word) => /\d/.test(word) || (word.length >= 4 && !STOPWORDS.has(word)),
			),
		),
	];
}

function termPattern(found: string[]) {
	if (found.length === 0) return null;
	const escaped = found
		.sort((a, b) => b.length - a.length)
		.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	return new RegExp(
		`(?<![\\p{L}\\p{N}])(${escaped.join("|")})(?![\\p{L}\\p{N}])`,
		"giu",
	);
}

// A figure is what a short answer usually hangs on, so a sentence carrying
// the same number counts for more than one sharing a word
function score(sentence: string, claimTerms: string[]) {
	const lower = sentence.toLowerCase();
	let total = 0;
	const hit: string[] = [];
	for (const term of claimTerms) {
		if (termPattern([term])?.test(lower)) {
			total += /\d/.test(term) ? 3 : 1;
			hit.push(term);
		}
	}
	return { total, hit };
}

// PDF text keeps the layout's line breaks and rows of dashes, neither of
// which means anything in a two line preview
function tidy(text: string) {
	return text
		.replace(/(?:[-–—_]\s*){4,}/g, " — ")
		.replace(/\s+/g, " ")
		.trim();
}

const SHORTEST = 140;
const LONGEST = 260;

// The part of a passage that backs up the claim, rather than wherever the
// passage happens to start, with the words it shares with the claim to
// highlight. Falls back to the opening of the passage when nothing matches
export function excerpt(passage: string, claim: string | undefined) {
	const text = tidy(passage);
	const claimTerms = claim ? terms(claim) : [];
	// Not split after "1." or "a.", list markers in a judgment, only after
	// a word or a figure of two or more characters. A colon counts, so a
	// quote introduced by "Linden J said:" starts on its own
	const sentences = text.split(/(?<=[\p{L}\p{N})\]"”’]{2}[.!?:])\s+/u);

	let best = { index: -1, total: 0, hit: [] as string[] };
	for (const [index, sentence] of sentences.entries()) {
		const scored = score(sentence, claimTerms);
		if (scored.total > best.total) best = { index, ...scored };
	}

	if (best.index < 0) return { text: clip(text, 0), terms: [] };

	let start = sentences.slice(0, best.index).join(" ").length;
	if (start > 0) start += 1;
	// A long run with no full stops, like a judgment's title page, is one
	// "sentence", so start a little before the first match instead
	const first = text.slice(start).search(termPattern(best.hit) ?? /$/);
	if (first > LONGEST - 60) {
		const near = text.lastIndexOf(" ", start + first - 40);
		start = Math.max(start, near + 1);
		while (start < text.length && !/[\p{L}\p{N}“"]/u.test(text[start]))
			start += 1;
	}
	return { text: clip(text, start), terms: best.hit };
}

function clip(text: string, start: number) {
	let end = text.length;
	if (end - start > LONGEST) {
		// Whole sentences where they fit, otherwise cut at a word
		const stop = text
			.slice(start + SHORTEST, start + LONGEST)
			.search(/[.!?]\s/);
		end =
			stop >= 0
				? start + SHORTEST + stop + 1
				: text.lastIndexOf(" ", start + LONGEST);
	}
	const shown = text.slice(start, end).trim();
	// A cut that lands on a full stop already reads as an ending
	const more = end < text.length && !/[.!?]$/.test(shown);
	return `${start > 0 ? "…" : ""}${shown}${more ? "…" : ""}`;
}

export function Highlighted({
	text,
	terms: found,
}: {
	text: string;
	terms: string[];
}) {
	const pattern = termPattern(found);
	if (!pattern) return text;
	const parts: ReactNode[] = [];
	// split with a capture group puts the matches at odd indexes
	for (const [i, part] of text.split(pattern).entries()) {
		parts.push(
			i % 2 === 1 ? (
				<mark
					key={i}
					className="rounded-sm bg-warning-border px-0.5 text-foreground"
				>
					{part}
				</mark>
			) : (
				<Fragment key={i}>{part}</Fragment>
			),
		);
	}
	return parts;
}
