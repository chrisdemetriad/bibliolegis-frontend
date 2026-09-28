import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MentionStatus, PressMention } from "#/api/client";
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

export function useMatterPress(ref: string, includeDismissed = false) {
	const api = useApi();
	return useQuery({
		queryKey: pressKeys.matter(ref, includeDismissed),
		queryFn: () => api.listProjectPress(ref, includeDismissed),
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
