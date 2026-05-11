import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { audioEngine } from "@/features/audio/audioEngine";

import { getTrackDisplayMetadata, trackBaseToQueueTrack } from "@/track/track.utils";

import type { QueueTrack } from "@/track/track.types";
import type { PopMutationProps, PushMutationProps, PushNextMutationProps, ReorderMutationProps, SetAllPlaylistMutationProps, SetFirstMutationProps } from "@/store/hooks/hooks.types";
import { makeToast } from "@/features/toast/Toast";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["tracks", "play_queue"];
    
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
        mutationFn: async ({ track }: SetFirstMutationProps) => {
            const response = await fetch(`/queue/set-first?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to set first entry in queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey }); // cancel outgoing refetches so they dont rewrite optimistic changes

            const rollbackQueue = queryClient.getQueryData(queryKey); //get the rollback state

            const tempQueueTrack = trackBaseToQueueTrack(variables.track, -1); //typecast to a QueueTrack with -1 default queueId field

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return [tempQueueTrack, ...(old?.slice(1) || [])];
            });

            return { rollbackQueue }; //return context for rollback
        },
        onError: (err, variables, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic setFirst queue failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue); //immediately swap the optimistic -1 queueId for DB-assigned queueId

            const { titleDisplay } = getTrackDisplayMetadata(variables.track);
            const msg = `Playing: ${titleDisplay}`;
            makeToast(msg);
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async ({ queueTrack, targetPosition }: ReorderMutationProps) => {
            const response = await fetch(`/queue/reorder?queue_id=${queueTrack.queueId}&target_position=${targetPosition}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to reorder within queue");

            const data = await response.json();
            return data;
        },
        onMutate: async ({ queueTrack, targetPosition }) => {
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
        mutationFn: async ({ track }: PushMutationProps) => {
            const response = await fetch(`/queue/push?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            const tempQueueTrack = trackBaseToQueueTrack(variables.track, -1); //typecast to a QueueTrack with -1 default queueId field

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return [...(old || []), tempQueueTrack];
            });

            return { rollbackQueue };
        },
        onError: (err, variables, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic push queue failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue);

            const { titleDisplay } = getTrackDisplayMetadata(variables.track);
            const msg = `Queued: ${titleDisplay}`;
            makeToast(msg);
        },
    });

    //push a track to the front of the queue
    const pushNextMutation = useMutation({
        mutationFn: async ({ track }: PushNextMutationProps) => {
            const response = await fetch(`/queue/push-next?track_id=${track.id}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            const tempQueueTrack = trackBaseToQueueTrack(variables.track, -1); //typecast to a QueueTrack with -1 default queueId field -- could cause problems

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                if (!old || old.length === 0) {
                    return [tempQueueTrack];
                }

                return [old[0], tempQueueTrack, ...old.slice(1)];
            });

            return { rollbackQueue };
        },
        onError: (err, variables, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic push to next position in queue failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue);

            const { titleDisplay } = getTrackDisplayMetadata(variables.track);
            const msg = `Next: ${titleDisplay}`;
            makeToast(msg);
        },
    });

    // remove a track from the queue
    const popMutation = useMutation({
        mutationFn: async ({ queueTrack }: PopMutationProps) => {
            const response = await fetch(`/queue/pop?queue_id=${queueTrack.queueId}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to pop from queue");

            const data = await response.json();
            return data;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                return old?.filter(t => t.queueId !== variables.queueTrack.queueId); //filter out by the unique queueId
            });

            return { rollbackQueue };
        },
        onError: (err, variables, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic pop queue failed, rolling back.");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue);

            const { titleDisplay } = getTrackDisplayMetadata(variables.queueTrack);
            const msg = `Removed: ${titleDisplay}`;
            makeToast(msg);
        },
    });

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


export const useSetQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["tracks", "play_queue"];

    // set a playlist as the queue, and start playing when loaded. does not optimistically update the queue
    const setAllPlaylistMutation = useMutation({
        mutationFn: async ({ playlist, sortmode }: SetAllPlaylistMutationProps) => {
            const query = sortmode !== undefined ? `?sortmode=${sortmode}` : "";
            const response = await fetch(`/queue/set-all/playlist/${playlist.id}${query}`, { method: "POST" });

            if (!response.ok) throw new Error("Failed to set queue");

            const data = await response.json();
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue);

            if (data.queue && data.queue.length > 0) {
                const firstTrack = data.queue[0];
                audioEngine.playTrack({ trackId: firstTrack.id, forceRestart: true }); //immediately start playing on success
            }

            const msg = `Playing: ${variables.playlist.name}`;
            makeToast(msg);
        },
        onError: (err) => {
            console.log("Set queue failed.");
        },
    });

    return {
        setPlaylist: setAllPlaylistMutation.mutate,
    };
};