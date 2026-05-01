import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { makeToast } from '@/features/toast/Toast';
import { getTrackDisplayMetadata, trackBaseToPlaylistTrack } from '@/track/track.utils';

import type { InfiniteData } from '@tanstack/react-query';
import type { PlaylistTrack } from '@/track/track.types';
import type { SetLikeMutationProps, Sortmode } from '@/store/hooks/hooks.types';


/**
 * useLikes
 * 
 * Hook to get the contents of the liked tracks
 */
export const useLikes = (limit = 30) => {
    const [sortmode, setSortmode] = useState<Sortmode>(0);

    const queryKey = ["tracks", "likes", sortmode];

    //fetch likes
    const getLikes = useInfiniteQuery({
        queryKey,
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            console.log("useLikes triggered");

            const response = await fetch(`/retrieve/likes?offset=${pageParam}&limit=${limit}&sortmode=${sortmode}`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch likes");

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
        getLikes.data?.pages.flatMap(page => page.results) ?? [],
    [getLikes.data]);


    return {
        tracks,
        sortmode,
        setSortmode,
        totalCount: getLikes.data?.pages[0]?.totalCount ?? 0,
        totalDuration: getLikes.data?.pages[0]?.totalDuration ?? 0,
        fetchNextPage: getLikes.fetchNextPage,
        hasNextPage: getLikes.hasNextPage,
        isLoading: getLikes.isLoading,
        isFetchingNextPage: getLikes.isFetchingNextPage,
    };
};


/**
 * useLikesMutations
 * 
 * Performs mutations without immediately re-fetching liked content to reduce overall network requests when unnecessary
 */
export const useLikesMutations = () => {
    const queryClient = useQueryClient();
    const queryKey = ["tracks", "likes"];

    //set a track to liked or unliked state
    const setLikeMutation = useMutation({
        mutationFn: async ({ track, liked }: SetLikeMutationProps) => {
            const response = await fetch(`/like/set?track_id=${track.id}&liked=${liked}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data;
        },
        onMutate: async ({ track, liked }) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackLikes = queryClient.getQueryData<InfiniteData<any>>(queryKey);

            const tempLikedTrack = trackBaseToPlaylistTrack(track); //typecast to a PlaylistTrack with -1 default position field -- could cause problems

            queryClient.setQueryData<InfiniteData<any>>(queryKey, (old) => {
                if (!old) return old; //not opened yet, no need to even bother with an optimistic update

                //check if the track already exists anywhere in the infinite cache
                const isAlreadyInCache = old.pages.some(page => 
                    page.results.some((t: PlaylistTrack) => t.id === track.id)
                );

                return {
                    ...old,
                    pages: old.pages.map((page, index) => {
                        // LIKING: add it to the top of the first page
                        if (liked && !isAlreadyInCache && index === 0) {
                            return {
                                ...page,
                                results: [tempLikedTrack, ...page.results],
                                totalCount: page.totalCount + 1,
                            };
                        }

                        // UNLIKING: remove it from every page it might be on
                        if (!liked) {
                            return {
                                ...page,
                                results: page.results.filter((t: PlaylistTrack) => t.id !== track.id),
                                totalCount: Math.max(0, page.totalCount - 1),
                            };
                        }

                        return page;
                    })
                };
            });

            return { rollbackLikes };
        },
        onError: (err, variables, context) => {
            const msg = `Error`;
            makeToast(msg);

            if (context?.rollbackLikes) {
                queryClient.setQueryData(queryKey, context.rollbackLikes);
            }
            console.log("Optimistic setting like/unlike failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            const msg = `${variables.liked ? "Liked" : "Removed"} ${getTrackDisplayMetadata(variables.track).titleDisplay}`;
            makeToast(msg);

            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        setLike: setLikeMutation.mutate,
    };
};