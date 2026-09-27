import { useQuery } from "@tanstack/react-query";
import type { Document } from "#/api/client";
import { useApi } from "#/api/useApi";

// Ingestion runs on the api after upload returns, so these are the two states
// worth polling for. done and failed don't change on their own
export function isIngesting(document: Pick<Document, "status">) {
	return document.status === "pending" || document.status === "processing";
}

// Two seconds is quick enough to watch a small PDF go through and slow enough
// that a list left open all afternoon isn't hammering the api
const POLL_MS = 2000;

export const documentKeys = {
	all: ["documents"] as const,
	list: () => [...documentKeys.all, "list"] as const,
	detail: (id: string) => [...documentKeys.all, "detail", id] as const,
};

export function useDocuments() {
	const api = useApi();
	return useQuery({
		queryKey: documentKeys.list(),
		queryFn: () => api.listDocuments({ limit: 200 }),
		refetchInterval: (query) =>
			query.state.data?.some(isIngesting) ? POLL_MS : false,
	});
}
