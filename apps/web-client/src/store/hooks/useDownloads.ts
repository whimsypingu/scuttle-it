import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { scuttleFetch } from '@/lib/utils';
import { getCachedTrackMetadata } from '@/features/offline/offline.utils';


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

            const response = await scuttleFetch(`/retrieve/downloads?offset=${pageParam}&limit=${limit}`, { 
                method: "GET" 
            });
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
        playlistId: "downloads",
        totalCount: data?.pages[0]?.totalCount ?? 0,
        totalDuration: data?.pages[0]?.totalDuration ?? 0,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
    };
};


export const useLocalCacheContent = () => {
    const queryKey = ["tracks", "local"];

    const getLocalCache = useQuery({
        queryKey,
        queryFn: async () => {
            const tracks = await getCachedTrackMetadata();
            return tracks;
        },
        staleTime: 0, //always fetch a fresh copy from memory
    });

    const totalCount = useMemo(() => {
        return (getLocalCache.data ?? []).length;
    }, [getLocalCache.data]);

    const totalDuration = useMemo(() => {
        return (getLocalCache.data ?? []).reduce((acc, track) => acc + track.duration, 0);
    }, [getLocalCache.data]);
    
    //create a mock scrolLContext output with one page to be consumed in /features/home/subcomponents/LocalCacheHomeContent.tsx
    return {
        tracks: getLocalCache.data ?? [],
        playlistId: "local",
        totalCount,
        totalDuration,
        fetchNextPage: async () => {},
        hasNextPage: false,
        isLoading: getLocalCache.isLoading,
        isFetchingNextPage: false,
    };
};