import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


export const useDownloads = (limit = 30) => {
    const queryKey = ["tracks", "downloads"];

    const getDownloads = useInfiniteQuery({
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
            return nextOffset < lastPage.total ? nextOffset : undefined;
        },
        staleTime: 1000 * 60 * 5,
    });

    const tracks = useMemo(() =>
        getDownloads.data?.pages.flatMap(page => page.results) ?? [],
    [getDownloads.data]);
    
    return {
        tracks,
        totalCount: getDownloads.data?.pages[0]?.total ?? 0,
        fetchNextPage: getDownloads.fetchNextPage,
        hasNextPage: getDownloads.hasNextPage,
        isLoading: getDownloads.isLoading,
        isFetchingNextPage: getDownloads.isFetchingNextPage
    };
};