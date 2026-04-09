// src/model/model.utils.ts
import { makeToast } from '@/features/toast/Toast';
import { useQueue } from '@/store/hooks/useQueue';

import type { QueueId, QueueTrack, TrackActionProps, TrackBase } from '@/model/model.types';


export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setFirst, push, pop } = useQueue();

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


export const trackBaseToQueueTrack = (
    track: TrackBase, 
    queueId: QueueId = -1,
    position: number = -1,
): QueueTrack => ({
    ...track,
    queueId,
    position
});