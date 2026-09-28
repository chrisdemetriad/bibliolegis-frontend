import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ApiError,
	type MentionStatus,
	type PressMention,
	type PressSource,
	type PressSourceCreate,
	type PressSourceUpdate,
	type PressTerms,
} from "#/api/client";
import { useApi } from "#/api/useApi";

export const pressKeys = {
	all: ["press"] as const,
	firm: () => [...pressKeys.all, "firm"] as const,
	matter: (ref: string, dismissed = false) =>
		[...pressKeys.all, "matter", ref, dismissed] as const,
	article: (ref: string, outlet: string, slug: string) =>
		[...pressKeys.all, "article", ref, outlet, slug] as const,
	terms: (ref: string) => [...pressKeys.all, "terms", ref] as const,
	sources: (ref?: string) =>
		[...pressKeys.all, "sources", ref ?? "firm"] as const,
};

export function useFirmPress() {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.firm(),
		queryFn: () => api.listPress(),
	});
}

// While a search is running its articles arrive every few seconds
const SEARCHING_REFRESH_MS = 4_000;

export function isSearching(sources: PressSource[] | undefined) {
	return (sources ?? []).some(
		(source) =>
			source.searching ||
			source.search?.status === "pending" ||
			source.search?.status === "running",
	);
}

export function useMatterPress(
	ref: string,
	{ includeDismissed = false, searching = false } = {},
) {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.matter(ref, includeDismissed),
		queryFn: () => api.listProjectPress(ref, includeDismissed),
		refetchInterval: searching ? SEARCHING_REFRESH_MS : false,
	});
}

export function usePressArticle(ref: string, outlet: string, slug: string) {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.article(ref, outlet, slug),
		queryFn: () => api.getPressArticle(ref, outlet, slug),
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 3,
	});
}

// Keep or dismiss. Shows straight away and puts it back if the save fails
export function useSetMentionStatus(ref: string) {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: MentionStatus }) =>
			api.updatePressMention(ref, id, status),
		onMutate: async ({ id, status }) => {
			await queryClient.cancelQueries({ queryKey: pressKeys.all });
			const previous = queryClient.getQueriesData<
				PressMention[] | PressMention
			>({ queryKey: pressKeys.all });
			const change = (mention: PressMention) =>
				mention.id === id ? { ...mention, status } : mention;
			queryClient.setQueriesData<PressMention[] | PressMention>(
				{ queryKey: pressKeys.all },
				(data) =>
					Array.isArray(data)
						? data.map(change)
						: data && "article" in data
							? change(data)
							: data,
			);
			return { previous };
		},
		onError: (_error, _vars, context) => {
			for (const [key, data] of context?.previous ?? []) {
				queryClient.setQueryData(key, data);
			}
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: pressKeys.all }),
	});
}

export function usePressTerms(ref: string) {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.terms(ref),
		queryFn: () => api.getPressTerms(ref),
	});
}

export function useSetPressTerms(ref: string) {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (terms: PressTerms) => api.setPressTerms(ref, terms),
		onSuccess: (saved) => queryClient.setQueryData(pressKeys.terms(ref), saved),
	});
}

export function usePressSources(ref?: string) {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.sources(ref),
		queryFn: () => api.listPressSources(ref),
		refetchInterval: (query) =>
			isSearching(query.state.data) ? SEARCHING_REFRESH_MS : false,
	});
}

export function useAddPressSource() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: PressSourceCreate) => api.addPressSource(body),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [...pressKeys.all, "sources"],
			}),
	});
}

export function useUpdatePressSource() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: PressSourceUpdate & { id: string }) =>
			api.updatePressSource(id, body),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: [...pressKeys.all, "sources"],
			}),
	});
}

export function useDeletePressSource() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.deletePressSource(id),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: [...pressKeys.all, "sources"],
			}),
	});
}

// Search now. Everything press related is refetched after, the sources'
// last read times and errors included
export function useRefreshPress(ref: string) {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api.refreshPress(ref),
		onSettled: () => queryClient.invalidateQueries({ queryKey: pressKeys.all }),
	});
}

export function usePreviewPressLink() {
	const api = useApi();
	return useMutation({
		mutationFn: (url: string) => api.previewPressLink(url),
	});
}

export function useAddPressLink(ref: string) {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (url: string) => api.addPressLink(ref, url),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: pressKeys.all }),
	});
}

// The caller's role, which decides whether the firm's feeds can be changed
export function useMe() {
	const api = useApi();
	return useQuery({ queryKey: ["users", "me"], queryFn: () => api.me() });
}
