import { useMutation, useQuery } from "@tanstack/react-query"

import { queryClient } from "@/store/queryClient";

import { scuttleFetch } from '@/lib/utils';

import type { ArtistBase, TrackBase } from "@/track/track.types";
import type { YTSearchMutationProps } from "@/store/hooks/hooks.types";
import type { DownloadJob } from "@/job/job.types";


export const useSearch = (query: string) => {
    const normalizedQuery = query.trim();

    const dbSearch = useQuery({
        queryKey: ["search", "database", normalizedQuery],
        queryFn: async () => {
            const response = await scuttleFetch(`/search/db-search?q=${encodeURIComponent(normalizedQuery)}`, { 
                method: "GET" 
            });
            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            return data.results as TrackBase[];
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 2,
        enabled: normalizedQuery.length >= 1, //only execute query if input has actual cahracters
    });

    const ytSearch = useMutation({
        mutationFn: async ({ q, limit = 3 }: YTSearchMutationProps) => {
            const response = await scuttleFetch(`/search/yt-search?q=${encodeURIComponent(q.trim())}&query_limit=${limit}`, { 
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


export const useArtistSearch = (query: string) => {
    const normalizedQuery = query.trim();

    const artistSearch = useQuery({
        queryKey: ["search", "artist", normalizedQuery],
        queryFn: async () => {
            const response = await scuttleFetch(`/search/artist-search?q=${encodeURIComponent(normalizedQuery)}`, { 
                method: "GET" 
            });
            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            return data.results as ArtistBase[];
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 2,
        enabled: normalizedQuery.length >= 1, //only execute query if input has actual cahracters
    });

    return {
        artistResults: artistSearch.data ?? [],
        isArtistLoading: artistSearch.isLoading,
        isError: artistSearch.isError,
    };
};