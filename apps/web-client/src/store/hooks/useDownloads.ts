import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


export const useDownloadsContent = (limit: number = 30) => {
    const queryKey = ["tracks", "downloads"];

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
            console.log("useDownloads triggered");

            const response = await fetch(`/retrieve/downloads?offset=${pageParam}&limit=${limit}`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch downloads");

            const data = await response.json();
            return data;
        },
        getNextPageParam: (lastPage) => {
            const nextOffset = lastPage.offset + lastPage.limit;
            return nextOffset < lastPage.totalCount ? nextOffset : undefined;
        },
        staleTime: 1000 * 60 * 5,
    });

    const tracks = useMemo(() =>
        data?.pages.flatMap(page => page.results) ?? [],
    [data]);
    
    return {
        tracks,
        totalCount: data?.pages[0]?.totalCount ?? 0,
        totalDuration: data?.pages[0]?.totalDuration ?? 0,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
    };
};