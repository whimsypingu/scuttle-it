import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


export const useRecentsContent = (limit: number = 30) => {
    const queryKey = ["tracks", "recents"];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey,
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            console.log("useRecents triggered");

            const response = await fetch(`/retrieve/recently-played?offset=${pageParam}&limit=${limit}`, { 
                method: "GET" 
            });
            if (!response.ok) throw new Error("Failed to fetch recently played data");

            const data = await response.json();
            return data;
        },
        getNextPageParam: (lastPage) => {
            const nextOffset = lastPage.offset + lastPage.limit;
            return nextOffset < lastPage.totalCount ? nextOffset : undefined;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnMount: "always", //force refetch whenever this hook mounts, backend updates immediately to get the most up-to-date data
    });

    const tracks = useMemo(() =>
        data?.pages.flatMap(page => page.results) ?? [],
    [data]);
    
    return {
        tracks,
        playlistId: "recents",
        totalCount: data?.pages[0]?.totalCount ?? 0,
        totalDuration: data?.pages[0]?.totalDuration ?? 0,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
    };
};