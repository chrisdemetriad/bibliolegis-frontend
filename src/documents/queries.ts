import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, type Document } from "#/api/client";
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
	passage: (id: string, chunkIndex: number) =>
		[...documentKeys.all, "passage", id, chunkIndex] as const,
	file: (id: string) => [...documentKeys.all, "file", id] as const,
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

export function useDocument(documentId: string) {
	const api = useApi();
	return useQuery({
		queryKey: documentKeys.detail(documentId),
		queryFn: () => api.getDocument(documentId),
		refetchInterval: (query) =>
			query.state.data && isIngesting(query.state.data) ? POLL_MS : false,
		// A 404 means gone or not visible to this user, asking again won't help
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 3,
	});
}

export function usePassage(documentId: string, chunkIndex: number) {
	const api = useApi();
	return useQuery({
		queryKey: documentKeys.passage(documentId, chunkIndex),
		queryFn: () => api.getPassage(documentId, chunkIndex),
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 3,
	});
}

export function useRenameDocument() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			api.renameDocument(id, name),
		onSuccess: async (document) => {
			queryClient.setQueryData<Document[]>(documentKeys.list(), (list) =>
				list?.map((each) => (each.id === document.id ? document : each)),
			);
			await queryClient.invalidateQueries({
				queryKey: documentKeys.detail(document.id),
			});
		},
	});
}

export function useDeleteDocument() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.deleteDocument(id),
		onSuccess: async (_, id) => {
			queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
			await queryClient.invalidateQueries({ queryKey: documentKeys.list() });
		},
	});
}
