import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { QueueTrack, TrackBase } from "@/model/model.types";
import { trackBaseToQueueTrack } from "@/model/model.utils";
import { useEffect } from "react";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["play_queue"];
    
    //fetch queue
    const getQueue = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("useQueue triggered");

            const response = await fetch(`/queue/get`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch queue");
            
            const data = await response.json();
            return data.queue as QueueTrack[];
        },
        staleTime: 1000 * 60 * 5, 
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

            const tempQueueTrack = trackBaseToQueueTrack(track, -1); //typecast to a QueueTrack with -1 default queueId field

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

    const reorderMutation = useMutation({
        mutationFn: async ({ queueTrack, targetPosition }: { queueTrack: QueueTrack; targetPosition: number }) => {
            const response = await fetch(`/queue/reorder?queue_id=${queueTrack.queueId}&target_position=${targetPosition}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to reorder within queue");

            const data = await response.json();
            return data;
        },
        onMutate: async ({ queueTrack, targetPosition }: { queueTrack: QueueTrack; targetPosition: number }) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                if (!old) return []; //handle undefined, then replace position of the track and try saving the newly sorted queue
                return old
                    .map(t => t.queueId === queueTrack.queueId ? { ...t, position: targetPosition } : t)
                    .sort((a, b) => a.position - b.position);
            });

            return { rollbackQueue };
        },
        onError: (err, queueTrack, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic reorder queue failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);
        },
    });

    //push a track to the end of the queue
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

            const tempQueueTrack = trackBaseToQueueTrack(track, -1); //typecast to a QueueTrack with -1 default queueId field

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

    //push a track to the front of the queue
    const pushNextMutation = useMutation({
        mutationFn: async (track: TrackBase) => {
            const response = await fetch(`/queue/push-next?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (track: TrackBase) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            const tempQueueTrack = trackBaseToQueueTrack(track, -1); //typecast to a QueueTrack with -1 default queueId field -- could cause problems

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                if (!old || old.length === 0) {
                    return [tempQueueTrack];
                }

                return [old[0], tempQueueTrack, ...old.slice(1)];
            });

            return { rollbackQueue };
        },
        onError: (err, track, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic push to next position in queue failed, rolling back.");
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

    // //prefetching --this should be debounced to prevent spamming the service worker and recalculating stuff, but I can't figure it out
    // useEffect(() => {
    //     if (!("serviceWorker" in navigator)) return;

    //     const sendQueueToSW = () => {
    //         if (navigator.serviceWorker.controller && getQueue.data?.length) {
    //             const prefetchWindow = getQueue.data.slice(0, 10); //EMERGENCY: don't hardcode 10 items to prefetch, either dynamically changed or a defined constant
    //             navigator.serviceWorker.controller.postMessage({
    //                 type: "UPDATE_PREFETCH_QUEUE", //see: sw.js -> eventListener("message")
    //                 tracks: prefetchWindow
    //             });

    //             console.log("Sent prefetch window to Service Worker:", prefetchWindow.length);
    //         }
    //     }

    //     sendQueueToSW(); //try sending immediately

    //     //initial load, as soon as a service worker claims the page
    //     if (!navigator.serviceWorker.controller) {
    //         navigator.serviceWorker.addEventListener("controllerchange", sendQueueToSW);
    //         return () => {
    //             navigator.serviceWorker.removeEventListener("controllerchange", sendQueueToSW);
    //         };
    //     }
    // }, [getQueue.data]);

    return {
        queue: getQueue.data ?? [],
        refetch: getQueue.refetch,
        isLoading: getQueue.isLoading,
        error: getQueue.error,
        setFirst: setFirstMutation.mutate,
        reorder: reorderMutation.mutate,
        push: pushMutation.mutate,
        pushNext: pushNextMutation.mutate,
        pop: popMutation.mutate,
        isPushing: pushMutation.isPending,
        isPopping: popMutation.isPending,
    };
};
