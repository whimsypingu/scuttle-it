// src/track/track.utils.ts
import { useQueue } from '@/store/hooks/useQueue';
import { useEditTarget } from '@/features/edit/EditProvider';
import { useLikesMutations } from '@/store/hooks/useLikes';

import { makeToast } from '@/features/toast/Toast';

import type { PlaylistTrack, QueueId, QueueTrack, TrackActionProps, TrackBase } from '@/track/track.types';


export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setFirst, push, pushNext, pop } = useQueue();
    const { setEditTarget } = useEditTarget();
    const { setLike } = useLikesMutations();

    const handleAction = (props: TrackActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "setFirst": //set first in queue
                setFirst({
                    track: props.track,
                });
                break;

            case "queueLast": //add to queue
                push({
                    track: props.track,
                });
                break;

            case "queueNext": //push next
                pushNext({
                    track: props.track,
                });
                break;

            case "delete": //NOT USED
                makeToast(props.action);
                break;

            case "deleteQueue": //delete from queue
                pop({
                    queueTrack: props.queueTrack,
                    showToast: true,
                });
                break;

            case "edit": //open a track editing popup
                setEditTarget({ //ActiveEditTarget
                    type: "editTrack",
                    data: props.track,
                });
                break;

            case "like": //like a track
                setLike({
                    track: props.track,
                    liked: true,
                });
                break;

            case "unlike": //unlike a track
                setLike({
                    track: props.track,
                    liked: false,
                });
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


// extract the original title and artists
export const getTrackSourceMetadata = (track?: TrackBase): { title: string, artists: string } => {
    if (!track) { //handle null tracks
        return { title: "---", artists: "---" };
    }

    const title = track.title ?? "---";
    const artists = track.artists?.map(a => a.name).join(", ") ?? "---";

    return { title, artists };
}


export const getTrackSourceLink = (track?: TrackBase): { link: string } => {
    if (!track) {
        return { link: "---" };
    }
    
    //currently default to youtube link
    const link = `https://youtube.com/watch?v=${track.id}`;

    return { link };
}


// extract the best display title and artist string
export const getTrackDisplayMetadata = (track?: TrackBase): { titleDisplay: string, artistDisplay: string } => {
    if (!track) { //handle null tracks
        return { titleDisplay: "---", artistDisplay: "---" };
    }

    const titleDisplay = track.titleDisplay ?? track.title ?? "---";
    const artistDisplay = track.artists?.map(a => a.nameDisplay ?? a.name).join(", ") ?? "---";

    return { titleDisplay, artistDisplay };
}