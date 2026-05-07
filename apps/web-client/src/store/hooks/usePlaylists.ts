import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react";

import { makeToast } from "@/features/toast/Toast";

import type { SummaryPlaylist } from "@/playlist/playlist.types";
import type { CreatePlaylistMutationProps, DeletePlaylistMutationProps, Sortmode } from "@/store/hooks/hooks.types";



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
        mutationFn: async({ payload }: CreatePlaylistMutationProps) => {
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
        onMutate: async({ payload }) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackPlaylists = queryClient.getQueryData<SummaryPlaylist[]>(queryKey);

            const tempNewSummaryPlaylist: SummaryPlaylist = {
                id: payload.playlistId,
                name: payload.name,
                totalCount: 0,
                totalDuration: 0,
            };

            queryClient.setQueryData<SummaryPlaylist[]>(queryKey, (old: SummaryPlaylist[] | undefined) => {
                return [...(old || []), tempNewSummaryPlaylist];
            });

            return { rollbackPlaylists };
        },
        onError: (err, variables, context) => {
            const msg = `Error`;
            makeToast(msg);

            if (context?.rollbackPlaylists) {
                queryClient.setQueryData(queryKey, context.rollbackPlaylists);
            }
            console.log("Optimistic playlist creation, rolling back.");
        },
        onSuccess: (data, variables) => {
            const msg = `Created ${variables.payload.name}`;
            makeToast(msg);

            queryClient.invalidateQueries({ queryKey });
        },
    });


    //delete a playlist
    const deletePlaylistMutation = useMutation({
        mutationFn: async({ playlist }: DeletePlaylistMutationProps) => {
            const response = await fetch(`/playlists/${playlist.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete playlist");

            const data = await response.json();
            return data;
        },
        onMutate: async({ playlist }) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackPlaylists = queryClient.getQueryData<SummaryPlaylist[]>(queryKey);

            queryClient.setQueryData<SummaryPlaylist[]>(queryKey, (old: SummaryPlaylist[] | undefined) => {
                return old?.filter(p => p.id !== playlist.id); //filter out the playlistId
            });

            return { rollbackPlaylists };
        },
        onError: (err, variables, context) => {
            const msg = `Error`;
            makeToast(msg);

            if (context?.rollbackPlaylists) {
                queryClient.setQueryData(queryKey, context.rollbackPlaylists);
            }
            console.log("Optimistic playlist deletion failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            const msg = `Deleted ${variables.playlist.name}`;
            makeToast(msg);

            queryClient.invalidateQueries({ queryKey });
        },
    });


    return {
        createPlaylist: createPlaylistMutation.mutate,
        deletePlaylist: deletePlaylistMutation.mutate,
    };
};