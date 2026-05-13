import { useMutation, useQuery } from "@tanstack/react-query"

import type { TrackBase } from "@/track/track.types";
import type { YTSearchMutationProps } from "@/store/hooks/hooks.types";
import type { DownloadJob } from "@/job/job.types";
import { queryClient } from "../queryClient";


export const useSearch = (query: string) => {
    const dbSearch = useQuery({
        queryKey: ["search", "database", query],
        queryFn: async () => {
            const response = await fetch(`/search/db-search?q=${encodeURIComponent(query)}`, { 
                method: "GET" 
            });
            if (!response.ok) throw new Error("Search failed");
            
            const data = await response.json();
            return data.results as TrackBase[];
        },
        staleTime: 1000 * 30,
    });

    const ytSearch = useMutation({
        mutationFn: async ({ q, limit = 1 }: YTSearchMutationProps) => {
            const response = await fetch(`/search/yt-search?q=${encodeURIComponent(q)}&query_limit=${limit}`, { 
                method: "POST" 
            });
            if (!response.ok) throw new Error("YouTube request failed");

            const data = await response.json();
            return data.job as DownloadJob;
        },
        onSuccess: (job) => {
            console.log(`Started YouTube download job.`);

            //optimistic update, but don't be too aggressive in case we lose a race condition with a websocket status update that de-syncs the ui
            queryClient.setQueryData<DownloadJob[]>(["jobs", "downloads"], (old = []) => {
                const currentJobs = old ? [...old] : [];

                const index = old.findIndex(j => j.id === job.id);
                if (index === -1) {
                    currentJobs.push({ ...job });
                }
                return currentJobs;
            });
        },
    });

    return {
        results: dbSearch.data ?? [],
        isLoading: dbSearch.isLoading,
        isError: dbSearch.isError,

        triggerYoutubeSearch: ytSearch.mutate,
        youtubeJobId: ytSearch.data,
    };
};