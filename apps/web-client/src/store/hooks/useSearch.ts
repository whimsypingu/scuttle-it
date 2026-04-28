import { useMutation, useQuery } from "@tanstack/react-query"

import type { TrackBase } from "@/model/model.types";
import type { YTSearchMutationProps } from "@/store/hooks/hooks.types";


export const useSearch = (query: string) => {
    const dbSearch = useQuery({
        queryKey: ["search", "database", query],
        queryFn: async () => {
            const response = await fetch(`/search/db-search?q=${encodeURIComponent(query)}`, { method: "GET" });
            if (!response.ok) throw new Error("Search failed");
            
            const rawData = await response.json();
            return rawData.results as TrackBase[];
        },
        staleTime: 1000 * 30,
    });

    const ytSearch = useMutation({
        mutationFn: async ({ q, limit = 1 }: YTSearchMutationProps) => {
            const response = await fetch(`/search/yt-search?q=${encodeURIComponent(q)}&query_limit=${limit}`, { method: "POST" });
            if (!response.ok) throw new Error("YouTube request failed");

            const rawData = await response.json();
            return rawData.jobId as string;
        },
        onSuccess: (jobId) => {
            console.log(`Started YouTube job: ${jobId}`);
        },
    });

    return {
        results: dbSearch.data ?? [],
        isLoading: dbSearch.isLoading,
        isError: dbSearch.isError,

        triggerYoutubeSearch: ytSearch.mutate,
        isYoutubeProcessing: ytSearch.isPending,
        youtubeJobId: ytSearch.data,
    };
};