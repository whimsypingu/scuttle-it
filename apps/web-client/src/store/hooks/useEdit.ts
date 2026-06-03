import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { makeToast } from "@/features/toast/Toast";

import type { EditPlaylistPayload, EditTrackPayload } from "@/store/hooks/hooks.types";
import type { TrackBase, TrackDetails } from "@/track/track.types";
import type { PlaylistDetails, SummaryPlaylist } from "@/playlist/playlist.types";


export const useEditTrack = (track: TrackBase) => {
    const queryClient = useQueryClient();

    const getTrackDetails = useQuery({
        queryKey: ["details", "tracks", track.id],
        queryFn: async () => {
            const response = await fetch(`/retrieve/track/${track.id}`, { 
                method: "GET",
            });
            if (!response.ok) throw new Error("Failed to fetch track details");

            const data = await response.json();
            return data as TrackDetails;
        },
        staleTime: 1000 * 60 * 5, //five minute cd for refetch if necessary
    });

    const editTrackMutation = useMutation({
        mutationFn: async (payload: EditTrackPayload) => {
            //see: apps/audio-server/api/routers/edit_router.py
            const response = await fetch(`/tracks/edit/${track.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to edit track");

            return null;
        },
        onSuccess: () => {
            //refetch all data that could possibly have the edited track. consider a better bounded approach to this
            queryClient.invalidateQueries({ queryKey: ["tracks"] }); 
            queryClient.invalidateQueries({ queryKey: ["details", "tracks", track.id] }); //invalidate the edit-showable track data 
            queryClient.invalidateQueries({ queryKey: ["playlists"] }); //invalidate the counts of playlists 

            makeToast("", "Saved");
        },
        onError: (err) => {
            console.error("Edit track failed.");
        }
    });

    //delete a track
    const deleteQueryKey = ["tracks"];
    const deleteTrackMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/tracks/${track.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete track");

            return null;
        },
        onError: (err) => {
            makeToast("", "Error");

            console.log("Track deletion failed.");
        },
        onSuccess: () => {
            makeToast("Deleted: ", `${track.titleDisplay ?? track.title}`);

            queryClient.invalidateQueries({ queryKey: deleteQueryKey });
        }
    });

    return {
        trackDetails: getTrackDetails?.data,
        isLoading: getTrackDetails.isLoading,
        error: getTrackDetails.error,

        editTrack: editTrackMutation.mutate,
        deleteTrack: deleteTrackMutation.mutate,
   };
}



export const useEditPlaylist = (playlist: SummaryPlaylist) => {
    const queryClient = useQueryClient();

    const getPlaylistDetails = useQuery({
        queryKey: ["details", "playlists", playlist.id],
        queryFn: async () => {
            const response = await fetch(`/retrieve/playlist/${playlist.id}`, {
                method: "GET",
            });
            if (!response.ok) throw new Error("Failed to get playlist details");

            const data = await response.json();
            return data as PlaylistDetails;
        },
        staleTime: 1000 * 60 * 5, //five minute cd for refetch if necessary
    });

    const editPlaylistMutation = useMutation({
        mutationFn: async (payload: EditPlaylistPayload) => {
            //see: apps/audio-server/api/routers/edit_router.py
            const response = await fetch(`/playlists/edit/${playlist.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to edit playlist");

            return null;
        },
        onSuccess: () => {
            //refetch all data that could possibly have the edited playlist
            queryClient.invalidateQueries({ queryKey: ["details", "playlists", playlist.id] }); //invalidate the edit-showable playlist data 
            queryClient.invalidateQueries({ queryKey: ["playlists"] }); //invalidate the counts of playlists 

            makeToast("", "Saved");
        },
        onError: (err) => {
            console.error("Edit playlist failed.");
        }
    });


    //delete a playlist
    const queryKey = ["playlists"];
    const deletePlaylistMutation = useMutation({
        mutationFn: async() => {
            const response = await fetch(`/playlists/${playlist.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete playlist");

            return null;
        },
        onMutate: async(variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackPlaylists = queryClient.getQueryData<SummaryPlaylist[]>(queryKey);

            queryClient.setQueryData<SummaryPlaylist[]>(queryKey, (old: SummaryPlaylist[] | undefined) => {
                return old?.filter(p => p.id !== playlist.id); //filter out the playlistId
            });

            return { rollbackPlaylists };
        },
        onError: (err, variables, context) => {
            makeToast("", "Error");

            if (context?.rollbackPlaylists) {
                queryClient.setQueryData(queryKey, context.rollbackPlaylists);
            }
            console.log("Optimistic playlist deletion failed, rolling back.");
        },
        onSuccess: () => {
            makeToast("Deleted: ", playlist.name);

            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        playlistDetails: getPlaylistDetails?.data,
        isLoading: getPlaylistDetails.isLoading,
        error: getPlaylistDetails.error,

        editPlaylist: editPlaylistMutation.mutate,
        deletePlaylist: deletePlaylistMutation.mutate,
   };
}