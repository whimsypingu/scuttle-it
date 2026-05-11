// src/track/track.utils.ts
import { useQueue } from '@/store/hooks/useQueue';
import { useEditTarget } from '@/features/edit/EditProvider';
import { useLikesMutations } from '@/store/hooks/useLikes';

import { makeToast } from '@/features/toast/Toast';

import type { PlaylistTrack, QueueId, QueueTrack, TrackActionProps, TrackBase } from '@/track/track.types';
import type { ActiveEditTarget } from '@/features/edit/edit.types';
import type { PopMutationProps, PushMutationProps, PushNextMutationProps, SetFirstMutationProps, SetLikeMutationProps } from '@/store/hooks/hooks.types';


export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setFirst, push, pushNext, pop } = useQueue();
    const { setEditTarget } = useEditTarget();
    const { setLike } = useLikesMutations();

    const handleAction = (props: TrackActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "setFirst": //set first in queue
                const setFirstTrackVars: SetFirstMutationProps = {
                    track: props.track,
                    successMsg: "Playing",
                };
                setFirst(setFirstTrackVars);
                break;

            case "queueLast": //add to queue
                const pushTrackVars: PushMutationProps = {
                    track: props.track,
                    successMsg: "Queued",
                };
                push(pushTrackVars);
                break;

            case "queueNext": //push next
                const pushNextTrackVars: PushNextMutationProps = {
                    track: props.track,
                    successMsg: "Next",
                };
                pushNext(pushNextTrackVars);
                break;

            case "delete": //NOT USED
                makeToast(props.action);
                break;

            case "deleteQueue": //delete from queue
                const popTrackVars: PopMutationProps = {
                    queueTrack: props.queueTrack,
                    successMsg: "Removed",
                };
                pop(popTrackVars);
                break;

            case "edit": //open a track editing popup
                const editTrackTarget: ActiveEditTarget = {
                    type: "editTrack", 
                    data: props.track,
                };
                setEditTarget(editTrackTarget);
                break;

            case "like": //like a track
                const setLikeVars: SetLikeMutationProps = {
                    track: props.track,
                    liked: true,
                    successMsg: "Liked",
                };
                setLike(setLikeVars);
                break;

            case "unlike": //unlike a track
                const setUnlikeVars: SetLikeMutationProps = {
                    track: props.track,
                    liked: false,
                    successMsg: "Removed",
                };
                setLike(setUnlikeVars);
                break; 
        }
    };

    return handleAction;
};


//convert a TrackBase to a PlaylistTrack object, inflating with default -1 values for fields addedAt and for position
export const trackBaseToPlaylistTrack = (
    track: TrackBase, 
    addedAt: number = -1,
    position: number = -1,
): PlaylistTrack => ({
    ...track,
    addedAt,
    position
});


//convert a TrackBase to a QueueTrack object, inflating with default -1 values for fields queueId and position
export const trackBaseToQueueTrack = (
    track: TrackBase, 
    queueId: QueueId = -1,
    position: number = -1,
): QueueTrack => ({
    ...track,
    queueId,
    position
});


// extract the best display title and artist string
export const getTrackDisplayMetadata = (track?: TrackBase): { titleDisplay: string, artistDisplay: string } => {
    if (!track) { //handle null tracks
        return { titleDisplay: "---", artistDisplay: "---" }
    }

    const titleDisplay = track.titleDisplay ?? track.title ?? "---";
    const artistDisplay = track.artists?.map(a => a.nameDisplay ?? a.name).join(", ") ?? "---";

    return { titleDisplay, artistDisplay };
}