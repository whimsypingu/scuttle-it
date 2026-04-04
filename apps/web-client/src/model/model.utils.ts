// src/model/model.utils.ts
import { makeToast } from '@/features/toast/Toast';
import { useQueue } from '@/store/hooks/useQueue';

import type { TrackActionProps } from '@/model/model.types';


export const useTrackActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { push, pop } = useQueue();

    const handleAction = (props: TrackActionProps) => {
        switch (props.action) {
            case "queueLast": //add to queue
                console.log(props.action);
                makeToast(props.action);
                push(props.trackId);
                break;

            case "delete":
                console.log(props.action);
                makeToast(props.action);
                break;

            case "deleteQueue": //delete from queue
                console.log(props.action);
                makeToast(props.action);
                pop(props.queueId);
                break;

            case "edit":
                console.log(props.action);
                makeToast(props.action);
                break;

            case "like":
                console.log(props.action);
                makeToast(props.action);
                break;
        }
    };

    return handleAction;
};
