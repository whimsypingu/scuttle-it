import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { DEFAULT_SETTINGS } from "@/settings/settings.constants";

import type { Loopmode, Settings } from "@/settings/settings.types";


export const useSettings = () => {
    const queryClient = useQueryClient();
    const queryKey = ["settings"];
    
    //fetch settings
    const { data: settings = {}, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("useSettings triggered");

            const response = await fetch(`/settings/get`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch settings");
            
            const data = await response.json();
            return data.settings as Settings;
        },
        staleTime: Infinity, 
    });

    //set the loopmode
    const setLoopmodeMutation = useMutation({
        mutationFn: async (newLoopmode: Loopmode) => {
            const response = await fetch(`/settings/set-loopmode?loopmode=${newLoopmode}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to set loopmode in settings");

            const data = await response.json();
            return data;
        },
        onMutate: async (newLoopmode: Loopmode) => {
            await queryClient.cancelQueries({ queryKey }); // cancel outgoing refetches so they dont rewrite optimistic changes

            const rollbackSettings = queryClient.getQueryData(queryKey); //get the rollback state

            queryClient.setQueryData(queryKey, (old: Settings | undefined) => {
                return {
                    ...DEFAULT_SETTINGS, //ensure all fields exist
                    ...old,
                    loopmode: newLoopmode
                }
            });

            return { rollbackSettings }; //return context for rollback
        },
        onError: (err, newLoopmode, context) => {
            if (context?.rollbackSettings) {
                queryClient.setQueryData(queryKey, context.rollbackSettings);
            }
            console.log("Optimistic setLoopmode failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.settings); //immediately swap for the new settings
        }
    });

    return {
        settings: settings ?? DEFAULT_SETTINGS,
        isLoading,
        error,
        setLoopmode: setLoopmodeMutation.mutate
    };
};
