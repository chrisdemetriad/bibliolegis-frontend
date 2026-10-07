import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "#/api/client";
import { useApi } from "#/api/useApi";

const meKey = ["users", "me"] as const;

// The signed in user as the api sees them: role, firm and job title. Name and
// email are Clerk's and come from useUser() instead
export function useMe() {
	const api = useApi();
	return useQuery({ queryKey: meKey, queryFn: () => api.me() });
}

export function useSaveJobTitle() {
	const api = useApi();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (jobTitle: string) => api.setMyJobTitle(jobTitle),
		onSuccess: ({ job_title }) => {
			queryClient.setQueryData<UserProfile>(meKey, (me) =>
				me ? { ...me, job_title: job_title ?? null } : me,
			);
		},
	});
}
