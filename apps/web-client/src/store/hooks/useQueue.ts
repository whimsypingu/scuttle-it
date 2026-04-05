import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { QueueTrack, TrackBase } from "@/model/model.types";
import { toQueueTrackWithQueueId } from "@/model/model.utils";
import { useAudio } from "@/features/audio/AudioProvider";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["play_queue"];

    const audio = useAudio();
    
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

    const setFirstMutation = useMutation({
        mutationFn: async (track: TrackBase) => {
            const response = await fetch(`/queue/set-first?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to set first entry in queue");

            const data = await response.json();
            console.log(data);
            return data;
            // return await response.json();
        },
        onMutate: async (track: TrackBase) => {
            //audio engine immediately here?
            audio.playTrack(track.id).catch(e => console.error("Audio failed:", e));
            
            await queryClient.cancelQueries({ queryKey }); // cancel outgoing refetches so they dont rewrite optimistic changes

            const rollbackQueue = queryClient.getQueryData(queryKey); //get the rollback state

            const queueTrack = toQueueTrackWithQueueId(track, -1); //typecast to a QueueTrack with -1 default queueId field
            console.log("queueTrack:", queueTrack);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                const result = [queueTrack, ...(old?.slice(1) || [])];

                console.log("optimistic state:", result);

                return result;
                // return [queueTrack, old.slice(1)];
            })

            return { rollbackQueue }; //return context for rollback
        },
        onError: (err, track, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic setFirst failed, rolling back.");
        },
        onSuccess: (data) => {
            console.log("Mutation Success. Full Data:", data);
            if (!data.queue) {
                console.error("CRITICAL: 'queue' field missing in response! Check FastAPI return shape.");
            }
            queryClient.setQueryData(queryKey, data.queue); //immediately swap the optimistic -1 queueId for DB-assigned queueId
        }
    });

    const pushMutation = useMutation({
        mutationFn: async (track: TrackBase) => {
            const response = await fetch(`/queue/push?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");
            return await response.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    const popMutation = useMutation({
        mutationFn: async (queueTrack: QueueTrack) => {
            const response = await fetch(`/queue/pop?queue_id=${queueTrack.queueId}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to pop from queue");
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
        setFirst: setFirstMutation.mutate,
        push: pushMutation.mutate,
        pop: popMutation.mutate,
        isPushing: pushMutation.isPending,
        isPopping: popMutation.isPending,
    };
};
