// src/model/model.utils.ts
import { makeToast } from '@/features/toast/Toast';
import { useQueue } from '@/store/hooks/useQueue';

import type { QueueId, QueueTrack, TrackActionProps, TrackBase } from '@/model/model.types';


export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setFirst, push, pushNext, pop } = useQueue();

    const handleAction = (props: TrackActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "setFirst": //set first in queue
                setFirst(props.track);
                break;

            case "queueLast": //add to queue
                makeToast(props.action);
                push(props.track);
                break;

            case "queueNext": //push next
                makeToast(props.action);
                pushNext(props.track);
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "deleteQueue": //delete from queue
                makeToast(props.action);
                pop(props.queueTrack);
                break;

            case "edit":
                makeToast(props.action);
                break;

            case "like":
                makeToast(props.action);
                break;
        }
    };

    return handleAction;
};


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