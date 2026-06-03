import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { audioEngine } from "@/features/audio/audioEngine";
import { makeToast } from "@/features/toast/Toast";

import { getTrackDisplayMetadata, trackBaseToQueueTrack } from "@/track/track.utils";

import type { QueueTrack } from "@/track/track.types";
import type { PopMutationProps, PushMutationProps, PushNextMutationProps, ReorderMutationProps, SetAllPlaylistMutationProps, SetFirstMutationProps } from "@/store/hooks/hooks.types";
import type { SetFirstQueueResponse, SetAllQueueResponse, PushQueueResponse, PushNextQueueResponse, PopQueueResponse, ShuffleQueueResponse, ReorderQueueResponse } from "./hooks.responses";


export const useQueue = () => {
    const queryClient = useQueryClient();
    const queryKey = ["tracks", "play_queue"];
    
    //fetch queue
    const getQueue = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await fetch(`/queue/get`, {
                method: "GET",
            });
            if (!response.ok) throw new Error("Failed to fetch queue");
            
            const data = await response.json();
            return data.queue as QueueTrack[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    //set the first track in the queue
    const setFirstMutation = useMutation({
        mutationFn: async ({ track }: SetFirstMutationProps) => {
            const response = await fetch(`/queue/set-first?track_id=${track.id}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to set first entry in queue");

            const data = await response.json();
            return data as SetFirstQueueResponse;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey }); // cancel outgoing refetches so they dont rewrite optimistic changes

            const rollbackQueue = queryClient.getQueryData(queryKey); //get the rollback state

            //play audio and update the local cached queue optimistically
			if (variables.track.downloaded) {
				audioEngine.playTrack({ trackId: variables.track.id, forceRestart: true });

                const tempQueueTrack = trackBaseToQueueTrack(variables.track, -1); //typecast to a QueueTrack with -1 default queueId field

                queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                    return [tempQueueTrack, ...(old?.slice(1) || [])];
                });
			}

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
            if (data.downloadRequired) {
                makeToast("Downloading: ", titleDisplay);
            } else {
                makeToast("Playing: ", titleDisplay);
            }
        },
    });

    //reorder queue tracks
    const reorderMutation = useMutation({
        mutationFn: async ({ sourceQueueId, targetQueueId, below }: ReorderMutationProps) => {
            const response = await fetch(`/queue/reorder`, { 
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sourceQueueId,
                    targetQueueId,
                    below,
                }),
            });
            if (!response.ok) throw new Error("Failed to reorder within queue");

            const data = await response.json();
            return data as ReorderQueueResponse;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                if (!old) return []; //handle undefined, then replace position of the track and try saving the newly sorted queue

                // POSITION CHECKING GUARD
                if (variables.sourceQueueId === variables.targetQueueId) return old;

                const sourceIdx = old.findIndex(t => t.queueId === variables.sourceQueueId);
                const targetIdx = old.findIndex(t => t.queueId === variables.targetQueueId);

                if (variables.below && targetIdx === sourceIdx - 1) return old;
                if (!variables.below && targetIdx === sourceIdx + 1) return old;

                //modification
                const cleanList = [...old]
                const [moved] = cleanList.splice(sourceIdx, 1);

                const freshTargetIdx = cleanList.findIndex(t => t.queueId === variables.targetQueueId);
                const insertionIndex = variables.below ? freshTargetIdx + 1 : freshTargetIdx;

                cleanList.splice(insertionIndex, 0, moved);
                return cleanList
            });

            return { rollbackQueue };
        },
        onError: (err, variables, context) => {
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
            const response = await fetch(`/queue/push?track_id=${track.id}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data as PushQueueResponse;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            //optimistically update queue if available immediately
            if (variables.track.downloaded) {
                const tempQueueTrack = trackBaseToQueueTrack(variables.track, -1); //typecast to a QueueTrack with -1 default queueId field

                queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                    return [...(old || []), tempQueueTrack];
                });
            }

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
            if (data.downloadRequired) {
                makeToast("Downloading: ", titleDisplay);
            } else {
                makeToast("Queued: ", titleDisplay);
            }
        },
    });

    //push a track to the front of the queue
    const pushNextMutation = useMutation({
        mutationFn: async ({ track }: PushNextMutationProps) => {
            const response = await fetch(`/queue/push-next?track_id=${track.id}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to push to queue");

            const data = await response.json();
            return data as PushNextQueueResponse;
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
            if (data.downloadRequired) {
                makeToast("Downloading: ", titleDisplay);
            } else {
                makeToast("Next: ", titleDisplay);
            }
        },
    });

    // remove a track from the queue
    const popMutation = useMutation({
        mutationFn: async ({ queueTrack }: PopMutationProps) => {
            const response = await fetch(`/queue/pop?queue_id=${queueTrack.queueId}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to pop from queue");

            const data = await response.json();
            return data as PopQueueResponse;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData<QueueTrack[]>(queryKey);

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

            if (variables.showToast) {
                const { titleDisplay } = getTrackDisplayMetadata(variables.queueTrack);
                makeToast("Removed: ", titleDisplay);
            }
        },
    });

    // shuffle
    const shuffleMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/queue/shuffle`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to shuffle queue");

            const data = await response.json();
            return data as ShuffleQueueResponse;
        },
        onError: (err, variables, context) => {
            makeToast("Error");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, data.queue);

            makeToast("", "Shuffled");
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
        shuffle: shuffleMutation.mutate,
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
            const response = await fetch(`/queue/set-all/playlist/${playlist.id}${query}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to set queue");

            const data = await response.json();
            return data as SetAllQueueResponse;
        },
        onSuccess: (data, variables) => {
            const oldQueue = queryClient.getQueryData<QueueTrack[]>(queryKey);
            if (data.setCount > 0 && oldQueue && oldQueue.length > 0) {                
                queryClient.setQueryData(queryKey, data.queue);

                //special handling for iOS breaking due to swipes not allowing audio event play/loading
                if (!audioEngine.isPaused()) {
                    audioEngine.setQueueFlag = true; //set an internal flag to force onEnded to behave differently: src/features/audio/AudioLogic.tsx
                    audioEngine.seek(audioEngine.getDuration() - 0.1); //scrub to the end of the current track. this skirts the iOS blocking audio play on 

                    makeToast(variables.sortmode !== 2 ? "Playing: " : "Shuffled: ", variables.playlist.name);
                } else {
                    audioEngine.seek(0);

                    makeToast(variables.sortmode !== 2 ? "Queue: " : "Shuffled: ", variables.playlist.name); //require user interaction (tap) to start audio, for consistency across platforms
                }
            } else if (data.skipCount > 0) {
                makeToast("Queueing: ", variables.playlist.name); //no downloaded tracks available, but downloading is happening on skipCount tracks
            } else {
                makeToast("Empty: ", variables.playlist.name); //empty playlist
            }
        },
        onError: (err) => {
            console.log("Set queue failed.");
        },
    });

    // clear the remaining queue
    const clearMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/queue/clear`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to clear queue");

            const data = await response.json();
            return data;
        },
        onMutate: async() => {
            await queryClient.cancelQueries({ queryKey });
            const rollbackQueue = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: QueueTrack[] | undefined) => {
                if (!old || old.length === 0) return []; //should never happen, but handle

                return [old[0]]; //return only first item
            });

            return { rollbackQueue };
        },
        onError: (err, variables, context) => {
            if (context?.rollbackQueue) {
                queryClient.setQueryData(queryKey, context.rollbackQueue);
            }
            console.log("Optimistic queue clear failed, rolling back.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, data.queue);

            makeToast("", "Queue cleared");
        },
    });

    return {
        setPlaylist: setAllPlaylistMutation.mutate,
        clearQueue: clearMutation.mutate,
    };
};