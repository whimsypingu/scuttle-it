import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { QueueTrack } from "@/model/model.types";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["play_queue"];
    
    //fetch queue
    const { data: queue = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await fetch(`/queue/get`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch queue");
            
            const data = await response.json();
            return data.queue as QueueTrack[];
        },
        staleTime: Infinity, 
    });

    const pushMutation = useMutation({
        mutationFn: async (trackId: string) => {
            const response = await fetch(`/queue/push?track_id=${trackId}`, { method: "POST" });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    const popMutation = useMutation({
        mutationFn: async (queueId: number) => {
            const response = await fetch(`/queue/pop?queue_id=${queueId}`, { method: "POST" });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    return {
        queue,
        isLoading,
        error,
        push: pushMutation.mutate,
        pop: popMutation.mutate,
        isPushing: pushMutation.isPending,
        isPopping: popMutation.isPending,
    };
};
