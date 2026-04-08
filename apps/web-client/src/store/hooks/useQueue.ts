import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { QueueTrack, TrackBase } from "@/model/model.types";
import { toQueueTrackWithQueueId } from "@/model/model.utils";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["play_queue"];
    
    //fetch queue
    const { data: queue = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("useQueue triggered");

            const response = await fetch(`/queue/get`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch queue");
            
            const data = await response.json();
            return data.queue as QueueTrack[];
        },
        staleTime: Infinity, 
    });

    //set the first track in the queue
    const setFirstMutation = useMutation({
        mutationFn: async (track: TrackBase) => {
            const response = await fetch(`/queue/set-first?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to set first entry in queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (track: TrackBase) => {
            await queryClient.cancelQueries({ queryKey }); // cancel outgoing refetches so they dont rewrite optimistic changes

            const rollbackQueue = queryClient.getQueryData(queryKey); //get the rollback state

            const tempQueueTrack = toQueueTrackWithQueueId(track, -1); //typecast to a QueueTrack with -1 default queueId field

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return [tempQueueTrack, ...(old?.slice(1) || [])];
            });

            return { rollbackQueue }; //return context for rollback
        },
        onError: (err, track, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic setFirst queue failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue); //immediately swap the optimistic -1 queueId for DB-assigned queueId
        }
    });

    const pushMutation = useMutation({
        mutationFn: async (track: TrackBase) => {
            const response = await fetch(`/queue/push?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (track: TrackBase) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            const tempQueueTrack = toQueueTrackWithQueueId(track, -1); //typecast to a QueueTrack with -1 default queueId field

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return [...(old || []), tempQueueTrack];
            });

            return { rollbackQueue };
        },
        onError: (err, track, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic push queue failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    // remove a track from the queue
    const popMutation = useMutation({
        mutationFn: async (queueTrack: QueueTrack) => {
            const response = await fetch(`/queue/pop?queue_id=${queueTrack.queueId}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to pop from queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (queueTrack: QueueTrack) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return old?.filter(t => t.queueId !== queueTrack.queueId); //filter out by the unique queueId
            });

            return { rollbackQueue };
        },
        onError: (err, queueTrack, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic pop queue failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    return {
        queue,
        isLoading,
        error,
        setFirst: setFirstMutation.mutate,
        push: pushMutation.mutate,
        pop: popMutation.mutate,
        isPushing: pushMutation.isPending,
        isPopping: popMutation.isPending,
    };
};
