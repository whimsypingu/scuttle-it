import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { EditTrackPayload } from "@/store/hooks/hooks.types";
import { makeToast } from "@/features/toast/Toast";
import type { TrackBase, TrackDetails } from "@/track/track.types";


export const useEditTrack = (track: TrackBase) => {
    const queryClient = useQueryClient();

    const getTrackDetails = useQuery({
        queryKey: ["details", "tracks", track.id],
        queryFn: async () => {
            console.log("useEditTrack triggered");

            const response = await fetch(`/retrieve/track/${track.id}`);
            if (!response.ok) throw new Error("Failed to fetch track details");
            
            const data = await response.json();
            return data as TrackDetails;
        },
        staleTime: 1000 * 60 * 5, //five minute cd for refetch if necessary
    });

    const editTrackMutation = useMutation({
        mutationFn: async ({ payload }: { payload: EditTrackPayload }) => {
            //see: apps/audio-server/api/routers/edit_router.py
            const response = await fetch(`/edit/track`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to edit track");

            const data = await response.json();
            return data;
        },
        onSuccess: (data) => {
            //refetch all data that could possibly have the edited track. consider a better bounded approach to this
            queryClient.invalidateQueries({ queryKey: ["tracks"] }); 
            queryClient.invalidateQueries({ queryKey: ["details", "tracks", track.id] }); //invalidate the edit-showable track data 
            queryClient.invalidateQueries({ queryKey: ["playlists"] }); //invalidate the counts of playlists 

            if (data.success) {
                makeToast("Saved");
            }
        },
        onError: (err) => {
            console.error("Edit track failed.");
        }
    });

    
    return {
        trackDetails: getTrackDetails?.data,
        isLoading: getTrackDetails.isLoading,
        error: getTrackDetails.error,

        editTrack: editTrackMutation.mutate,
   };
}