import { useQuery } from "@tanstack/react-query";
import { useApi } from "#/api/useApi";

export const historyKeys = {
	all: ["query-history"] as const,
	list: (projectRef?: string) =>
		[...historyKeys.all, projectRef ?? "everything"] as const,
};

// The api's own cap, see GET /queries in bibliolegis-api's app/query.py
const QUERY_HISTORY_LIMIT = 100;

export function useQueryHistory(projectRef?: string) {
	const api = useApi();
	return useQuery({
		queryKey: historyKeys.list(projectRef),
		queryFn: () => api.listQueries(projectRef, QUERY_HISTORY_LIMIT),
	});
}
