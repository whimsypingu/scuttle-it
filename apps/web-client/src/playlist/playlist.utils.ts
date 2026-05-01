// src/playlist/playlist.utils.ts
import { useEditTarget } from '@/features/edit/EditProvider';

import { makeToast } from '@/features/toast/Toast';

import type { ActiveEditTarget } from '@/features/edit/edit.types';
import type { PlaylistActionProps } from '@/playlist/playlist.types';


export const usePlaylistActionHandler = () => {
    //access the mutations from the tanstack query hook
    const { setEditTarget } = useEditTarget();

    const handleAction = (props: PlaylistActionProps) => {
        console.log(props.action);
        
        switch (props.action) {
            case "pin": //pin a playlist
                makeToast(props.action);
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "play":
                makeToast(props.action);
                break;

            case "delete":
                makeToast(props.action);
                break;

            case "shufflePlay":
                makeToast(props.action);
                break;

            case "edit": //open a playlist editing popup
                makeToast(props.action);
                // const editTrackTarget: ActiveEditTarget = {
                //     type: "editTrack", 
                //     data: props.track,
                // };
                // setEditTarget(editTrackTarget);
                break;
        }
    };

    return handleAction;
};
