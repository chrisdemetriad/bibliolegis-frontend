import type { Project } from "#/api/client";
import {
	type Matter,
	type PracticeArea,
	practiceAreas,
	TODAY,
} from "#/mock/data";

function isPracticeArea(value: string | null): value is PracticeArea {
	return practiceAreas.includes(value as PracticeArea);
}

// How long ago, the way the sample matters write it. Also used by the
// activity feed
export function updatedAgo(iso: string) {
	const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}

// A matter from the api in the shape the matter pages already read, so every
// page works for real matters without a second version of each. Anything the
// api doesn't have yet, stages, issues and the team, comes through empty
export function projectToMatter(project: Project): Matter {
	const today = TODAY.toISOString().slice(0, 10);
	const dates = project.dates.map((entry) => ({
		label: entry.label,
		date: entry.on_date,
	}));
	const client = project.parties.find((party) => party.is_client);

	return {
		id: project.slug,
		projectId: project.id,
		pinned: project.pinned,
		title: project.name,
		reference: project.case_reference ?? project.client_reference ?? "",
		area: isPracticeArea(project.practice_area) ? project.practice_area : null,
		tags: [...(project.our_side ? [project.our_side] : []), ...project.tags],
		court: project.court ?? "",
		client: client?.name ?? "",
		parties: project.parties.map((party) => ({
			name: party.name,
			role: [party.role, party.is_client && "our client"]
				.filter(Boolean)
				.join(", "),
			ours: party.is_client,
		})),
		stages: [],
		stageIndex: 0,
		// The api sends dates soonest first, so the first one not yet passed
		nextDate: dates.find((entry) => entry.date >= today) ?? null,
		dates,
		lead: "",
		team: [],
		documents: project.document_count,
		updated: updatedAgo(project.updated_at),
		closed: project.status === "closed",
		summary: project.summary ?? "",
		issues: [],
		suggestedQuestion: `What are the main points in ${project.name}?`,
	};
}
