import { useMutation } from "@tanstack/react-query"
import { queryClient } from "../queryClient"

import type { EditTrackPayload } from "@/store/hooks/hooks.types";

export const useEdit = () => {

    const editTrackMutation = useMutation({
        mutationFn: async (payload: EditTrackPayload) => {
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
            queryClient.invalidateQueries({ queryKey: ["tracks"] });
        },
        onError: (err) => {
            console.error("Edit track failed.");
        }
    });
}