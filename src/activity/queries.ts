import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Preferences } from "#/api/client";
import { useApi } from "#/api/useApi";

export const activityKeys = {
	all: ["activity"] as const,
	list: (projectRef?: string) =>
		[...activityKeys.all, projectRef ?? "everything"] as const,
	recentlyViewed: ["recently-viewed"] as const,
	preferences: ["preferences"] as const,
};

// Kept fresh without a reload, since reading a document finishes in the
// background and the feed is where that shows
const ACTIVITY_REFRESH_MS = 30_000;

export function useActivity(projectRef?: string) {
	const api = useApi();
	return useQuery({
		queryKey: activityKeys.list(projectRef),
		queryFn: () => api.listActivity(projectRef),
		refetchInterval: ACTIVITY_REFRESH_MS,
	});
}

export function useRecentlyViewed() {
	const api = useApi();
	return useQuery({
		queryKey: activityKeys.recentlyViewed,
		queryFn: () => api.listRecentlyViewed(),
	});
}

export function usePreferences() {
	const api = useApi();
	return useQuery({
		queryKey: activityKeys.preferences,
		queryFn: () => api.getMyPreferences(),
	});
}

// Shows the change straight away and puts it back if the save fails
export function useSavePreferences() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (preferences: Preferences) => api.setMyPreferences(preferences),
		onMutate: async (preferences) => {
			await queryClient.cancelQueries({ queryKey: activityKeys.preferences });
			const previous = queryClient.getQueryData<Preferences>(
				activityKeys.preferences,
			);
			queryClient.setQueryData(activityKeys.preferences, preferences);
			return { previous };
		},
		onError: (_error, _preferences, context) => {
			queryClient.setQueryData(activityKeys.preferences, context?.previous);
		},
		onSuccess: (saved) => {
			queryClient.setQueryData(activityKeys.preferences, saved);
			// The count decides how many the api sends back
			void queryClient.invalidateQueries({
				queryKey: activityKeys.recentlyViewed,
			});
		},
	});
}

// Records a visit once per matter opened, not once per tab within it, since
// the matter layout stays mounted while its tabs change underneath it
export function useRecordView(projectRef: string | undefined) {
	const api = useApi();
	const queryClient = useQueryClient();
	useEffect(() => {
		if (!projectRef) return;
		api
			.recordView(projectRef)
			.then(() =>
				queryClient.invalidateQueries({
					queryKey: activityKeys.recentlyViewed,
				}),
			)
			// Losing one visit from Recently viewed isn't worth telling anyone
			.catch(() => {});
	}, [api, projectRef, queryClient]);
}
