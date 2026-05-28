import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react";

import { makeToast } from "@/features/toast/Toast";

import type { SummaryPlaylist } from "@/playlist/playlist.types";
import type { CreatePlaylistPayload, DeletePlaylistMutationProps, SetPinMutationProps, Sortmode } from "@/store/hooks/hooks.types";



/**
 * usePlaylists
 * 
 * Hook to get the contents of the playlists
 */
export const usePlaylists = () => {
    const queryKey = ["playlists"];
    
    //fetch playlists
    const getPlaylists = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("usePlaylists triggered");

            const response = await fetch(`/playlists`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch playlists");
            
            const data = await response.json();
            return data.playlists as SummaryPlaylist[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    return {
        playlists: getPlaylists.data ?? [],
        refetch: getPlaylists.refetch,
        isLoading: getPlaylists.isLoading,
        error: getPlaylists.error,
    };
};



/**
 * usePins
 * 
 * Hook to get the contents of the pinned playlists
 */
export const usePins = () => {
    const queryKey = ["playlists", "pins"];
    
    //fetch playlists
    const getPlaylists = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("usePinnedPlaylists triggered");

            const response = await fetch(`/playlists/pins`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch pinned playlists");
            
            const data = await response.json();
            return data.playlists as SummaryPlaylist[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    return {
        playlists: getPlaylists.data ?? [],
        refetch: getPlaylists.refetch,
        isLoading: getPlaylists.isLoading,
        error: getPlaylists.error,
    };
};



/**
 * usePinsMutations
 * 
 * Performs mutations without immediately re-fetching pins to reduce overall network requests when unnecessary
 */
export const usePinsMutations = () => {
    const queryClient = useQueryClient();
    const rootKey = ["playlists", "pins"]; //does not include sortmode as the last part of the queryKey

    //set a track to liked or unliked state
    const setPinMutation = useMutation({
        mutationFn: async ({ playlist, pinned }: SetPinMutationProps) => {
            const response = await fetch(`/playlists/pin/set?playlist_id=${playlist.id}&pinned=${pinned}`, { method: "POST" });

            if (!response.ok) throw new Error(`Failed to ${pinned ? "pin" : "unpin"}`);

            const data = await response.json();
            return data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: rootKey });
            const rollbackPins = queryClient.getQueriesData({ queryKey: rootKey });

            queryClient.setQueryData(rootKey, (old: any[] | undefined) => {
                const currentPins = old || [];

                if (variables.pinned) {
                    if (currentPins.some(p => p.id === variables.playlist.id)) return currentPins;

                    return [...currentPins, variables.playlist];
                } else {
                    return currentPins.filter(p => p.id !== variables.playlist.id);
                }
            });
            return { rollbackPins };
        },
        onError: (err, variables, context) => {
            makeToast("Error");

            //rollback all versions of the likes list
            if (context?.rollbackPins) {
                queryClient.setQueryData(rootKey, context.rollbackPins);
            }
            console.log("Optimistic setting pin/unpin failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            makeToast(variables.pinned ? "Pinned: " : "Removed: ", variables.playlist.name);
        },
    });

    return {
        setPin: setPinMutation.mutate,
    };
};



/**
 * usePlaylistContent
 * 
 * Paginated retrieval of playlist content
 */
export const usePlaylistContent = (playlistId: string, limit: number = 30) => {
    const [sortmode, setSortmode] = useState<Sortmode>(0);

    const queryKey = ["tracks", "playlist", playlistId, sortmode];

    //fetch playlist
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
            console.log("usePlaylistContent triggered");

            const response = await fetch(`/retrieve/playlist/${playlistId}?offset=${pageParam}&limit=${limit}&sortmode=${sortmode}`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch playlist content");

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
        sortmode,
        setSortmode,
        totalCount: data?.pages[0]?.totalCount ?? 0,
        totalDuration: data?.pages[0]?.totalDuration ?? 0,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
    };
};



/**
 * usePlaylistsMutations
 * 
 * Performs mutations of playlists
 */
export const usePlaylistsMutations = () => {
    const queryClient = useQueryClient();
    const queryKey = ["playlists"];

    //create a playlist
    const createPlaylistMutation = useMutation({
        mutationFn: async(payload: CreatePlaylistPayload) => {
            const response = await fetch(`/playlists`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to create new playlist");

            const data = await response.json();
            return data;
        },
        onMutate: async(payload) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackPlaylists = queryClient.getQueryData<SummaryPlaylist[]>(queryKey);

            const tempNewSummaryPlaylist: SummaryPlaylist = {
                id: payload.playlistId,
                name: payload.name,
                totalCount: 0,
                totalDuration: 0,
            };

            queryClient.setQueryData<SummaryPlaylist[]>(queryKey, (old: SummaryPlaylist[] | undefined) => {
                return [tempNewSummaryPlaylist, ...(old || [])];
            });

            return { rollbackPlaylists };
        },
        onError: (err, payload, context) => {
            makeToast("", "Error");

            if (context?.rollbackPlaylists) {
                queryClient.setQueryData(queryKey, context.rollbackPlaylists);
            }
            console.log("Optimistic playlist creation, rolling back.");
        },
        onSuccess: (data, payload) => {
            makeToast("Created: ", payload.name);

            queryClient.invalidateQueries({ queryKey }); //make optimistic later
        },
    });

    return {
        createPlaylist: createPlaylistMutation.mutate,
    };
};