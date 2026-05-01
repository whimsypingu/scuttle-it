import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/store/queryClient"

import type { EditTrackPayload } from "@/store/hooks/hooks.types";
import { makeToast } from "@/features/toast/Toast";


export const useEdit = () => {

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

            if (data.success) {
                makeToast("Saved");
            }
        },
        onError: (err) => {
            console.error("Edit track failed.");
        }
    });

    
    return {
        editTrack: editTrackMutation.mutate
   };
}