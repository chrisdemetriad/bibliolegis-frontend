import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { activityKeys } from "#/activity/queries";
import { ApiError, type Project } from "#/api/client";
import { useApi } from "#/api/useApi";
import { documentKeys } from "#/documents/queries";
import { type Matter, matters as sampleMatters } from "#/mock/data";
import { projectToMatter } from "./adapt";

export const matterKeys = {
	all: ["projects"] as const,
	list: () => [...matterKeys.all, "list"] as const,
	detail: (ref: string) => [...matterKeys.all, "detail", ref] as const,
};

export function useProjects() {
	const api = useApi();
	return useQuery({
		queryKey: matterKeys.list(),
		queryFn: () => api.listProjects(),
	});
}

export function useProject(ref: string) {
	const api = useApi();
	return useQuery({
		queryKey: matterKeys.detail(ref),
		queryFn: () => api.getProject(ref),
		// A 404 is the answer for a sample matter's address, asking again won't
		// change it
		retry: (count, error) =>
			!(error instanceof ApiError && error.status === 404) && count < 3,
	});
}

// Real matters first, newest first as the api sends them, then the sample
// ones. A sample matter whose address a real one has taken is left out, since
// the real one is what that address now shows
export function useAllMatters() {
	const projects = useProjects();
	const all = useMemo(() => {
		const real = (projects.data ?? []).map(projectToMatter);
		const taken = new Set(real.map((matter) => matter.id));
		return [
			...real,
			...sampleMatters.filter((matter) => !taken.has(matter.id)),
		] satisfies Matter[];
	}, [projects.data]);
	return { matters: all, projects };
}

// Pins show straight away and roll back if the api refuses
export function usePinMatter() {
	const api = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
			pinned ? api.pinProject(id) : api.unpinProject(id),
		onMutate: async ({ id, pinned }) => {
			await queryClient.cancelQueries({ queryKey: matterKeys.all });
			const previous = queryClient.getQueriesData<Project | Project[]>({
				queryKey: matterKeys.all,
			});
			const flip = (project: Project) =>
				project.id === id ? { ...project, pinned } : project;
			queryClient.setQueriesData<Project | Project[]>(
				{ queryKey: matterKeys.all },
				(data) => (Array.isArray(data) ? data.map(flip) : data && flip(data)),
			);
			return { previous };
		},
		onError: (_error, _vars, context) => {
			for (const [key, data] of context?.previous ?? []) {
				queryClient.setQueryData(key, data);
			}
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: matterKeys.all }),
	});
}

// Deletes a matter and every document in it. onDeleted runs before the caches
// are touched, so a page showing the matter can move away first rather than
// refetch it and flash a not found
export function useDeleteMatter(onDeleted?: () => unknown) {
	const api = useApi();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (projectId: string) => api.deleteProject(projectId),
		onSuccess: async (_data, projectId) => {
			await onDeleted?.();
			queryClient.setQueryData<Project[]>(matterKeys.list(), (projects) =>
				projects?.filter((project) => project.id !== projectId),
			);
			queryClient.removeQueries({
				queryKey: [...matterKeys.all, "detail"],
				predicate: (query) =>
					(query.state.data as Project | undefined)?.id === projectId,
			});
			await Promise.all(
				[
					matterKeys.all,
					documentKeys.all,
					activityKeys.all,
					activityKeys.recentlyViewed,
				].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
			);
		},
	});
}
